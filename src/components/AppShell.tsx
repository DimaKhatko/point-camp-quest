import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FindYourClanModal } from "./pc/FindYourClanModal";
import { useEffect, useState, type ReactNode } from "react";

const tabs = [
  { to: "/",           label: "Wallet",     icon: WalletIcon },
  { to: "/clans",      label: "Clans",      icon: ClansIcon },
  { to: "/challenges", label: "Challenges", icon: ChallengeIcon },
  { to: "/rewards",    label: "Rewards",    icon: RewardIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [showClanReveal, setShowClanReveal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("pc.clanRevealed");
    if (!seen) setShowClanReveal(true);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[oklch(0.97_0.02_295)] via-background to-[oklch(0.94_0.04_300)] flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen bg-background shadow-[0_0_60px_-20px_oklch(0.36_0.18_295/0.3)] overflow-hidden">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-yellow/30 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-24 w-72 h-72 rounded-full bg-mint/30 blur-3xl" />

        <main className="relative pb-28">{children}</main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40">
          <div className="mx-3 mb-3 rounded-3xl border border-border/70 bg-surface/90 backdrop-blur-xl shadow-[0_10px_30px_-10px_oklch(0.36_0.18_295/0.35)]">
            <ul className="grid grid-cols-4 px-2 py-2">
              {tabs.map((t) => {
                const active = pathname === t.to;
                const Icon = t.icon;
                return (
                  <li key={t.to}>
                    <Link
                      to={t.to}
                      className="relative flex flex-col items-center justify-center gap-1 py-2 rounded-2xl"
                    >
                      {active && (
                        <motion.span
                          layoutId="tabpill"
                          className="absolute inset-1 rounded-2xl bg-gradient-to-br from-purple to-purple-glow"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <Icon className={`relative w-5 h-5 ${active ? "text-yellow" : "text-ink-soft"}`} />
                      <span className={`relative text-[10px] font-semibold tracking-wide ${active ? "text-white" : "text-ink-soft"}`}>
                        {t.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {showClanReveal && (
          <FindYourClanModal onClose={() => {
            window.localStorage.setItem("pc.clanRevealed", "1");
            setShowClanReveal(false);
          }} />
        )}
      </div>
    </div>
  );
}

// icons


function WalletIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="16" cy="12.5" r="1.5" fill="currentColor"/>
    </svg>
  );
}
function ClansIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 5 L21 14 L11 14 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}
function ChallengeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M13 2 L4 14 H11 L10 22 L20 10 H13 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}
function RewardIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3 L14 9 L20 9 L15 13 L17 19 L12 15 L7 19 L9 13 L4 9 L10 9 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}
