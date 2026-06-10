import type React from "react";
import { useMemo, useRef, useState } from "react";
import type {
  BoothObject,
  DoorEdge,
  DoorObject,
  FloorPlanSize,
  RectDraft,
  RoutePath,
  SelectedMapObject,
  ToolMode,
  WalkwayObject,
} from "../types";

interface FloorPlanEditorProps {
  booths: BoothObject[];
  doors: DoorObject[];
  floorPlanImage: string;
  floorPlanSize: FloorPlanSize;
  gridVisible: boolean;
  routePath: RoutePath | null;
  selectedObject: SelectedMapObject;
  showLabels: boolean;
  toolMode: ToolMode;
  walkways: WalkwayObject[];
  onAddBooth: (rect: RectDraft) => void;
  onAddDoor: (door: Omit<DoorObject, "id" | "name">) => void;
  onAddWalkway: (rect: RectDraft) => void;
  onDeleteSelected: () => void;
  onSelectObject: (selection: SelectedMapObject) => void;
  onToolModeChange: (tool: ToolMode) => void;
  onUpdateBooth: (id: string, patch: Partial<BoothObject>) => void;
  onUpdateWalkway: (id: string, patch: Partial<WalkwayObject>) => void;
}

interface DragState {
  id: string;
  type: "booth" | "walkway";
  originX: number;
  originY: number;
  startX: number;
  startY: number;
}

interface ResizeState {
  id: string;
  type: "booth" | "walkway";
  originWidth: number;
  originDepth: number;
  startX: number;
  startY: number;
}

const MIN_SIZE = 0.02;
const DOOR_SNAP_DISTANCE = 0.035;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getNormalizedPoint(
  clientX: number,
  clientY: number,
  bounds: DOMRect,
) {
  return {
    x: clamp((clientX - bounds.left) / bounds.width),
    y: clamp((clientY - bounds.top) / bounds.height),
  };
}

