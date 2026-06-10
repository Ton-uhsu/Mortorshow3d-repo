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

export const DEFAULT_PDF_ASSET = "/Doc/THAI-Construction-Manual-crop.pdf";
export const DEFAULT_CSV_ASSET = "/config/Mortorshow3d-config.csv";

export const MAIN_TOP_CODES = new Set([
  "A22",
  "A20",
  "A16,A18",
  "A14",
  "A12",
  "A12/1",
  "A10",
  "A8",
  "A6",
  "A4",
  "A2",
]);

export const MAIN_BOTTOM_CODES = new Set([
  "A25",
  "A24",
  "A23",
  "A21",
  "A19",
  "A17",
  "A15",
  "A13",
  "A11",
  "A9",
  "A7",
  "A5",
  "A3",
  "A1",
]);
