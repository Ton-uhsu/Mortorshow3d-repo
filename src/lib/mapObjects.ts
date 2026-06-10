import { CATEGORY_COLORS } from "../constants/editor";
import type {
  BoothCatalogEntry,
  BoothObject,
  DoorObject,
  RectDraft,
  WalkwayObject,
} from "../types";
import { clamp } from "./geometry";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
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
    extrudeHeight: 0.2,
    rotation: 0,
  };
}

export function createWalkwayFromDraft(
  rect: RectDraft,
  index: number,
): WalkwayObject {
  return {
    id: createWalkwayId(),
    name: `walkway${index}`,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    depth: rect.depth,
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

export function patchBoothWithinBounds(
  booth: BoothObject,
  patch: Partial<BoothObject>,
): BoothObject {
  const nextX = patch.x ?? booth.x;
  const nextY = patch.y ?? booth.y;
  const nextWidth = patch.width ?? booth.width;
  const nextDepth = patch.depth ?? booth.depth;

  return {
    ...booth,
    ...patch,
    x: clamp(nextX, 0, 1 - nextWidth),
    y: clamp(nextY, 0, 1 - nextDepth),
    width: clamp(nextWidth, 0.02, 1 - nextX),
    depth: clamp(nextDepth, 0.02, 1 - nextY),
  };
}

export function patchWalkwayWithinBounds(
  walkway: WalkwayObject,
  patch: Partial<WalkwayObject>,
): WalkwayObject {
  const nextX = patch.x ?? walkway.x;
  const nextY = patch.y ?? walkway.y;
  const nextWidth = patch.width ?? walkway.width;
  const nextDepth = patch.depth ?? walkway.depth;

  return {
    ...walkway,
    ...patch,
    x: clamp(nextX, 0, 1 - nextWidth),
    y: clamp(nextY, 0, 1 - nextDepth),
    width: clamp(nextWidth, 0.02, 1 - nextX),
    depth: clamp(nextDepth, 0.02, 1 - nextY),
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
    };
  }

  const shouldReplaceName =
    !booth.name.trim() || /^booth\d+$/i.test(booth.name) || booth.name === booth.boothCode;
  const category = getCatalogCategory(entry);

  return {
    ...booth,
    boothCode: entry.code,
    name: shouldReplaceName ? entry.code : booth.name,
    category,
    color: CATEGORY_COLORS[category],
  };
}
