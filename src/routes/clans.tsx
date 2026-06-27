import { createFileRoute } from "@tanstack/react-router";
import { clans, leaderboard, user } from "../lib/mock";

export const Route = createFileRoute("/clans")({
  head: () => ({
    meta: [
      { title: "Clans · Point Camp" },
      { name: "description", content: "Circles vs Spikes — the eternal rivalry." },
    ],
  }),
  component: Clans,
});

function Clans() {
  const circlesPct = (clans.circles.score / clans.circles.target) * 100;
  const spikesPct = (clans.spikes.score / clans.spikes.target) * 100;

  return (
    <div className="px-5 pt-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Season 2</p>
        <h1 className="font-display text-3xl font-bold leading-tight">The eternal rivalry</h1>
        <p className="mt-1 text-sm text-muted-foreground">Two clans. One legend. Pick a side — for life.</p>
      </header>

      {/* Clan cards */}
      <div className="mt-5 space-y-3">
        {/* Circles */}
        <article className="relative overflow-hidden rounded-[28px] p-5 text-purple-deep shadow-[var(--shadow-glow-mint)]"
          style={{ background: "var(--gradient-circle)" }}>
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/30" />
          <div className="pointer-events-none absolute -right-12 top-10 h-16 w-16 rounded-full bg-purple-deep/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white/70">
                <div className="h-6 w-6 rounded-full bg-purple-deep" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">Clan of</p>
                <h2 className="font-display text-2xl font-bold leading-none">Circles</h2>
              </div>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums">{clans.circles.score.toLocaleString()}</p>
          </div>
          <div className="relative mt-4 h-2 rounded-full bg-white/40 overflow-hidden">
            <div className="h-full bg-purple-deep" style={{ width: `${circlesPct}%` }} />
          </div>
          <p className="relative mt-2 text-[11px] opacity-80">{clans.circles.members.toLocaleString()} members · unity, soft power</p>
        </article>

        {/* Spikes — user's */}
        <article className="relative overflow-hidden rounded-[28px] p-5 text-white shadow-[var(--shadow-balance)]"
          style={{
            background: "var(--gradient-spike)",
            clipPath: "polygon(0 0, 100% 0, 100% 88%, 92% 100%, 0 100%)",
          }}>
          <div className="pointer-events-none absolute -right-4 -top-6 h-28 w-28 bg-yellow/40"
            style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
          <span className="absolute right-4 top-4 rounded-full bg-yellow px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-deep">Your clan</span>
          <div className="relative flex items-center justify-between pr-20">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center bg-yellow"
                style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}>
                <span className="-mb-1 text-purple-deep font-display text-lg font-bold">▲</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">Clan of</p>
                <h2 className="font-display text-2xl font-bold leading-none">Spikes</h2>
              </div>
            </div>
          </div>
          <p className="relative mt-3 font-display text-2xl font-bold tabular-nums">{clans.spikes.score.toLocaleString()}</p>
          <div className="relative mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-yellow" style={{ width: `${spikesPct}%` }} />
          </div>
          <p className="relative mt-2 text-[11px] opacity-80">{clans.spikes.members.toLocaleString()} members · drive, sharp focus</p>
        </article>
      </div>

      {/* Leaderboard */}
      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Season leaderboard</h2>
          <span className="text-[11px] text-muted-foreground">by karma</span>
        </div>
        <ul className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface divide-y divide-border">
          {leaderboard.map((row) => (
            <li key={row.rank}
              className={`flex items-center gap-3 px-4 py-3 ${row.you ? "bg-gradient-to-r from-yellow/40 via-yellow/20 to-transparent" : ""}`}>
              <span className={`w-6 text-center font-display font-bold ${row.rank <= 3 ? "text-purple" : "text-muted-foreground"}`}>
                {row.rank}
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted font-display font-bold text-purple-deep">
                {row.name[0]}
              </span>
              <span className={`shrink-0 text-base leading-none ${row.clan === "circles" ? "text-mint" : "text-yellow"}`}
                style={row.clan === "spikes" ? { color: "oklch(0.78 0.18 90)" } : undefined}>
                {row.clan === "circles" ? "●" : "▲"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate text-sm">
                  {row.name}
                  {row.you && <span className="ml-2 rounded-full bg-purple-deep px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow">You</span>}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">{row.clan}</p>
              </div>
              <span className="font-display font-bold tabular-nums">{row.karma.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
