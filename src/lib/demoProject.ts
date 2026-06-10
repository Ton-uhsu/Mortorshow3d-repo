import { defaultFloorPlanImage, defaultFloorPlanSize } from "../data/defaultFloorPlan";
import { CATEGORY_COLORS } from "../constants/editor";
import type {
  BoothCatalogEntry,
  BoothObject,
  DoorObject,
  FloorPlanSize,
  WalkwayObject,
} from "../types";
import { createBoothId, createDoorId, createWalkwayId } from "./mapObjects";

const PDF_PREVIEW_WIDTH = 1255;
const PDF_PREVIEW_HEIGHT = 893;

interface AZoneBoothDraft {
  code: string;
  depth: number;
  width: number;
  x: number;
  y: number;
}

function rectFromPdfPreview(
  code: string,
  x: number,
  y: number,
  width: number,
  depth: number,
): AZoneBoothDraft {
  const inset = Math.min(5, Math.max(2, Math.min(width, depth) * 0.08));

  return {
    code,
    depth: Math.max(depth - inset * 2, 6) / PDF_PREVIEW_HEIGHT,
    width: Math.max(width - inset * 2, 6) / PDF_PREVIEW_WIDTH,
    x: (x + inset) / PDF_PREVIEW_WIDTH,
    y: (y + inset) / PDF_PREVIEW_HEIGHT,
  };
}

function getPrimaryBoothCode(code: string) {
  return code.split(",")[0]?.trim() || code;
}

function getCatalogEntryForBooth(
  code: string,
  catalogEntries: BoothCatalogEntry[],
) {
  const primaryCode = getPrimaryBoothCode(code);

  return catalogEntries.find((entry) => entry.code === primaryCode);
}

function createAZoneBooth(
  draft: AZoneBoothDraft,
  catalogEntries: BoothCatalogEntry[],
): BoothObject {
  const catalogEntry = getCatalogEntryForBooth(draft.code, catalogEntries);
  const displayName =
    catalogEntry?.brandEnglish || catalogEntry?.brandThai || draft.code;

  return {
    id: createBoothId(),
    name: displayName,
    boothCode: draft.code,
    category: "premium",
    color: CATEGORY_COLORS.premium,
    logoUrl: catalogEntry?.logoUrl ?? null,
    x: draft.x,
    y: draft.y,
    width: draft.width,
    depth: draft.depth,
    extrudeHeight: draft.width * draft.depth > 0.006 ? 0.62 : 0.42,
    rotation: 0,
  };
}

function createAZoneDoor(booth: BoothObject, index: number): DoorObject {
  return {
    id: createDoorId(),
    name: `A zone door ${index}`,
    boothId: booth.id,
    edge: "bottom",
    x: booth.x + booth.width / 2,
    y: booth.y + booth.depth,
  };
}

function createWalkway(
  name: string,
  points: Array<{ x: number; y: number }>,
  width = 0.014,
): WalkwayObject {
  return {
    id: createWalkwayId(),
    name,
    points,
    width,
  };
}

export const A_ZONE_PDF_PATH =
  `${import.meta.env.BASE_URL}Doc/THAI-Construction-Manual-10022026-pages-2-rotated-pages.pdf`;
export const A_ZONE_FLOOR_PLAN_IMAGE_PATH =
  `${import.meta.env.BASE_URL}Doc/a-zone-demo-floor-plan.png`;
export const A_ZONE_FLOOR_PLAN_SIZE: FloorPlanSize = {
  height: PDF_PREVIEW_HEIGHT,
  width: PDF_PREVIEW_WIDTH,
};

