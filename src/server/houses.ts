// Server-only House counters and auto-balance logic.
//
// The smaller House is derived from two persisted counters — we NEVER scan the
// users collection to count heads. A rotation counter breaks ties fairly.
import "@tanstack/react-start/server-only";

import type { DocumentReference, Firestore, Transaction } from "firebase-admin/firestore";
import type { House } from "../lib/app-entry";

export const HOUSES = ["circles", "spikes"] as const;

export function isHouse(value: unknown): value is House {
  return value === "circles" || value === "spikes";
}

export interface HouseCounters {
  circles: number;
  spikes: number;
  /** Bumped on every tie-break so equal Houses alternate the winner. */
  rotation: number;
}

const META_COLLECTION = "meta";
const COUNTERS_DOC_ID = "houseCounters";

export function countersRef(db: Firestore): DocumentReference {
  return db.collection(META_COLLECTION).doc(COUNTERS_DOC_ID);
}

/** Read the counters inside a transaction (missing doc → all zeros). */
export async function readCounters(db: Firestore, tx: Transaction): Promise<HouseCounters> {
  const snap = await tx.get(countersRef(db));
  const data = (snap.data() ?? {}) as Partial<HouseCounters>;
  return {
    circles: data.circles ?? 0,
    spikes: data.spikes ?? 0,
    rotation: data.rotation ?? 0,
  };
}

/**
 * Auto-balance: choose the smaller House (lower counter). On a tie, alternate
 * using the rotation counter so equal Houses don't systematically favor one
 * side. Returns the chosen House plus the counters to persist (chosen House
 * incremented; rotation bumped only on a tie).
 */
export function assignSmallerHouse(counters: HouseCounters): {
  house: House;
  next: HouseCounters;
} {
  let house: House;
  let rotation = counters.rotation;

  if (counters.circles < counters.spikes) {
    house = "circles";
  } else if (counters.spikes < counters.circles) {
    house = "spikes";
  } else {
    // Tie: alternate deterministically and advance the rotation.
    house = counters.rotation % 2 === 0 ? "circles" : "spikes";
    rotation = counters.rotation + 1;
  }

  return { house, next: { ...counters, rotation, [house]: counters[house] + 1 } };
}

/** Add one head to a specific House (admin confirm_house — no auto-balance). */
export function addToHouse(counters: HouseCounters, house: House): HouseCounters {
  return { ...counters, [house]: counters[house] + 1 };
}
