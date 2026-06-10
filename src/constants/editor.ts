import type { BoothCategory } from "../types";

export const CATEGORY_COLORS: Record<BoothCategory, string> = {
  standard: "#60a5fa",
  premium: "#f59e0b",
  food: "#ef4444",
  stage: "#8b5cf6",
  service: "#14b8a6",
};

export const BOOTH_CATEGORIES: Array<{
  value: BoothCategory;
  label: string;
  color: string;
}> = [
  { value: "standard", label: "Standard", color: CATEGORY_COLORS.standard },
  { value: "premium", label: "Premium", color: CATEGORY_COLORS.premium },
  { value: "food", label: "Food", color: CATEGORY_COLORS.food },
  { value: "stage", label: "Stage", color: CATEGORY_COLORS.stage },
  { value: "service", label: "Service", color: CATEGORY_COLORS.service },
];

export const DEFAULT_CSV_ASSET = `${import.meta.env.BASE_URL}config/Mortorshow3d-config.csv`;
