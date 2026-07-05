// Server function for the first-login / entry flow.
//
// This file is imported by the client to obtain the RPC stub, so it must NOT
// statically import server-only modules — the heavy server code is pulled in
// with dynamic imports inside the handler, which the compiler strips from the
// client bundle.
import { createServerFn } from "@tanstack/react-start";

import type { AppEntryResult } from "../lib/app-entry";

/**
 * Verify the caller's Telegram `initData`, run the idempotent first-login flow,
 * and return the user's current status + House. Call from the client as
 * `enterApp({ data: webApp.initData })`.
 */
export const enterApp = createServerFn({ method: "POST" })
  .validator((initData: unknown): string => {
    if (typeof initData !== "string" || initData.length === 0) {
      throw new Error("initData must be a non-empty string");
    }
    return initData;
  })
  .handler(async ({ data }): Promise<AppEntryResult> => {
    const { verifyTelegramInitData } = await import("./validate-telegram-init-data");
    const { runFirstLogin } = await import("./users");
    const { user, startParam } = verifyTelegramInitData(data);
    return runFirstLogin({ user, startParam });
  });
