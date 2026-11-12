import type { CategoryKind, Settings } from "./types";

export const DEFAULT_CATEGORIES: { name: string; kind: CategoryKind; color: string; icon: string }[] = [
  { name: "Habitatge", kind: "expense", color: "#6366f1", icon: "🏠" },
  { name: "Supermercat", kind: "expense", color: "#22c55e", icon: "🛒" },
  { name: "Restaurants", kind: "expense", color: "#f97316", icon: "🍽️" },
  { name: "Transport", kind: "expense", color: "#0ea5e9", icon: "🚆" },
  { name: "Subministraments", kind: "expense", color: "#eab308", icon: "💡" },
  { name: "Subscripcions", kind: "expense", color: "#a855f7", icon: "📺" },
  { name: "Estudis", kind: "expense", color: "#14b8a6", icon: "🎓" },
  { name: "Oci", kind: "expense", color: "#ec4899", icon: "🎉" },
  { name: "Roba", kind: "expense", color: "#f43f5e", icon: "👕" },
  { name: "Salut", kind: "expense", color: "#ef4444", icon: "💊" },
  { name: "Bizum", kind: "expense", color: "#06b6d4", icon: "📲" },
  { name: "Altres", kind: "expense", color: "#64748b", icon: "📦" },
  { name: "Nòmina", kind: "income", color: "#16a34a", icon: "💼" },
  { name: "Beca", kind: "income", color: "#0d9488", icon: "🎓" },
  { name: "Família", kind: "income", color: "#8b5cf6", icon: "👪" },
  { name: "Projectes", kind: "income", color: "#2563eb", icon: "💻" },
  { name: "Bizum", kind: "income", color: "#06b6d4", icon: "📲" },
  { name: "Altres", kind: "income", color: "#64748b", icon: "📦" },
];

export const ACCOUNT_TYPE_LABELS = {
  checking: "Compte corrent",
  savings: "Estalvis",
  cash: "Efectiu",
  broker: "Bròquer",
  other: "Altres",
} as const;

export const FREQUENCY_LABELS = { weekly: "Setmanal", monthly: "Mensual", yearly: "Anual" } as const;

export const PALETTE = [
  "#2563eb", "#6366f1", "#a855f7", "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#16a34a", "#14b8a6", "#06b6d4", "#0ea5e9", "#64748b",
];

/** Valors per defecte del panell quan encara no hi ha fila a `settings`. */
export const DEFAULT_SETTINGS: Settings = {
  display_name: "",
  week_focus: "",
  week_focus_monday: null,
  step_goal: 8000,
  water_goal: 8,
  sleep_goal_minutes: 450,
};
