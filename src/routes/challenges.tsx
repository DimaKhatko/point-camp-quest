import { createFileRoute } from "@tanstack/react-router";
import { challenges, clans } from "../lib/mock";
import { useCurrentUser } from "../lib/telegram-auth";

export const Route = createFileRoute("/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges · Point Camp" },
      { name: "description", content: "Daily streaks, weekly quests, and clan goals." },
    ],
  }),
  component: Challenges,
});

const streak = 4;
const week = ["M","T","W","T","F","S","S"];

function Challenges() {
  const user = useCurrentUser();
  const clanName = clans[user.clan].name;
  return (
    <div className="px-5 pt-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">This week</p>
        <h1 className="font-display text-3xl font-bold leading-tight">Level up</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a quest. Bank the points. Repeat.</p>
      </header>

      {/* Streak */}
      <section className="mt-5 overflow-hidden rounded-[24px] bg-gradient-to-br from-purple to-purple-glow p-5 text-white shadow-[var(--shadow-balance)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Daily streak</p>
            <p className="mt-1 font-display text-3xl font-bold">{streak}-day ⚡</p>
          </div>
          <span className="rounded-full bg-yellow px-3 py-1.5 text-xs font-bold text-purple-deep">+10 PNT today</span>
        </div>
        <div className="mt-4 flex gap-2">
          {week.map((d, i) => {
            const active = i < streak;
            return (
              <div key={i} className="flex-1 text-center">
                <div className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${
                  active ? "bg-yellow text-purple-deep" : "bg-white/15 text-white/70"
                }`}>
                  {active ? "✓" : d}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Challenge cards */}
      <section className="mt-6 space-y-3">
        {challenges.map((c) => (
          <article key={c.id} className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-xl font-bold ${
                c.kind === "clan" ? "bg-mint text-purple-deep" :
                c.kind === "photo" ? "bg-purple/10 text-purple" :
                c.kind === "quiz" ? "bg-yellow text-purple-deep" :
                "bg-purple-deep text-yellow"
              }`}>
                {c.kind === "photo" ? "◐" : c.kind === "quiz" ? "?" : c.kind === "clan" ? "●" : "✦"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold leading-tight">
                    {c.kind === "clan" ? `${clanName}: ${c.title}` : c.title}
                  </h3>
                  <span className="shrink-0 rounded-full bg-purple/10 px-2.5 py-1 text-[11px] font-bold text-purple">+{c.reward}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.subtitle}</p>

                {c.kind === "clan" && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                      <span>56,700 / 70,000</span><span>{Math.round((c.progress ?? 0) * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-mint" style={{ width: `${(c.progress ?? 0) * 100}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  {c.state === "claim" ? (
                    <button className="rounded-full bg-yellow px-4 py-1.5 text-xs font-bold text-purple-deep shadow-[var(--shadow-glow-yellow)] active:scale-[0.97] transition">
                      Claim
                    </button>
                  ) : c.state === "locked" ? (
                    <button disabled className="rounded-full border border-border bg-muted px-4 py-1.5 text-xs font-bold text-muted-foreground">
                      Crew goal · in progress
                    </button>
                  ) : (
                    <button className="rounded-full bg-purple px-4 py-1.5 text-xs font-bold text-white active:scale-[0.97] transition">
                      Start
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
