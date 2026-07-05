import type { ReactNode } from "react";

import { useTelegramAuth } from "../lib/telegram-auth";

// Admin username shown on the "awaiting verification" screen. Public info, so
// it's a client-exposed (VITE_-prefixed) env var, not a secret.
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME ?? "the_admin";

/**
 * Gates the app by server-verified status. Intentionally minimal / unstyled.
 *
 * - Outside Telegram (browser/dev): no gating — the app stays usable.
 * - pending  → "awaiting verification" (clan/leaderboard/points stay locked
 *   because the whole app is behind this gate while house == null).
 * - rejected → neutral "access closed".
 * - active   → render the app.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isTelegram, ready, entry, entryLoading } = useTelegramAuth();

  // Not inside Telegram — let the app render as-is (dev / preview).
  if (!isTelegram) return <>{children}</>;

  // Still resolving the server-side entry flow.
  if (!ready || entryLoading || entry === null) {
    return <div>Loading…</div>;
  }

  if (entry.status === "pending") {
    return (
      <div>
        <h1>Awaiting verification</h1>
        <p>Message @{ADMIN_USERNAME} to get verified.</p>
      </div>
    );
  }

  if (entry.status === "rejected") {
    return (
      <div>
        <h1>Access closed</h1>
      </div>
    );
  }

  // active
  return <>{children}</>;
}
