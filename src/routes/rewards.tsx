import { createFileRoute } from "@tanstack/react-router";
import { rewards, user } from "../lib/mock";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards · Point Camp" },
      { name: "description", content: "Spend your points on stuff that actually matters." },
    ],
  }),
  component: Rewards,
});

function Rewards() {
  return (
    <div className="px-5 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Rewards</p>
          <h1 className="font-display text-3xl font-bold leading-tight">Spend it</h1>
          <p className="mt-1 text-sm text-muted-foreground">PNT only — Karma stays forever.</p>
        </div>
        <div className="shrink-0 rounded-2xl bg-gradient-to-br from-purple to-purple-glow px-4 py-3 text-right text-white shadow-[var(--shadow-card)]">
          <p className="text-[9px] uppercase tracking-[0.2em] opacity-70">Balance</p>
          <p className="font-display text-lg font-bold leading-none">
            <span className="text-yellow">✦</span> {user.balance.toLocaleString()}
          </p>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {rewards.map((r) => {
          const affordable = user.balance >= r.price;
          return (
            <article key={r.id} className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
              {r.limited && (
                <span className="absolute -right-7 top-3 rotate-45 bg-yellow px-8 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-deep">
                  Limited
                </span>
              )}
              <div className="grid h-20 place-items-center rounded-xl bg-gradient-to-br from-purple-deep/90 to-purple text-yellow shadow-inner">
                <span className="font-display text-3xl font-bold drop-shadow-[0_4px_8px_oklch(0.90_0.18_95/0.4)]">{r.icon}</span>
              </div>
              <h3 className="mt-3 font-display text-sm font-bold leading-tight">{r.name}</h3>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-display text-sm font-bold text-purple">✦ {r.price.toLocaleString()}</span>
              </div>
              <button
                disabled={!affordable}
                className={`mt-2 w-full rounded-full py-2 text-xs font-bold transition active:scale-[0.97] ${
                  affordable ? "bg-ink text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {affordable ? "Redeem" : `Need ${(r.price - user.balance).toLocaleString()}`}
              </button>
            </article>
          );
        })}
      </section>

      <p className="mt-5 rounded-2xl bg-mint/30 px-4 py-3 text-[11px] leading-relaxed text-purple-deep">
        Heads up: <span className="font-bold">PNT</span> is your spendable currency. <span className="font-bold">Karma</span> is your lifetime cred — never spent, never resets. Flex it.
      </p>
    </div>
  );
}
