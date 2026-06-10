import { useState } from "react";
import type React from "react";
import type {
  BoothObject,
  DoorObject,
  RectDraft,
  SelectedMapObject,
  ToolMode,
  WalkwayObject,
} from "../../types";
import { clamp } from "../../lib/geometry";
import {
  getNearestBoothEdge,
  getNormalizedPoint,
  MIN_SIZE,
  normalizeDraft,
  type DragState,
  type ResizeState,
} from "./editorUtils";

interface UseFloorPlanEditorInteractionsOptions {
  booths: BoothObject[];
  onAddBooth: (rect: RectDraft) => void;
  onAddDoor: (door: Omit<DoorObject, "id" | "name">) => void;
  onAddWalkway: (rect: RectDraft) => void;
  onSelectObject: (selection: SelectedMapObject) => void;
  onUpdateBooth: (id: string, patch: Partial<BoothObject>) => void;
  onUpdateWalkway: (id: string, patch: Partial<WalkwayObject>) => void;
  toolMode: ToolMode;
  walkways: WalkwayObject[];
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
  walkways,
}: UseFloorPlanEditorInteractionsOptions) {
  const [draft, setDraft] = useState<RectDraft | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

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

    if (toolMode !== "draw-booth" && toolMode !== "draw-walkway") {
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

    if (dragState) {
      const nextX = clamp(dragState.originX + (point.x - dragState.startX), 0, 1);
      const nextY = clamp(dragState.originY + (point.y - dragState.startY), 0, 1);
      const current =
        dragState.type === "booth"
          ? booths.find((booth) => booth.id === dragState.id)
          : walkways.find((walkway) => walkway.id === dragState.id);

      if (!current) {
        return;
      }

      const patch = {
        x: clamp(nextX, 0, 1 - current.width),
        y: clamp(nextY, 0, 1 - current.depth),
      };

      if (dragState.type === "booth") {
        onUpdateBooth(dragState.id, patch);
      } else {
        onUpdateWalkway(dragState.id, patch);
      }
      return;
    }

    if (!resizeState) {
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
    const current =
      resizeState.type === "booth"
        ? booths.find((booth) => booth.id === resizeState.id)
        : walkways.find((walkway) => walkway.id === resizeState.id);

    if (!current) {
      return;
    }

    const patch = {
      width: clamp(width, MIN_SIZE, 1 - current.x),
      depth: clamp(depth, MIN_SIZE, 1 - current.y),
    };

    if (resizeState.type === "booth") {
      onUpdateBooth(resizeState.id, patch);
    } else {
      onUpdateWalkway(resizeState.id, patch);
    }
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

        if (toolMode === "draw-walkway") {
          onAddWalkway(rect);
        } else {
          onAddBooth(rect);
        }
      }

      setDraft(null);
    }

    setDragState(null);
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
    setResizeState,
  };
}
