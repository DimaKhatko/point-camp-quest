export const user = {
  name: "Alex",
  initial: "A",
  clan: "spikes" as const,
  balance: 2450,
  karma: 5400,
  tier: "Legend",
  seasons: 3,
};

export const season = {
  number: 2,
  daysLeft: 16,
  totalDays: 45,
};

export const activity = [
  { id: 1, label: "Challenge done", delta: 50, tag: "challenge", when: "Today" },
  { id: 2, label: "Camp activity", delta: 120, tag: "camp", when: "Yesterday" },
  { id: 3, label: "Referral bonus", delta: 200, tag: "referral", when: "2d ago" },
  { id: 4, label: "Daily quiz", delta: 40, tag: "quiz", when: "3d ago" },
];

export const clans = {
  circles: { name: "Circles", score: 64200, target: 80000, members: 1284 },
  spikes:  { name: "Spikes",  score: 58900, target: 80000, members: 1192 },
};

export const leaderboard = [
  { rank: 1, name: "Mira",   clan: "circles", karma: 8420, you: false },
  { rank: 2, name: "Jonah",  clan: "spikes",  karma: 7980, you: false },
  { rank: 3, name: "Sasha",  clan: "circles", karma: 7110, you: false },
  { rank: 4, name: "Kai",    clan: "spikes",  karma: 6650, you: false },
  { rank: 5, name: "Alex",   clan: "spikes",  karma: 5400, you: true  },
  { rank: 6, name: "Noor",   clan: "circles", karma: 5210, you: false },
  { rank: 7, name: "Theo",   clan: "spikes",  karma: 4980, you: false },
  { rank: 8, name: "Lin",    clan: "circles", karma: 4720, you: false },
];

export const challenges = [
  { id: "photo", title: "Weekly photo challenge", subtitle: "Snap your wildest move", reward: 150, state: "start" as const, kind: "photo" },
  { id: "quiz",  title: "Daily quiz", subtitle: "3 quick questions", reward: 40, state: "claim" as const, kind: "quiz" },
  { id: "clan",  title: "reach 70,000", subtitle: "Clan collective goal", reward: 200, state: "locked" as const, kind: "clan", progress: 0.81 },
  { id: "move",  title: "Move for 20 minutes", subtitle: "Anything counts", reward: 80, state: "start" as const, kind: "move" },
];

export const rewards = [
  { id: "off",    name: "10% off next session", price: 500,  limited: true,  icon: "%" },
  { id: "hoodie", name: "Point Camp hoodie",    price: 1800, limited: false, icon: "H" },
  { id: "bunk",   name: "Pick your bunk",       price: 800,  limited: true,  icon: "B" },
  { id: "badge",  name: "Exclusive clan badge", price: 1200, limited: true,  icon: "★" },
  { id: "water",  name: "Glow water bottle",    price: 600,  limited: false, icon: "W" },
  { id: "vip",    name: "VIP camp tour",        price: 2200, limited: true,  icon: "V" },
];
