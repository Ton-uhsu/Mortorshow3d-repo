import { useEffect, useState } from "react";
import type React from "react";
import type {
  BoothObject,
  DoorObject,
  RectDraft,
  RoutePoint,
  SelectedMapObject,
  ToolMode,
  WalkwayObject,
} from "../../types";
import { clamp } from "../../lib/geometry";
import {
  getNearestBoothEdge,
  getNormalizedPoint,
  getOrthogonalPoint,
  MIN_SIZE,
  normalizeDraft,
  type DragState,
  type PointDragState,
  type ResizeState,
} from "./editorUtils";

interface UseFloorPlanEditorInteractionsOptions {
  booths: BoothObject[];
  onAddBooth: (rect: RectDraft) => void;
  onAddDoor: (door: Omit<DoorObject, "id" | "name">) => void;
  onAddWalkway: (points: RoutePoint[]) => void;
  onSelectObject: (selection: SelectedMapObject) => void;
  onUpdateBooth: (id: string, patch: Partial<BoothObject>) => void;
  onUpdateWalkway: (id: string, patch: Partial<WalkwayObject>) => void;
  toolMode: ToolMode;
}

export function useFloorPlanEditorInteractions({
  booths,
  onAddBooth,
  onAddDoor,
  onAddWalkway,
  onSelectObject,
  onUpdateBooth,
  onUpdateWalkway,
  toolMode,
}: UseFloorPlanEditorInteractionsOptions) {
  const [draft, setDraft] = useState<RectDraft | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [pointDragState, setPointDragState] = useState<PointDragState | null>(null);
  const [walkwayDraft, setWalkwayDraft] = useState<RoutePoint[] | null>(null);
  const [walkwayPreviewPoint, setWalkwayPreviewPoint] = useState<RoutePoint | null>(null);

  useEffect(() => {
    if (toolMode !== "draw-walkway") {
      setWalkwayDraft(null);
      setWalkwayPreviewPoint(null);
    }
  }, [toolMode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (toolMode !== "draw-walkway" || !walkwayDraft) {
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        if (walkwayDraft.length >= 2) {
          onAddWalkway(walkwayDraft);
        }

        setWalkwayDraft(null);
        setWalkwayPreviewPoint(null);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setWalkwayDraft(null);
        setWalkwayPreviewPoint(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onAddWalkway, toolMode, walkwayDraft]);

  const handleCanvasPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    container: HTMLDivElement | null,
  ) => {
    if (!container) {
      return;
    }

    const bounds = container.getBoundingClientRect();
    const point = getNormalizedPoint(event.clientX, event.clientY, bounds);

    if (toolMode === "place-door") {
      const snappedDoor = getNearestBoothEdge(point, booths);

      if (snappedDoor) {
        onAddDoor({
          boothId: snappedDoor.boothId,
          edge: snappedDoor.edge,
          x: snappedDoor.x,
          y: snappedDoor.y,
        });
      }

      return;
    }

    if (toolMode === "draw-walkway") {
      setWalkwayDraft((current) => {
        const lastPoint = current?.at(-1);
        const nextPoint = lastPoint ? getOrthogonalPoint(lastPoint, point) : point;

        if (
          lastPoint &&
          Math.hypot(nextPoint.x - lastPoint.x, nextPoint.y - lastPoint.y) < 0.006
        ) {
          return current;
        }

        return current ? [...current, nextPoint] : [point];
      });
      setWalkwayPreviewPoint(point);
      return;
    }

    if (toolMode !== "draw-booth") {
      if (toolMode === "select") {
        onSelectObject(null);
      }
      return;
    }

    setDraft({ x: point.x, y: point.y, width: 0, depth: 0 });
  };

  const handleCanvasPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
    container: HTMLDivElement | null,
  ) => {
    if (!container) {
      return;
    }

    const bounds = container.getBoundingClientRect();
    const point = getNormalizedPoint(event.clientX, event.clientY, bounds);

    if (draft) {
      setDraft({
        ...draft,
        width: point.x - draft.x,
        depth: point.y - draft.y,
      });
      return;
    }

    if (walkwayDraft) {
      const lastPoint = walkwayDraft.at(-1);
      setWalkwayPreviewPoint(lastPoint ? getOrthogonalPoint(lastPoint, point) : point);
      return;
    }

    if (pointDragState) {
      const nextPoints = pointDragState.originPoints.map((originPoint, index) =>
        index === pointDragState.pointIndex ? point : originPoint,
      );

      onUpdateWalkway(pointDragState.walkwayId, { points: nextPoints });
      return;
    }

    if (dragState) {
      if (dragState.type === "booth") {
        const current = booths.find((booth) => booth.id === dragState.id);

        if (!current) {
          return;
        }

        const patch = {
          x: clamp(dragState.originX + (point.x - dragState.startX), 0, 1 - current.width),
          y: clamp(dragState.originY + (point.y - dragState.startY), 0, 1 - current.depth),
        };

        onUpdateBooth(dragState.id, patch);
      } else {
        const nextPoints = dragState.originPoints?.map((originPoint) => ({
          x: clamp(originPoint.x + (point.x - dragState.startX), 0, 1),
          y: clamp(originPoint.y + (point.y - dragState.startY), 0, 1),
        }));

        if (nextPoints) {
          onUpdateWalkway(dragState.id, { points: nextPoints });
        }
      }
      return;
    }

    if (!resizeState || resizeState.type !== "booth") {
      return;
    }

    const width = clamp(
      resizeState.originWidth + (point.x - resizeState.startX),
      MIN_SIZE,
      1,
    );
    const depth = clamp(
      resizeState.originDepth + (point.y - resizeState.startY),
      MIN_SIZE,
      1,
    );
    const current = booths.find((booth) => booth.id === resizeState.id);

    if (!current) {
      return;
    }

    const patch = {
      width: clamp(width, MIN_SIZE, 1 - current.x),
      depth: clamp(depth, MIN_SIZE, 1 - current.y),
    };

    onUpdateBooth(resizeState.id, patch);
  };

  const handleCanvasPointerUp = () => {
    if (draft) {
      const normalized = normalizeDraft(draft);

      if (normalized.width >= MIN_SIZE && normalized.depth >= MIN_SIZE) {
        const rect = {
          x: normalized.x,
          y: normalized.y,
          width: clamp(normalized.width, MIN_SIZE, 1 - normalized.x),
          depth: clamp(normalized.depth, MIN_SIZE, 1 - normalized.y),
        };

        onAddBooth(rect);
      }

      setDraft(null);
    }

    setDragState(null);
    setPointDragState(null);
    setResizeState(null);
  };

  return {
    draft,
    dragState,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    resizeState,
    setDragState,
    setPointDragState,
    setResizeState,
    walkwayDraft,
    walkwayPreviewPoint,
  };
}