export function buildAZonePdfDemo(
  floorPlanImage: string,
  floorPlanSize: FloorPlanSize,
  catalogEntries: BoothCatalogEntry[] = [],
) {
  const boothDrafts = [
    rectFromPdfPreview("A22", 334, 323, 84, 116),
    rectFromPdfPreview("A20", 419, 323, 78, 116),
    rectFromPdfPreview("A16,A18", 498, 323, 88, 116),
    rectFromPdfPreview("A14", 587, 323, 86, 116),
    rectFromPdfPreview("A12", 674, 323, 56, 116),
    rectFromPdfPreview("A12/1", 731, 323, 45, 116),
    rectFromPdfPreview("A10", 777, 323, 84, 116),
    rectFromPdfPreview("A8", 862, 323, 81, 116),
    rectFromPdfPreview("A6", 944, 323, 82, 116),
    rectFromPdfPreview("A4", 1027, 323, 78, 116),
    rectFromPdfPreview("A2", 1106, 323, 59, 116),
    rectFromPdfPreview("A27", 269, 352, 64, 86),
    rectFromPdfPreview("A29", 224, 444, 58, 114),
    rectFromPdfPreview("A28", 283, 444, 46, 114),
    rectFromPdfPreview("A26", 330, 443, 54, 80),
    rectFromPdfPreview("A29/1", 239, 526, 38, 18),
    rectFromPdfPreview("A29/2", 239, 546, 38, 18),
    rectFromPdfPreview("A25", 385, 444, 72, 114),
    rectFromPdfPreview("A24", 458, 444, 76, 114),
    rectFromPdfPreview("A23", 535, 444, 72, 114),
    rectFromPdfPreview("A21", 608, 444, 76, 114),
    rectFromPdfPreview("A19", 685, 444, 74, 114),
    rectFromPdfPreview("A17", 760, 444, 53, 114),
    rectFromPdfPreview("A15", 814, 444, 46, 114),
    rectFromPdfPreview("A13", 861, 444, 53, 114),
    rectFromPdfPreview("A11", 915, 444, 54, 114),
    rectFromPdfPreview("A9", 970, 444, 52, 114),
    rectFromPdfPreview("A7", 1023, 444, 76, 114),
    rectFromPdfPreview("A5", 1100, 444, 64, 114),
    rectFromPdfPreview("A3", 1165, 444, 42, 114),
    rectFromPdfPreview("A1", 1210, 444, 34, 59),
    rectFromPdfPreview("A1/1", 1210, 506, 34, 52),
  ];
  const booths = boothDrafts.map((draft) => createAZoneBooth(draft, catalogEntries));
  const startBooth = booths.find((booth) => booth.boothCode === "A22") ?? booths[0];
  const endBooth = booths.find((booth) => booth.boothCode === "A1") ?? booths.at(-1)!;
  const doors = [
    createAZoneDoor(startBooth, 1),
    createAZoneDoor(endBooth, 2),
  ];
  const startDoor = doors[0];
  const endDoor = doors[1];
  const upperRoadY = 0.32;
  const centerRoadY = 0.493;
  const lowerRoadY = 0.635;
  const leftRoadX = 0.19;
  const rightRoadX = Math.min(0.985, Math.max(0.95, endDoor.x));
  const middleRoadX = 0.55;
  const walkways = [
    createWalkway("A zone outer road loop", [
      { x: leftRoadX, y: upperRoadY },
      { x: rightRoadX, y: upperRoadY },
      { x: rightRoadX, y: lowerRoadY },
      { x: leftRoadX, y: lowerRoadY },
      { x: leftRoadX, y: upperRoadY },
    ], 0.012),
    createWalkway("A zone center road", [
      { x: leftRoadX, y: centerRoadY },
      { x: rightRoadX, y: centerRoadY },
    ], 0.016),
    createWalkway("A zone middle connector", [
      { x: middleRoadX, y: upperRoadY },
      { x: middleRoadX, y: lowerRoadY },
    ], 0.011),
    createWalkway("A22 door link", [
      { x: startDoor.x, y: startDoor.y },
      { x: startDoor.x, y: centerRoadY },
      { x: leftRoadX, y: centerRoadY },
    ], 0.011),
    createWalkway("A1 door link", [
      { x: endDoor.x, y: endDoor.y },
      { x: endDoor.x, y: centerRoadY },
      { x: rightRoadX, y: centerRoadY },
    ], 0.011),
  ];

  return {
    booths,
    doors,
    floorName: "A Zone Booth Code Demo",
    floorPlanImage,
    floorPlanSize,
    fromDoorId: doors[0]?.id ?? null,
    selectedObject: { type: "booth" as const, id: booths[0]?.id ?? "" },
    toDoorId: doors[1]?.id ?? null,
    walkways,
  };
}

export function buildRouteDemo() {
  const demoBoothA: BoothObject = {
    id: createBoothId(),
    name: "Demo booth A",
    category: "standard",
    color: CATEGORY_COLORS.standard,
    x: 0.34,
    y: 0.3,
    width: 0.16,
    depth: 0.2,
    extrudeHeight: 0.7,
    rotation: 0,
  };
  const demoBoothB: BoothObject = {
    id: createBoothId(),
    name: "Demo booth B",
    category: "standard",
    color: CATEGORY_COLORS.standard,
    x: 0.65,
    y: 0.3,
    width: 0.16,
    depth: 0.2,
    extrudeHeight: 0.7,
    rotation: 0,
  };
  const demoBoothC: BoothObject = {
    id: createBoothId(),
    name: "Demo booth C",
    category: "service",
    color: CATEGORY_COLORS.service,
    x: 0.78,
    y: 0.57,
    width: 0.1,
    depth: 0.16,
    extrudeHeight: 0.7,
    rotation: 0,
  };
  const walkways: WalkwayObject[] = [
    {
      id: createWalkwayId(),
      name: "main walkway",
      points: [
        { x: 0.42, y: 0.5 },
        { x: 0.42, y: 0.66 },
        { x: 0.73, y: 0.66 },
        { x: 0.73, y: 0.5 },
      ],
      width: 0.024,
    },
    {
      id: createWalkwayId(),
      name: "branch walkway",
      points: [
        { x: 0.73, y: 0.66 },
        { x: 0.84, y: 0.66 },
        { x: 0.84, y: 0.73 },
      ],
      width: 0.02,
    },
  ];
  const doorA: DoorObject = {
    id: createDoorId(),
    name: "door A",
    boothId: demoBoothA.id,
    edge: "bottom",
    x: demoBoothA.x + demoBoothA.width / 2,
    y: demoBoothA.y + demoBoothA.depth,
  };
  const doorB: DoorObject = {
    id: createDoorId(),
    name: "door B",
    boothId: demoBoothB.id,
    edge: "bottom",
    x: demoBoothB.x + demoBoothB.width / 2,
    y: demoBoothB.y + demoBoothB.depth,
  };
  const doorC: DoorObject = {
    id: createDoorId(),
    name: "door C",
    boothId: demoBoothC.id,
    edge: "bottom",
    x: demoBoothC.x + demoBoothC.width / 2,
    y: demoBoothC.y + demoBoothC.depth,
  };

  return {
    booths: [demoBoothA, demoBoothB, demoBoothC],
    doors: [doorA, doorB, doorC],
    floorName: "Route Demo",
    floorPlanImage: defaultFloorPlanImage,
    floorPlanSize: defaultFloorPlanSize,
    fromDoorId: doorA.id,
    selectedObject: { type: "door" as const, id: doorA.id },
    toDoorId: doorB.id,
    walkways,
  };
}
