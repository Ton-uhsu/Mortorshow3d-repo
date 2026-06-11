import { CATEGORY_COLORS } from "../constants/editor";
import type {
  BoothCatalogEntry,
  BoothObject,
  DoorObject,
  RoutePoint,
  RectDraft,
  WalkwayObject,
} from "../types";
import { clamp } from "./geometry";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const FOOTPRINT_HEIGHT_SCALE = 5;
const FOOTPRINT_HEIGHT_MIN = 0.22;
const FOOTPRINT_HEIGHT_MAX = 0.9;

export function getBoothFootprintHeight(width: number, depth: number) {
  const footprint = Math.max(width * depth, 0);
  const height = Math.sqrt(footprint) * FOOTPRINT_HEIGHT_SCALE;

  return Number(clamp(height, FOOTPRINT_HEIGHT_MIN, FOOTPRINT_HEIGHT_MAX).toFixed(2));
}

export function createBoothId() {
  return createId("booth");
}

export function createWalkwayId() {
  return createId("walkway");
}

export function createDoorId() {
  return createId("door");
}

export function getCatalogCategory(
  entry: BoothCatalogEntry,
): BoothObject["category"] {
  if (entry.section.includes("MOTORCYCLE")) {
    return "service";
  }

  return "premium";
}

export function createBoothFromDraft(
  rect: RectDraft,
  index: number,
): BoothObject {
  return {
    id: createBoothId(),
    name: `booth${index}`,
    category: "standard",
    color: CATEGORY_COLORS.standard,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    depth: rect.depth,
    extrudeHeight: getBoothFootprintHeight(rect.width, rect.depth),
    rotation: 0,
  };
}

export function createWalkwayFromPoints(
  points: RoutePoint[],
  index: number,
): WalkwayObject {
  return {
    id: createWalkwayId(),
    name: `walkway${index}`,
    points,
    width: 0.018,
  };
}

export function createDoorFromPlacement(
  door: Omit<DoorObject, "id" | "name">,
  index: number,
): DoorObject {
  return {
    ...door,
    id: createDoorId(),
    name: `door${index}`,
  };
}

export function repositionDoorForBooth(
  door: DoorObject,
  previousBooth: BoothObject,
  nextBooth: BoothObject,
): DoorObject {
  if (door.edge === "top" || door.edge === "bottom") {
    const ratio =
      previousBooth.width > 0
        ? clamp((door.x - previousBooth.x) / previousBooth.width)
        : 0.5;

    return {
      ...door,
      x: nextBooth.x + ratio * nextBooth.width,
      y: door.edge === "top" ? nextBooth.y : nextBooth.y + nextBooth.depth,
    };
  }

  const ratio =
    previousBooth.depth > 0
      ? clamp((door.y - previousBooth.y) / previousBooth.depth)
      : 0.5;

  return {
    ...door,
    x: door.edge === "left" ? nextBooth.x : nextBooth.x + nextBooth.width,
    y: nextBooth.y + ratio * nextBooth.depth,
  };
}

export function patchBoothWithinBounds(
  booth: BoothObject,
  patch: Partial<BoothObject>,
): BoothObject {
  const nextX = patch.x ?? booth.x;
  const nextY = patch.y ?? booth.y;
  const nextWidth = patch.width ?? booth.width;
  const nextDepth = patch.depth ?? booth.depth;
  const clampedWidth = clamp(nextWidth, 0.02, 1 - nextX);
  const clampedDepth = clamp(nextDepth, 0.02, 1 - nextY);
  const nextExtrudeHeight =
    patch.extrudeHeight ??
    (patch.width !== undefined || patch.depth !== undefined
      ? getBoothFootprintHeight(clampedWidth, clampedDepth)
      : booth.extrudeHeight);

  return {
    ...booth,
    ...patch,
    x: clamp(nextX, 0, 1 - nextWidth),
    y: clamp(nextY, 0, 1 - nextDepth),
    width: clampedWidth,
    depth: clampedDepth,
    extrudeHeight: nextExtrudeHeight,
  };
}

export function patchWalkwayWithinBounds(
  walkway: WalkwayObject,
  patch: Partial<WalkwayObject>,
): WalkwayObject {
  return {
    ...walkway,
    ...patch,
    points: (patch.points ?? walkway.points).map((point) => ({
      x: clamp(point.x),
      y: clamp(point.y),
    })),
    width: clamp(patch.width ?? walkway.width, 0.006, 0.08),
  };
}

export function duplicateBoothObject(source: BoothObject): BoothObject {
  return {
    ...source,
    id: createBoothId(),
    name: `${source.name}-copy`,
    x: clamp(source.x + 0.02, 0, 1 - source.width),
    y: clamp(source.y + 0.02, 0, 1 - source.depth),
  };
}

export function applyCatalogEntryToBooth(
  booth: BoothObject,
  entry?: BoothCatalogEntry,
): BoothObject {
  if (!entry) {
    return {
      ...booth,
      boothCode: undefined,
      logoUrl: undefined,
    };
  }

  const shouldReplaceName =
    !booth.name.trim() || /^booth\d+$/i.test(booth.name) || booth.name === booth.boothCode;
  const category = getCatalogCategory(entry);
  const brandName = entry.brandEnglish || entry.brandThai || entry.code;

  return {
    ...booth,
    boothCode: entry.code,
    logoUrl: entry.logoUrl,
    name: shouldReplaceName ? brandName : booth.name,
    category,
    color: CATEGORY_COLORS[category],
  };
}
