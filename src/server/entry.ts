// Server function for the first-login / entry flow.
//
// This file is imported by the client to obtain the RPC stub, so it must NOT
// statically import server-only modules — the heavy server code is pulled in
// with dynamic imports inside the handler, which the compiler strips from the
// client bundle.
import { createServerFn } from "@tanstack/react-start";

import type { EntryResponse } from "../lib/app-entry";

/**
 * Verify the caller's Telegram `initData`, run the idempotent first-login flow,
 * and return the user's current status + House — or a distinguishable failure
 * reason (never throws for a validation failure, so the client can display it).
 * Call from the client as `enterApp({ data: webApp.initData })`.
 */
export const enterApp = createServerFn({ method: "POST" })
  .validator((initData: unknown): string => {
    // Accept any string (including empty) so an empty payload is classified and
    // returned as a reason instead of throwing an opaque validator error.
    if (typeof initData !== "string") {
      throw new Error("initData must be a string");
    }
    return initData;
  })
  .handler(async ({ data }): Promise<EntryResponse> => {
    const { verifyTelegramInitData, toClientReason } =
      await import("./validate-telegram-init-data");
    console.log(`[enterApp] called — initDataLength=${data.length}, empty=${!data}`);

    const result = verifyTelegramInitData(data);
    if (!result.ok) {
      const reason = toClientReason(result.failure);
      console.warn(`[enterApp] verification failed — failure=${result.failure}, reason=${reason}`);
      return { ok: false, reason };
    }

    const { runFirstLogin } = await import("./users");
    const entry = await runFirstLogin({
      user: result.data.user,
      startParam: result.data.startParam,
    });
    // status/house are not PII (pending|active|rejected, circles|spikes).
    console.log(`[enterApp] success — status=${entry.status}, house=${entry.house ?? "null"}`);
    return { ok: true, status: entry.status, house: entry.house };
  });
