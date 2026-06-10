import { defaultFloorPlanImage, defaultFloorPlanSize } from "../data/defaultFloorPlan";
import { CATEGORY_COLORS } from "../constants/editor";
import type { BoothObject, DoorObject, WalkwayObject } from "../types";
import { createBoothId, createDoorId, createWalkwayId } from "./mapObjects";

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
