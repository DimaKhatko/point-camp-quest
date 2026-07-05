// Server-side validator for Telegram Mini App `initData`.
//
// The client sends the raw `window.Telegram.WebApp.initData` query string. We
// re-derive the HMAC signature from our bot token and compare it in constant
// time. Identity is taken ONLY from this verified payload — never from a
// client-supplied user id.
//
// Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
import "@tanstack/react-start/server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";

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

// Telegram recommends rejecting initData older than a day; we use one hour.
const MAX_AUTH_AGE_SECONDS = 3600;

/** Auth failure that surfaces to the client as an HTTP 401. */
function unauthorized(reason: string): Response {
  return new Response(JSON.stringify({ error: "Unauthorized", reason }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Validates a Telegram `initData` string and returns the verified contents
 * (user + deep-link start param). Throws a 401 `Response` if the signature is
 * missing/invalid or expired.
 */
export function verifyTelegramInitData(initData: string): VerifiedInitData {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    // Misconfiguration, not a client error — fail loudly with a 500.
    throw new Error("Missing required environment variable: TELEGRAM_BOT_TOKEN");
  }

  const params = new URLSearchParams(initData);

  const providedHash = params.get("hash");
  if (!providedHash) {
    throw unauthorized("missing hash");
  }
  params.delete("hash");

  // data-check-string: remaining pairs sorted by key, joined as key=value\n.
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // secret_key = HMAC_SHA256("WebAppData" as key)(bot_token)
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  // computed_hash = HMAC_SHA256(secret_key)(data_check_string)
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest();

  const providedHashBuffer = Buffer.from(providedHash, "hex");
  // timingSafeEqual requires equal-length buffers; a length mismatch already
  // means the hash is invalid, so bail before comparing.
  if (
    providedHashBuffer.length !== computedHash.length ||
    !timingSafeEqual(computedHash, providedHashBuffer)
  ) {
    throw unauthorized("invalid hash");
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate)) {
    throw unauthorized("missing auth_date");
  }
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > MAX_AUTH_AGE_SECONDS) {
    throw unauthorized("initData expired");
  }

  const userJson = params.get("user");
  if (!userJson) {
    throw unauthorized("missing user");
  }

  let user: VerifiedTelegramUser;
  try {
    user = JSON.parse(userJson) as VerifiedTelegramUser;
  } catch {
    throw unauthorized("malformed user");
  }
  if (typeof user.id !== "number") {
    throw unauthorized("missing user id");
  }

  // `start_param` is part of the signed payload, so it's safe to trust here.
  return { user, startParam: params.get("start_param"), authDate };
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
    return verifyTelegramInitData(data);
  });
