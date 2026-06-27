import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LogoMark } from "./LogoMark";

export function FindYourClanModal({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState<"intro" | "revealing" | "result">("intro");

  useEffect(() => {
    if (stage !== "revealing") return;
    const t = setTimeout(() => setStage("result"), 1300);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
    >
      <div className="absolute inset-0 bg-purple-deep/85 backdrop-blur-xl" />
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="relative w-full max-w-sm rounded-[28px] bg-surface p-7 text-center shadow-[0_30px_80px_-20px_oklch(0_0_0/0.5)]"
      >
        {stage === "intro" && (
          <>
            <div className="mx-auto mb-5"><LogoMark size={56} className="mx-auto" /></div>
            <h2 className="font-display text-2xl font-bold leading-tight">Welcome to Point Camp</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Two clans. One legend. Let's find out where you belong.
            </p>
            <button
              onClick={() => setStage("revealing")}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-purple to-purple-glow py-3.5 font-semibold text-white shadow-[0_12px_30px_-10px_oklch(0.45_0.22_300/0.6)] active:scale-[0.98] transition"
            >
              Find my clan
            </button>
            <button onClick={onClose} className="mt-3 text-xs text-muted-foreground">Skip for now</button>
          </>
        )}

        {stage === "revealing" && (
          <div className="py-10">
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.15, 1] }}
              transition={{ duration: 1.3, ease: "easeInOut" }}
              className="mx-auto w-20 h-20"
            >
              <LogoMark size={80} className="mx-auto" />
            </motion.div>
            <p className="mt-6 font-display text-lg">Reading your energy…</p>
          </div>
        )}

        {stage === "result" && (
          <div className="relative">
            <Confetti />
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="mx-auto mt-2 mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-purple to-purple-glow grid place-items-center shadow-[0_20px_40px_-15px_oklch(0.45_0.22_300/0.7)]"
            >
              <svg viewBox="0 0 40 40" className="w-12 h-12">
                <path d="M20 6 L34 30 L6 30 Z" fill="oklch(0.90 0.18 95)" />
              </svg>
            </motion.div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your clan</p>
            <h2 className="mt-1 font-display text-3xl font-bold">You're a Spike ▲</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Sharp, driven, always climbing. Welcome to the crew.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-ink py-3.5 font-semibold text-white active:scale-[0.98] transition"
            >
              Let's go
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 26 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {pieces.map((_, i) => {
        const shapes = ["circle", "triangle", "square"] as const;
        const colors = ["bg-yellow", "bg-mint", "bg-purple-glow"];
        const shape = shapes[i % 3];
        const color = colors[i % 3];
        const x = (Math.random() - 0.5) * 320;
        const y = (Math.random() - 0.5) * 320;
        const r = Math.random() * 360;
        const size = 6 + Math.random() * 10;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x, y, opacity: [0, 1, 0], scale: 1, rotate: r }}
            transition={{ duration: 1.6, delay: i * 0.015, ease: "easeOut" }}
            className={`absolute left-1/2 top-1/2 ${color} ${
              shape === "circle" ? "rounded-full" : shape === "square" ? "rounded-[3px]" : ""
            }`}
            style={{
              width: size,
              height: size,
              clipPath: shape === "triangle" ? "polygon(50% 0%, 100% 100%, 0% 100%)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
