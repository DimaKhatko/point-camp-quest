// Server-side validator for Telegram Mini App `initData`.
//
// The client sends the raw `window.Telegram.WebApp.initData` query string. We
// re-derive the HMAC signature from our bot token and compare it in constant
// time. Identity is taken ONLY from this verified payload — never from a
// client-supplied user id.
//
// Diagnostics: every branch logs to the Vercel runtime log with a `[initData]`
// prefix. Logs never include the token, the raw initData, or user PII — only
// lengths, booleans, param key NAMES (not values), and the auth_date age.
//
// Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
import "@tanstack/react-start/server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";

import type { EntryFailureReason } from "../lib/app-entry";

/** Verified Telegram user, parsed from the signed `user` field of initData. */
export interface VerifiedTelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

/** Verified contents of an initData string. */
export interface VerifiedInitData {
  user: VerifiedTelegramUser;
  /** The deep-link `startapp` value (e.g. `ref_123`), or null if absent. */
  startParam: string | null;
  authDate: number;
}

/** Fine-grained internal failure, named for the runtime logs. */
export type InitDataFailure =
  | "no_token"
  | "empty_init_data"
  | "missing_hash"
  | "hash_mismatch"
  | "missing_auth_date"
  | "stale"
  | "missing_user"
  | "malformed_user";

export type VerifyResult =
  | { ok: true; data: VerifiedInitData }
  | { ok: false; failure: InitDataFailure };

// Telegram recommends rejecting initData older than a day; we use one hour.
const MAX_AUTH_AGE_SECONDS = 3600;

/** Map the internal failure to the coarse, client-facing reason. */
export function toClientReason(failure: InitDataFailure): EntryFailureReason {
  switch (failure) {
    case "no_token":
      return "no_token";
    case "empty_init_data":
      return "empty_init_data";
    case "stale":
      return "stale";
    default:
      // missing_hash, hash_mismatch, missing_auth_date, missing_user, malformed_user
      return "invalid_signature";
  }
}

/**
 * Validate a Telegram `initData` string. Returns a discriminated result and
 * logs the specific failing branch (no secrets/PII) for on-device diagnosis.
 */
export function verifyTelegramInitData(initData: string): VerifyResult {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const tokenPresent = typeof token === "string" && token.length > 0;
  const initDataLength = typeof initData === "string" ? initData.length : -1;

  console.log(
    `[initData] verify start — initDataLength=${initDataLength}, empty=${!initData}, tokenPresent=${tokenPresent}, tokenLength=${token?.length ?? 0}`,
  );

  if (!tokenPresent) {
    console.error("[initData] FAIL=no_token — TELEGRAM_BOT_TOKEN missing/empty at runtime");
    return { ok: false, failure: "no_token" };
  }
  if (!initData) {
    console.warn("[initData] FAIL=empty_init_data — initData missing/empty");
    return { ok: false, failure: "empty_init_data" };
  }

  const params = new URLSearchParams(initData);
  // Key NAMES only — safe to log (no values, no PII). Reveals e.g. whether a
  // newer `signature` field is present alongside `hash`.
  const keys = [...params.keys()].sort();
  console.log(`[initData] param keys present: [${keys.join(", ")}]`);

  const providedHash = params.get("hash");
  if (!providedHash) {
    console.warn("[initData] FAIL=missing_hash — no `hash` field in initData");
    return { ok: false, failure: "missing_hash" };
  }
  params.delete("hash");

  // data-check-string: remaining pairs sorted by key, joined as key=value\n.
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // secret_key = HMAC_SHA256("WebAppData" as key)(bot_token)
  const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
  // computed_hash = HMAC_SHA256(secret_key)(data_check_string)
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest();

  const providedHashBuffer = Buffer.from(providedHash, "hex");
  // timingSafeEqual requires equal-length buffers; a length mismatch already
  // means the hash is invalid, so bail before comparing.
  const hashOk =
    providedHashBuffer.length === computedHash.length &&
    timingSafeEqual(computedHash, providedHashBuffer);
  if (!hashOk) {
    console.warn(
      `[initData] FAIL=hash_mismatch — providedHashLen=${providedHashBuffer.length}, computedHashLen=${computedHash.length}, dataCheckPairs=${params.size}, signatureFieldPresent=${keys.includes("signature")}`,
    );
    return { ok: false, failure: "hash_mismatch" };
  }

  const authDateRaw = params.get("auth_date");
  const authDate = Number(authDateRaw);
  if (!authDateRaw || !Number.isFinite(authDate)) {
    console.warn("[initData] FAIL=missing_auth_date — auth_date missing/non-numeric");
    return { ok: false, failure: "missing_auth_date" };
  }
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  console.log(`[initData] auth_date age=${ageSeconds}s, threshold=${MAX_AUTH_AGE_SECONDS}s`);
  if (ageSeconds > MAX_AUTH_AGE_SECONDS) {
    console.warn(
      `[initData] FAIL=stale — age=${ageSeconds}s exceeds threshold=${MAX_AUTH_AGE_SECONDS}s (possible clock skew or expired session)`,
    );
    return { ok: false, failure: "stale" };
  }

  const userJson = params.get("user");
  if (!userJson) {
    console.warn("[initData] FAIL=missing_user — no `user` field in initData");
    return { ok: false, failure: "missing_user" };
  }

  let user: VerifiedTelegramUser;
  try {
    user = JSON.parse(userJson) as VerifiedTelegramUser;
  } catch {
    console.warn("[initData] FAIL=malformed_user — `user` field is not valid JSON");
    return { ok: false, failure: "malformed_user" };
  }
  if (typeof user.id !== "number") {
    console.warn("[initData] FAIL=malformed_user — parsed user has no numeric id");
    return { ok: false, failure: "malformed_user" };
  }

  console.log("[initData] OK — signature valid, auth_date fresh, user parsed");
  // `start_param` is part of the signed payload, so it's safe to trust here.
  return {
    ok: true,
    data: { user, startParam: params.get("start_param"), authDate },
  };
}

/** HTTP status for a failure surfaced through the throwing wrapper. */
function statusForFailure(failure: InitDataFailure): number {
  return failure === "no_token" ? 500 : 401;
}

/**
 * Throwing variant for callers that want a hard failure (admin endpoints, the
 * standalone validator server fn). Throws a `Response` carrying the reason.
 */
export function verifyTelegramInitDataOrThrow(initData: string): VerifiedInitData {
  const result = verifyTelegramInitData(initData);
  if (!result.ok) {
    throw new Response(JSON.stringify({ error: "Unauthorized", reason: result.failure }), {
      status: statusForFailure(result.failure),
      headers: { "content-type": "application/json" },
    });
  }
  return result.data;
}

/**
 * Server function: verify a raw `initData` string and return the verified
 * contents. Call from the client as
 * `validateTelegramInitData({ data: webApp.initData })`.
 */
export const validateTelegramInitData = createServerFn({ method: "POST" })
  .validator((initData: unknown): string => {
    if (typeof initData !== "string" || initData.length === 0) {
      throw new Error("initData must be a non-empty string");
    }
    return initData;
  })
  .handler(({ data }): VerifiedInitData => {
    return verifyTelegramInitDataOrThrow(data);
  });
