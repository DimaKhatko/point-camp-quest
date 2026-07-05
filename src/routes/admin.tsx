import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { useTelegramAuth } from "../lib/telegram-auth";
import { adminActOnUser, adminListPending } from "../server/admin";
import type { AdminAction, House, PendingUser } from "../lib/app-entry";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin · Point Camp" }],
  }),
  component: AdminPage,
});

// Minimal, unstyled admin surface for manual verification. Access is enforced
// server-side (adminListPending / adminActOnUser check the caller's verified
// telegram id against ADMIN_TELEGRAM_ID); non-admins just get errors here.
function AdminPage() {
  const { initData } = useTelegramAuth();
  const [pending, setPending] = useState<PendingUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!initData) return;
    setError(null);
    try {
      setPending(await adminListPending({ data: { initData } }));
    } catch {
      setError("Not authorized, or failed to load the queue.");
      setPending([]);
    }
  }, [initData]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const act = useCallback(
    async (telegramId: number, action: AdminAction, house?: House) => {
      if (!initData || busy) return;
      setBusy(true);
      setError(null);
      try {
        await adminActOnUser({ data: { initData, telegramId, action, house } });
        await refresh();
      } catch {
        setError("Action failed.");
      } finally {
        setBusy(false);
      }
    },
    [initData, busy, refresh],
  );

  if (!initData) return <div>Open this inside Telegram as the admin.</div>;

  return (
    <div>
      <h1>Pending verification</h1>
      {error && <p>{error}</p>}
      {pending === null ? (
        <p>Loading…</p>
      ) : pending.length === 0 ? (
        <p>No pending users.</p>
      ) : (
        <ul>
          {pending.map((u) => (
            <li key={u.telegramId}>
              <span>
                {u.firstName ?? ""} {u.lastName ?? ""} (@{u.username ?? "—"}) · id {u.telegramId}
              </span>
              <button disabled={busy} onClick={() => act(u.telegramId, "confirm_house", "circles")}>
                Confirm circles
              </button>
              <button disabled={busy} onClick={() => act(u.telegramId, "confirm_house", "spikes")}>
                Confirm spikes
              </button>
              <button disabled={busy} onClick={() => act(u.telegramId, "admit_newcomer")}>
                Admit (auto-balance)
              </button>
              <button disabled={busy} onClick={() => act(u.telegramId, "reject")}>
                Reject
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
