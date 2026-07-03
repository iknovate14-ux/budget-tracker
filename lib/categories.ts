import type { Category } from "./supabase";

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "food", label: "Food" },
  { key: "petrol", label: "Petrol" },
  { key: "adhoc", label: "Ad-hoc" },
];

export function categoryLabel(key: Category): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
