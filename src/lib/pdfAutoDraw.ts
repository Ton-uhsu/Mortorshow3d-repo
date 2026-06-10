import { CATEGORY_COLORS, MAIN_BOTTOM_CODES, MAIN_TOP_CODES } from "../constants/editor";
import type { BoothCatalogEntry, BoothObject, RectDraft } from "../types";
import { extractPdfBoothLabels, type PdfBoothLabel } from "./floorPlanPdf";
import { clamp } from "./geometry";
import { createBoothId, getCatalogCategory } from "./mapObjects";

export type PdfSource = string | Uint8Array | null;

interface PixelRect {
  x: number;
  y: number;
  width: number;
  depth: number;
}

function insetPixelRect(
  rect: PixelRect,
  pageWidth: number,
  pageHeight: number,
  insetX: number,
  insetY: number,
): RectDraft {
  const x = rect.x + insetX;
  const y = rect.y + insetY;
  const width = Math.max(rect.width - insetX * 2, 8);
  const depth = Math.max(rect.depth - insetY * 2, 8);

  return {
    x: clamp(x / pageWidth, 0, 0.98),
    y: clamp(y / pageHeight, 0, 0.98),
    width: clamp(width / pageWidth, 0.015, 0.96),
    depth: clamp(depth / pageHeight, 0.015, 0.96),
  };
}

function createBoothFromRect(
  label: PdfBoothLabel,
  catalogEntries: BoothCatalogEntry[],
  rect: RectDraft,
  extrudeHeight = 0.2,
): BoothObject {
  const entry = catalogEntries.find((item) => item.code === label.code);
  const category = entry
    ? getCatalogCategory(entry)
    : /^M/i.test(label.code)
      ? "service"
      : "premium";

  return {
    id: createBoothId(),
    name: label.code,
    boothCode: entry?.code,
    category,
    color: CATEGORY_COLORS[category],
    x: clamp(rect.x, 0, 0.98),
    y: clamp(rect.y, 0, 0.98),
    width: clamp(rect.width, 0.02, 0.96),
    depth: clamp(rect.depth, 0.02, 0.96),
    extrudeHeight,
    rotation: 0,
  };
}

function createRowBooths(
  labels: PdfBoothLabel[],
  catalogEntries: BoothCatalogEntry[],
  pageWidth: number,
  pageHeight: number,
  topPx: number,
  bottomPx: number,
) {
  if (!labels.length) {
    return [] as BoothObject[];
  }

  const sorted = [...labels].sort((left, right) => left.x - right.x);
  const boundaries = sorted.map((label, index) => {
    if (index === 0) {
      const next = sorted[index + 1];
      const gap = next ? next.x - label.x : pageWidth * 0.08;
      return clamp(label.x - gap * 0.5, 0, pageWidth);
    }

    const previous = sorted[index - 1];
    return (previous.x + label.x) / 2;
  });

  boundaries.push(
    (() => {
      const last = sorted.at(-1)!;
      const previous = sorted.at(-2);
      const gap = previous ? last.x - previous.x : pageWidth * 0.08;
      return clamp(last.x + gap * 0.5, 0, pageWidth);
    })(),
  );

  return sorted.map((label, index) =>
    createBoothFromRect(
      label,
      catalogEntries,
      insetPixelRect(
        {
          x: boundaries[index],
          y: topPx,
          width: boundaries[index + 1] - boundaries[index],
          depth: bottomPx - topPx,
        },
        pageWidth,
        pageHeight,
        3.5,
        5,
      ),
      0.2,
    ),
  );
}

function createLooseBooth(
  label: PdfBoothLabel,
  catalogEntries: BoothCatalogEntry[],
  widthPx: number,
  heightPx: number,
  offsetXPx = 2,
  offsetYPx = 6,
) {
  return createBoothFromRect(
    label,
    catalogEntries,
    insetPixelRect(
      {
        x: label.x - offsetXPx,
        y: label.y - offsetYPx,
        width: widthPx,
        depth: heightPx,
      },
      label.pageWidth,
      label.pageHeight,
      /^M/i.test(label.code) ? 1.5 : 2,
      /^M/i.test(label.code) ? 1.5 : 2.5,
    ),
    0.2,
  );
}

export async function buildSuggestedBoothsFromPdf(
  source: string | Uint8Array,
  catalogEntries: BoothCatalogEntry[],
) {
  const labels = await extractPdfBoothLabels(source);
  const pageWidth = labels[0]?.pageWidth ?? 1;
  const pageHeight = labels[0]?.pageHeight ?? 1;
  const mainTop = labels.filter((label) => MAIN_TOP_CODES.has(label.code));
  const mainBottom = labels.filter((label) => MAIN_BOTTOM_CODES.has(label.code));
  const remaining = labels.filter(
    (label) => !MAIN_TOP_CODES.has(label.code) && !MAIN_BOTTOM_CODES.has(label.code),
  );

  const looseBooths = remaining.map((label) => {
    if (label.code === "A1/1") {
      return createLooseBooth(label, catalogEntries, 28, 22, 3, 8);
    }

    if (/^A\d+\/\d+$/i.test(label.code)) {
      return createLooseBooth(label, catalogEntries, 20, 14, 2, 4);
    }

    if (/^M\d+/i.test(label.code)) {
      return createLooseBooth(
        label,
        catalogEntries,
        label.y < 90 ? 18 : 24,
        label.y < 90 ? 16 : 22,
        2,
        5,
      );
    }

    return createLooseBooth(label, catalogEntries, 26, 62, 4, 8);
  });

  return [
    ...createRowBooths(mainTop, catalogEntries, pageWidth, pageHeight, 6, 68),
    ...createRowBooths(mainBottom, catalogEntries, pageWidth, pageHeight, 83, 154),
    ...looseBooths,
  ];
}
