// Admin verification server functions.
//
// Only the configured admin (ADMIN_TELEGRAM_ID) may call these. The caller's
// identity is taken from their verified initData — never from a client claim.
//
// Like entry.ts, this file is client-imported for its RPC stubs, so server-only
// modules are pulled in with dynamic imports inside the handlers.
import { createServerFn } from "@tanstack/react-start";

import type { AdminAction, AppEntryResult, House, PendingUser } from "../lib/app-entry";

const JSON_HEADERS = { "content-type": "application/json" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Verify initData and assert the caller is the configured admin. */
async function requireAdmin(initData: string): Promise<void> {
  const { verifyTelegramInitDataOrThrow } = await import("./validate-telegram-init-data");
  const { user } = verifyTelegramInitDataOrThrow(initData);

  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (!adminId) {
    throw new Error("Missing required environment variable: ADMIN_TELEGRAM_ID");
  }
  if (String(user.id) !== adminId) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }
}

interface AdminActionInput {
  initData: string;
  telegramId: number;
  action: AdminAction;
  house?: House;
}

/** List pending users (oldest first). Admin only. */
export const adminListPending = createServerFn({ method: "POST" })
  .validator((data: unknown): { initData: string } => {
    if (!isRecord(data) || typeof data.initData !== "string") {
      throw new Error("initData is required");
    }
    return { initData: data.initData };
  })
  .handler(async ({ data }): Promise<PendingUser[]> => {
    await requireAdmin(data.initData);
    const { listPendingUsers } = await import("./users");
    return listPendingUsers();
  });

/** Act on a pending user: confirm_house | admit_newcomer | reject. Admin only. */
export const adminActOnUser = createServerFn({ method: "POST" })
  .validator((data: unknown): AdminActionInput => {
    if (!isRecord(data)) throw new Error("invalid payload");
    const { initData, telegramId, action, house } = data;

    if (typeof initData !== "string" || initData.length === 0) {
      throw new Error("initData is required");
    }
    if (typeof telegramId !== "number" || !Number.isSafeInteger(telegramId)) {
      throw new Error("telegramId must be a number");
    }
    if (action !== "confirm_house" && action !== "admit_newcomer" && action !== "reject") {
      throw new Error("invalid action");
    }
    if (action === "confirm_house" && house !== "circles" && house !== "spikes") {
      throw new Error("house must be 'circles' or 'spikes'");
    }

    return { initData, telegramId, action, house: house as House | undefined };
  })
  .handler(async ({ data }): Promise<AppEntryResult> => {
    await requireAdmin(data.initData);
    const store = await import("./users");
    switch (data.action) {
      case "confirm_house":
        return store.confirmHouse(data.telegramId, data.house!);
      case "admit_newcomer":
        return store.admitNewcomer(data.telegramId);
      case "reject":
        return store.rejectUser(data.telegramId);
    }
  });
