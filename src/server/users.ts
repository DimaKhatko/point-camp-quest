// Server-only user store: the first-login flow and admin verification actions.
//
// Every assignment runs inside a Firestore transaction so the House counters
// can't drift under concurrent logins / double-clicks, and assignment only
// happens on the pending→active (or new→active) transition — so repeat logins
// and second devices are idempotent no-ops.
import "@tanstack/react-start/server-only";

import { FieldValue, type Timestamp } from "firebase-admin/firestore";

import { db } from "./firebase-admin";
import { addToHouse, assignSmallerHouse, countersRef, readCounters } from "./houses";
import type { AppEntryResult, House, PendingUser, UserStatus } from "../lib/app-entry";
import type { VerifiedTelegramUser } from "./validate-telegram-init-data";

const USERS_COLLECTION = "users";
const JSON_HEADERS = { "content-type": "application/json" };

/** Firestore representation of a user document (doc id = String(telegramId)). */
interface UserDoc {
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  status: UserStatus;
  house: House | null;
  referredBy: number | null;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}

function userRef(telegramId: number) {
  return db.collection(USERS_COLLECTION).doc(String(telegramId));
}

function notFound(): Response {
  return new Response(JSON.stringify({ error: "User not found" }), {
    status: 404,
    headers: JSON_HEADERS,
  });
}

function identityFields(user: VerifiedTelegramUser) {
  return {
    telegramId: user.id,
    username: user.username ?? null,
    firstName: user.first_name ?? null,
    lastName: user.last_name ?? null,
    photoUrl: user.photo_url ?? null,
  };
}

/** Parse a `ref_<telegramId>` start param; ignore self-referral and junk. */
export function parseReferral(startParam: string | null, selfId: number): number | null {
  if (!startParam) return null;
  const match = /^ref_(\d+)$/.exec(startParam);
  if (!match) return null;
  const inviterId = Number(match[1]);
  if (!Number.isSafeInteger(inviterId) || inviterId === selfId) return null;
  return inviterId;
}

/**
 * First-login flow, idempotent and transactional.
 * - Existing user: only bump lastActiveAt; never touch house/status.
 * - New user with a valid referral: auto-balance into the smaller House, active.
 * - New user without a referral: pending, no House (may be a returning veteran
 *   the app can't distinguish from a walk-in — so don't auto-balance).
 */
export async function runFirstLogin(input: {
  user: VerifiedTelegramUser;
  startParam: string | null;
}): Promise<AppEntryResult> {
  const { user, startParam } = input;
  const ref = userRef(user.id);
  const referredBy = parseReferral(startParam, user.id);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref); // READ

    if (snap.exists) {
      const existing = snap.data() as UserDoc;
      tx.update(ref, { lastActiveAt: FieldValue.serverTimestamp() }); // WRITE
      return { status: existing.status, house: existing.house ?? null };
    }

    const base = {
      ...identityFields(user),
      createdAt: FieldValue.serverTimestamp(),
      lastActiveAt: FieldValue.serverTimestamp(),
    };

    if (referredBy !== null) {
      // Referred: skip the queue, auto-balance, active.
      const counters = await readCounters(db, tx); // READ (before any write)
      const { house, next } = assignSmallerHouse(counters);
      tx.set(ref, { ...base, status: "active", house, referredBy }); // WRITE
      tx.set(countersRef(db), next); // WRITE
      return { status: "active", house };
    }

    // Walk-in: pending, no House, no auto-balance.
    tx.set(ref, { ...base, status: "pending", house: null, referredBy: null }); // WRITE
    return { status: "pending", house: null };
  });
}

/** Pending users, oldest first. */
export async function listPendingUsers(): Promise<PendingUser[]> {
  // Single-field filter (auto-indexed); sort in memory to avoid needing a
  // composite index. The pending queue is small.
  const snap = await db.collection(USERS_COLLECTION).where("status", "==", "pending").get();

  const rows: PendingUser[] = snap.docs.map((doc) => {
    const u = doc.data() as UserDoc;
    return {
      telegramId: u.telegramId,
      username: u.username ?? null,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      photoUrl: u.photoUrl ?? null,
      createdAt: u.createdAt?.toMillis?.() ?? 0,
    };
  });

  rows.sort((a, b) => a.createdAt - b.createdAt);
  return rows;
}

/**
 * Restore a veteran's House. Only acts on a pending user; a decided user is
 * returned as-is (House is lifelong — never reassign).
 */
export async function confirmHouse(telegramId: number, house: House): Promise<AppEntryResult> {
  const ref = userRef(telegramId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref); // READ
    if (!snap.exists) throw notFound();
    const u = snap.data() as UserDoc;
    if (u.status !== "pending") {
      return { status: u.status, house: u.house ?? null };
    }
    const counters = await readCounters(db, tx); // READ (before any write)
    tx.update(ref, { status: "active", house }); // WRITE
    tx.set(countersRef(db), addToHouse(counters, house)); // WRITE
    return { status: "active", house };
  });
}

/** Admit a newcomer: auto-balance into the smaller House. Idempotent. */
export async function admitNewcomer(telegramId: number): Promise<AppEntryResult> {
  const ref = userRef(telegramId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref); // READ
    if (!snap.exists) throw notFound();
    const u = snap.data() as UserDoc;
    if (u.status !== "pending") {
      return { status: u.status, house: u.house ?? null };
    }
    const counters = await readCounters(db, tx); // READ (before any write)
    const { house, next } = assignSmallerHouse(counters);
    tx.update(ref, { status: "active", house }); // WRITE
    tx.set(countersRef(db), next); // WRITE
    return { status: "active", house };
  });
}

/**
 * Reject a pending user. No House, no counter change. Only acts on a pending
 * user; anything else is returned unchanged (idempotent).
 */
export async function rejectUser(telegramId: number): Promise<AppEntryResult> {
  const ref = userRef(telegramId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref); // READ
    if (!snap.exists) throw notFound();
    const u = snap.data() as UserDoc;
    if (u.status !== "pending") {
      return { status: u.status, house: u.house ?? null };
    }
    tx.update(ref, { status: "rejected" }); // WRITE
    return { status: "rejected", house: null };
  });
}
