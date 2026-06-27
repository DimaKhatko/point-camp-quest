import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = "pointcamp.app/join/alex-9F3";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-purple-deep/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] rounded-t-[28px] bg-surface p-6 pb-8 shadow-[0_-20px_60px_-10px_oklch(0_0_0/0.35)]"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
            <div className="text-center">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-yellow to-yellow-soft shadow-[var(--shadow-glow-yellow)]">
                <span className="font-display text-2xl font-bold text-purple-deep">+300</span>
              </div>
              <h3 className="font-display text-xl font-bold">Bring your crew</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Share your link — you both pocket 300 PNT when they join.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-muted/60 px-4 py-3">
              <span className="flex-1 truncate text-sm font-medium">{link}</span>
              <button
                onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full rounded-full bg-gradient-to-r from-purple to-purple-glow py-3.5 font-semibold text-white active:scale-[0.98] transition"
            >
              Share
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
