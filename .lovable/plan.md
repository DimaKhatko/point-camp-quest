
# Point Camp — Mobile Prototype Plan

A polished, clickable mobile prototype (max-width ~430px, centered on desktop) for a gamified kids' camp loyalty app. Mock data only, no backend. Strong brand identity: stylish/youthful (crypto-wallet energy), zero rustic clichés.

## Brand system (locked into `src/styles.css`)

- **Colors** (oklch tokens):
  - `--purple` deep brand (#5B2C9D), `--purple-deep`, `--purple-glow` for gradients
  - `--yellow` energy accent (#FFD23F) → Spikes clan
  - `--mint` secondary (#7EE0C0) → Circles clan
  - Off-white surface, near-black ink, soft glass borders
- **Gradients/shadows**: `--gradient-balance` (purple → purple-glow with yellow highlight), `--shadow-glow-yellow`, `--shadow-glow-mint`, `--shadow-card`
- **Typography**: bold geometric sans — Space Grotesk (display) + Inter (body), loaded via `<link>` in `__root.tsx`, registered as `--font-display` / `--font-sans` in `@theme`
- **Shape language**: Circles clan = rounded blobs / pill shapes / mint; Spikes clan = triangles / sharp diagonals / yellow
- **Logo mark**: inline SVG combining triangular "roof/spike" over a circle — used as app icon, in headers, and as confetti elements
- **Motion**: Framer Motion for balance shine, tab transitions, confetti reveal, card press states

## Route & layout structure

```
src/routes/
  __root.tsx              (fonts, meta)
  index.tsx               (Wallet — home)
  clans.tsx
  challenges.tsx
  rewards.tsx
```

Shared shell in `src/components/AppShell.tsx`:
- Centered phone frame (max-w-[430px], min-h-screen, subtle gradient bg)
- `<Outlet />` content area
- Sticky `BottomTabBar` (Wallet / Clans / Challenges / Rewards) with glossy active pill

Shared UI in `src/components/pc/`: `LogoMark`, `BalanceCard`, `StatPill`, `SeasonBanner`, `ActivityRow`, `ClanCard`, `LeaderboardRow`, `ChallengeCard`, `RewardCard`, `FindYourClanModal`, `InviteSheet`, `Confetti`.

Mock data in `src/lib/mock.ts` (user Alex, activities, leaderboard, challenges, rewards).

## Screens

**Wallet (`/`)**
- Header: avatar, "Hey, Alex 👋", Spikes ▲ clan badge (yellow)
- Glossy balance card — purple gradient, animated diagonal shine sweep, big "✦ 2,450 PNT", yellow sparkle, "Spendable" label
- Karma stat row: "Karma 5,400 · Legend · 3 seasons"
- Season 2 banner: "16 days left" + thin progress
- Recent activity list with colored icon chips (+50, +120, +200)
- "Invite a friend → earn 300 PNT" CTA card opens InviteSheet

**Clans (`/clans`)**
- Header "The eternal rivalry"
- Two stacked clan cards:
  - Circles — rounded card, mint accents, soft circular glyph, score 64,200, progress bar
  - Spikes — angular card with clipped corners, yellow accents, triangle glyph, score 58,900, progress bar, "YOUR CLAN" tag + glow
- Season leaderboard list: rank, avatar, ●/▲ clan marker in clan color, name, karma; one row highlighted "YOU"

**Challenges (`/challenges`)**
- Streak hero: "4-day streak ⚡" with 7-dot week tracker
- Cards: Weekly photo challenge (+150 PNT, Start), Daily quiz (+40 PNT, Start), Clan goal "Circles: reach 70,000 together" with collective progress (+200 PNT, Claim disabled state), one Claim-ready card with yellow CTA

**Rewards (`/rewards`)**
- 2-col grid with "limited" yellow ribbon on select tiles
- Items: 10% off next session (500 PNT), Hoodie (1,800 PNT), Pick your bunk (800 PNT), Exclusive clan badge (1,200 PNT), plus 2 more for grid balance
- Each tile: glossy 3D-looking SVG/emoji-style icon, name, price "✦ X PNT", Redeem button
- Footnote: "Points (PNT) are separate from Karma — Karma is forever."

## Extras

- **Find your clan modal**: first visit (gate via `localStorage` flag `pc.clanRevealed`) shows full-screen overlay with "Find my clan" button → 1.2s reveal animation (pulsing logo) → "You're a Spike ▲" with geometric confetti (mix of mint circles, yellow triangles, purple squares) using Framer Motion
- **Invite sheet**: bottom sheet with mock referral link, copy button, "You both earn 300 PNT"

## Technical notes

- Tailwind v4 tokens only (no hardcoded hex in components)
- Framer Motion (`bun add framer-motion`) for shine, confetti, sheet/modal, tab press
- All routes have proper `head()` titles & descriptions
- Replace placeholder `src/routes/index.tsx`
- Mobile-first: set preview viewport to mobile after build

## Out of scope

Auth, persistence beyond `localStorage` flag, real leaderboard logic, actual redemption flow.