function normalizeDraft(draft: RectDraft): RectDraft {
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

function getNearestBoothEdge(
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

export function FloorPlanEditor({
  booths,
  doors,
  floorPlanImage,
  floorPlanSize,
  gridVisible,
  routePath,
  selectedObject,
  showLabels,
  toolMode,
  walkways,
  onAddBooth,
  onAddDoor,
  onAddWalkway,
  onDeleteSelected,
  onSelectObject,
  onToolModeChange,
  onUpdateBooth,
  onUpdateWalkway,
}: FloorPlanEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState<RectDraft | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  const selectedBooth = useMemo(
    () =>
      selectedObject?.type === "booth"
        ? booths.find((booth) => booth.id === selectedObject.id) ?? null
        : null,
    [booths, selectedObject],
  );
  const selectedWalkway = useMemo(
    () =>
      selectedObject?.type === "walkway"
        ? walkways.find((walkway) => walkway.id === selectedObject.id) ?? null
        : null,
    [selectedObject, walkways],
  );
  const selectedDoor = useMemo(
    () =>
      selectedObject?.type === "door"
        ? doors.find((door) => door.id === selectedObject.id) ?? null
        : null,
    [doors, selectedObject],
  );
  const selectedLabel =
    selectedBooth?.name ?? selectedWalkway?.name ?? selectedDoor?.name ?? null;

  const handleCanvasPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!containerRef.current) {
      return;
    }

    const bounds = containerRef.current.getBoundingClientRect();
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

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) {
      return;
    }

    const bounds = containerRef.current.getBoundingClientRect();
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

    if (resizeState) {
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
    }
  };

  const handlePointerUp = () => {
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

  return (
    <section className="editor-card">
      <header className="panel-header">
        <div>
          <p className="eyebrow">2D Editor</p>
          <h2>Floor plan canvas</h2>
        </div>
        <div className="tool-pills">
          <button
            className={toolMode === "select" ? "tool-pill active" : "tool-pill"}
            onClick={() => onToolModeChange("select")}
            type="button"
          >
            Select
          </button>
          <button
            className={toolMode === "draw-booth" ? "tool-pill active" : "tool-pill"}
            onClick={() => onToolModeChange("draw-booth")}
            type="button"
          >
            Draw booth
          </button>
          <button
            className={toolMode === "draw-walkway" ? "tool-pill active" : "tool-pill"}
            onClick={() => onToolModeChange("draw-walkway")}
            type="button"
          >
            Draw walkway
          </button>
          <button
            className={toolMode === "place-door" ? "tool-pill active" : "tool-pill"}
            onClick={() => onToolModeChange("place-door")}
            type="button"
          >
            Place door
          </button>
          <button
            className="tool-pill danger-tool"
            disabled={!selectedObject}
            onClick={onDeleteSelected}
            type="button"
          >
            Delete
          </button>
        </div>
      </header>

      <div className="editor-tips">
        <span>Booths block routes. Walkways are the only walkable zones.</span>
        <span>Doors snap to booth edges and connect booths to walkways.</span>
      </div>

      <div
        className={gridVisible ? "floor-editor grid-on" : "floor-editor"}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        ref={containerRef}
        role="presentation"
        style={{ aspectRatio: `${floorPlanSize.width} / ${floorPlanSize.height}` }}
      >
        <img alt="Uploaded floor plan" className="floor-plan-image" src={floorPlanImage} />

        {walkways.map((walkway) => {
          const isSelected = selectedObject?.type === "walkway" && selectedObject.id === walkway.id;

          return (
          <button
            className={isSelected ? "walkway-rect selected" : "walkway-rect"}
            key={walkway.id}
            onClick={(event) => {
              event.stopPropagation();
              if (toolMode === "select") {
                onSelectObject({ type: "walkway", id: walkway.id });
              }
            }}
            onPointerDown={(event) => {
              if (toolMode !== "select" || event.button !== 0 || !containerRef.current) {
                return;
              }

              const bounds = containerRef.current.getBoundingClientRect();
              const point = getNormalizedPoint(event.clientX, event.clientY, bounds);
              onSelectObject({ type: "walkway", id: walkway.id });
              setDragState({
                id: walkway.id,
                type: "walkway",
                originX: walkway.x,
                originY: walkway.y,
                startX: point.x,
                startY: point.y,
              });
              event.stopPropagation();
            }}
            style={{
              left: `${walkway.x * 100}%`,
              top: `${walkway.y * 100}%`,
              width: `${walkway.width * 100}%`,
              height: `${walkway.depth * 100}%`,
            }}
            type="button"
          >
            {showLabels && <span>{walkway.name}</span>}
            {isSelected && toolMode === "select" ? (
              <span
                className="resize-handle"
                onPointerDown={(event) => {
                  if (!containerRef.current) {
                    return;
                  }

                  const bounds = containerRef.current.getBoundingClientRect();
                  const point = getNormalizedPoint(event.clientX, event.clientY, bounds);
                  setResizeState({
                    id: walkway.id,
                    type: "walkway",
                    originWidth: walkway.width,
                    originDepth: walkway.depth,
                    startX: point.x,
                    startY: point.y,
                  });
                  event.stopPropagation();
                }}
              />
            ) : null}
          </button>
          );
        })}

        {routePath ? (
          <svg className="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              className="route-line-backdrop"
              points={routePath.points
                .map((point) => `${point.x * 100},${point.y * 100}`)
                .join(" ")}
            />
            <polyline
              className="route-line"
              points={routePath.points
                .map((point) => `${point.x * 100},${point.y * 100}`)
                .join(" ")}
            />
          </svg>
        ) : null}

        {booths.map((booth) => {
          const isSelected = selectedObject?.type === "booth" && selectedObject.id === booth.id;

          return (
            <button
              className={isSelected ? "booth-rect selected" : "booth-rect"}
              key={booth.id}
              onClick={(event) => {
                event.stopPropagation();
                if (toolMode === "select") {
                  onSelectObject({ type: "booth", id: booth.id });
                }
              }}
              onPointerDown={(event) => {
                if (toolMode !== "select" || event.button !== 0 || !containerRef.current) {
                  return;
                }

                const bounds = containerRef.current.getBoundingClientRect();
                const point = getNormalizedPoint(event.clientX, event.clientY, bounds);
                onSelectObject({ type: "booth", id: booth.id });
                setDragState({
                  id: booth.id,
                  type: "booth",
                  originX: booth.x,
                  originY: booth.y,
                  startX: point.x,
                  startY: point.y,
                });
                event.stopPropagation();
              }}
              style={{
                backgroundColor: `${booth.color}55`,
                borderColor: booth.color,
                left: `${booth.x * 100}%`,
                top: `${booth.y * 100}%`,
                width: `${booth.width * 100}%`,
                height: `${booth.depth * 100}%`,
              }}
              type="button"
            >
              {showLabels && <span>{booth.name}</span>}
              {isSelected && toolMode === "select" ? (
                <span
                  className="resize-handle"
                  onPointerDown={(event) => {
                    if (!containerRef.current) {
                      return;
                    }

                    const bounds = containerRef.current.getBoundingClientRect();
                    const point = getNormalizedPoint(event.clientX, event.clientY, bounds);
                    setResizeState({
                      id: booth.id,
                      type: "booth",
                      originWidth: booth.width,
                      originDepth: booth.depth,
                      startX: point.x,
                      startY: point.y,
                    });
                    event.stopPropagation();
                  }}
                />
              ) : null}
            </button>
          );
        })}

        {doors.map((door) => (
          <button
            className={`door-marker door-${door.edge} ${
              selectedObject?.type === "door" && selectedObject.id === door.id ? "selected" : ""
            }`}
            key={door.id}
            onClick={(event) => {
              event.stopPropagation();
              if (toolMode === "select") {
                onSelectObject({ type: "door", id: door.id });
              }
            }}
            style={{
              left: `${door.x * 100}%`,
              top: `${door.y * 100}%`,
            }}
            title={door.name}
            type="button"
          >
            {showLabels && <span>{door.name}</span>}
          </button>
        ))}

        {draft ? (
          <div
            className={toolMode === "draw-walkway" ? "walkway-rect draft" : "booth-rect draft"}
            style={{
              left: `${normalizeDraft(draft).x * 100}%`,
              top: `${normalizeDraft(draft).y * 100}%`,
              width: `${normalizeDraft(draft).width * 100}%`,
              height: `${normalizeDraft(draft).depth * 100}%`,
            }}
          />
        ) : null}
      </div>

      <footer className="editor-footer">
        <div>
          <strong>{booths.length}</strong> custom object{booths.length === 1 ? "" : "s"}
        </div>
        <div>
          <strong>{walkways.length}</strong> walkway{walkways.length === 1 ? "" : "s"} /{" "}
          <strong>{doors.length}</strong> door{doors.length === 1 ? "" : "s"}
        </div>
        <div>
          {selectedLabel ? `${selectedLabel} selected` : "No object selected"}
        </div>
      </footer>
    </section>
  );
}
