import type { BoothObject, DoorEdge, RectDraft, RoutePoint } from "../../types";
import { clamp } from "../../lib/geometry";

export interface DragState {
  id: string;
  type: "booth" | "walkway";
  originPoints?: RoutePoint[];
  originX: number;
  originY: number;
  startX: number;
  startY: number;
}

export interface ResizeState {
  id: string;
  type: "booth" | "walkway";
  originWidth: number;
  originDepth: number;
  startX: number;
  startY: number;
}

export interface PointDragState {
  originPoints: RoutePoint[];
  pointIndex: number;
  walkwayId: string;
}

export const MIN_SIZE = 0.02;
const DOOR_SNAP_DISTANCE = 0.035;

export function getNormalizedPoint(
  clientX: number,
  clientY: number,
  bounds: DOMRect,
) {
  return {
    x: clamp((clientX - bounds.left) / bounds.width),
    y: clamp((clientY - bounds.top) / bounds.height),
  };
}

export function normalizeDraft(draft: RectDraft): RectDraft {
  const x = draft.width >= 0 ? draft.x : draft.x + draft.width;
  const y = draft.depth >= 0 ? draft.y : draft.y + draft.depth;
  const width = Math.abs(draft.width);
  const depth = Math.abs(draft.depth);

  return {
    x: clamp(x),
    y: clamp(y),
    width: clamp(width, MIN_SIZE, 1),
    depth: clamp(depth, MIN_SIZE, 1),
  };
}

export function getOrthogonalPoint(anchor: RoutePoint, point: RoutePoint): RoutePoint {
  return Math.abs(point.x - anchor.x) >= Math.abs(point.y - anchor.y)
    ? { x: point.x, y: anchor.y }
    : { x: anchor.x, y: point.y };
}

export function getNearestBoothEdge(
  point: { x: number; y: number },
  booths: BoothObject[],
) {
  let nearest:
    | {
        boothId: string;
        edge: DoorEdge;
        x: number;
        y: number;
        distance: number;
      }
    | null = null;

  for (const booth of booths) {
    const candidates: Array<{
      boothId: string;
      edge: DoorEdge;
      x: number;
      y: number;
      distance: number;
    }> = [
      {
        boothId: booth.id,
        edge: "top",
        x: clamp(point.x, booth.x, booth.x + booth.width),
        y: booth.y,
        distance: 0,
      },
      {
        boothId: booth.id,
        edge: "right",
        x: booth.x + booth.width,
        y: clamp(point.y, booth.y, booth.y + booth.depth),
        distance: 0,
      },
      {
        boothId: booth.id,
        edge: "bottom",
        x: clamp(point.x, booth.x, booth.x + booth.width),
        y: booth.y + booth.depth,
        distance: 0,
      },
      {
        boothId: booth.id,
        edge: "left",
        x: booth.x,
        y: clamp(point.y, booth.y, booth.y + booth.depth),
        distance: 0,
      },
    ];

    for (const candidate of candidates) {
      candidate.distance = Math.hypot(point.x - candidate.x, point.y - candidate.y);

      if (!nearest || candidate.distance < nearest.distance) {
        nearest = candidate;
      }
    }
  }

  return nearest && nearest.distance <= DOOR_SNAP_DISTANCE ? nearest : null;
}
