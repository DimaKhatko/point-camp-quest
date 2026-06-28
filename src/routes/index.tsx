import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { season, activity } from "../lib/mock";
import { LogoMark } from "../components/pc/LogoMark";
import { InviteSheet } from "../components/pc/InviteSheet";
import { useCurrentUser } from "../lib/telegram-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wallet · Point Camp" },
      { name: "description", content: "Your points, your karma, your season — all in one place." },
    ],
  }),
  component: Wallet,
});

function Wallet() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const user = useCurrentUser();
  const pct = ((season.totalDays - season.daysLeft) / season.totalDays) * 100;

  return (
    <div className="px-5 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.name}
              className="h-11 w-11 rounded-2xl object-cover shadow-[var(--shadow-card)]"
            />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-purple to-purple-glow font-display text-lg font-bold text-white shadow-[var(--shadow-card)]">
              {user.initial}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Welcome back</p>
            <p className="font-display text-lg font-bold leading-tight">Hey, {user.name} 👋</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow px-3 py-1.5 text-xs font-bold text-purple-deep shadow-[var(--shadow-glow-yellow)]">
          <span className="text-sm leading-none">▲</span> Spikes
        </span>
      </header>

      {/* Balance card */}
      <motion.section
        initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="shine-sweep relative mt-6 overflow-hidden rounded-[28px] p-6 text-white shadow-[var(--shadow-balance)]"
        style={{ background: "var(--gradient-balance)" }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow/30 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-mint/20 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.22em] text-white/70">Spendable balance</p>
          <LogoMark size={26} />
        </div>
        <div className="relative mt-4 flex items-baseline gap-2">
          <span className="text-yellow text-3xl font-display">✦</span>
          <span className="font-display text-5xl font-bold tracking-tight tabular-nums">
            {user.balance.toLocaleString()}
          </span>
          <span className="font-display text-lg font-semibold text-white/80">PNT</span>
        </div>
        <div className="relative mt-5 flex items-center justify-between text-xs">
          <span className="text-white/70">Tap to see history</span>
          <button
            onClick={() => setInviteOpen(true)}
            className="rounded-full bg-white/15 px-3 py-1.5 font-semibold backdrop-blur-sm hover:bg-white/25 transition"
          >
            + Earn more
          </button>
        </div>
      </motion.section>

      {/* Karma + Season */}
      <section className="mt-4 grid grid-cols-5 gap-3">
        <div className="col-span-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Karma · lifetime</p>
          <p className="mt-1 font-display text-xl font-bold tabular-nums">{user.karma.toLocaleString()}</p>
          <p className="text-[11px] text-ink-soft">{user.tier} · {user.seasons} seasons</p>
        </div>
        <div className="col-span-2 rounded-2xl bg-mint p-4 text-purple-deep shadow-[var(--shadow-glow-mint)]">
          <p className="text-[10px] uppercase tracking-[0.18em] opacity-70">Season {season.number}</p>
          <p className="mt-1 font-display text-xl font-bold">{season.daysLeft}d</p>
          <p className="text-[11px] opacity-80">left to play</p>
        </div>
      </section>

      {/* Season progress */}
      <div className="mt-3 rounded-2xl bg-purple-deep/5 border border-border p-3">
        <div className="flex justify-between text-[11px] font-medium text-ink-soft">
          <span>Season progress</span><span>{Math.round(pct)}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-border overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-purple to-purple-glow" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Activity */}
      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent activity</h2>
          <button className="text-xs font-semibold text-purple">See all</button>
        </div>
        <ul className="mt-3 space-y-2">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-[0_2px_8px_-4px_oklch(0.36_0.18_295/0.15)]">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display font-bold ${
                a.tag === "referral" ? "bg-yellow text-purple-deep" :
                a.tag === "camp" ? "bg-mint text-purple-deep" :
                "bg-purple/10 text-purple"
              }`}>
                {a.tag === "referral" ? "👥" : a.tag === "camp" ? "⛺" : a.tag === "quiz" ? "?" : "✓"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{a.label}</p>
                <p className="text-[11px] text-muted-foreground">{a.when}</p>
              </div>
              <span className="font-display text-base font-bold text-purple">+{a.delta}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Invite CTA */}
      <button
        onClick={() => setInviteOpen(true)}
        className="mt-5 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-yellow to-yellow-soft p-4 text-left shadow-[var(--shadow-glow-yellow)] active:scale-[0.99] transition"
      >
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-purple-deep text-yellow font-display text-lg font-bold">+300</div>
          <div className="flex-1">
            <p className="font-display font-bold text-purple-deep">Invite a friend</p>
            <p className="text-xs text-purple-deep/70">You both pocket 300 PNT.</p>
          </div>
          <span className="text-purple-deep font-bold">→</span>
        </div>
      </button>

      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
