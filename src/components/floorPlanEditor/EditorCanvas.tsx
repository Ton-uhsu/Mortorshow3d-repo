import type React from "react";
import type {
  BoothObject,
  DoorObject,
  FloorPlanSize,
  RectDraft,
  RoutePath,
  SelectedMapObject,
  ToolMode,
  WalkwayObject,
} from "../../types";
import { cn } from "../../lib/ui";
import {
  getNormalizedPoint,
  normalizeDraft,
  type DragState,
  type ResizeState,
} from "./editorUtils";

interface EditorCanvasProps {
  booths: BoothObject[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  doors: DoorObject[];
  draft: RectDraft | null;
  floorPlanImage: string;
  floorPlanSize: FloorPlanSize;
  gridVisible: boolean;
  onCanvasPointerDown: (
    event: React.PointerEvent<HTMLDivElement>,
    container: HTMLDivElement | null,
  ) => void;
  onCanvasPointerMove: (
    event: React.PointerEvent<HTMLDivElement>,
    container: HTMLDivElement | null,
  ) => void;
  onCanvasPointerUp: () => void;
  onSelectObject: (selection: SelectedMapObject) => void;
  resizeState: ResizeState | null;
  routePath: RoutePath | null;
  selectedObject: SelectedMapObject;
  setDragState: (state: DragState | null) => void;
  setResizeState: (state: ResizeState | null) => void;
  showLabels: boolean;
  toolMode: ToolMode;
  walkways: WalkwayObject[];
}

export function EditorCanvas({
  booths,
  containerRef,
  doors,
  draft,
  floorPlanImage,
  floorPlanSize,
  gridVisible,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onSelectObject,
  resizeState,
  routePath,
  selectedObject,
  setDragState,
  setResizeState,
  showLabels,
  toolMode,
  walkways,
}: EditorCanvasProps) {
  const routePoints = routePath?.points
    .map((point) => `${point.x * 100},${point.y * 100}`)
    .join(" ");

  return (
    <div
      className={cn(
        "relative w-full touch-none select-none overflow-hidden rounded-[24px] border border-white/10 bg-stone-100/95",
        gridVisible && "floor-grid",
      )}
      onPointerDown={(event) => onCanvasPointerDown(event, containerRef.current)}
      onPointerLeave={onCanvasPointerUp}
      onPointerMove={(event) => onCanvasPointerMove(event, containerRef.current)}
      onPointerUp={onCanvasPointerUp}
      ref={containerRef}
      role="presentation"
      style={{ aspectRatio: `${floorPlanSize.width} / ${floorPlanSize.height}` }}
    >
      <img
        alt="Uploaded floor plan"
        className="block h-full w-full object-contain object-center"
        src={floorPlanImage}
      />

      {walkways.map((walkway) => {
        const isSelected =
          selectedObject?.type === "walkway" && selectedObject.id === walkway.id;

        return (
          <button
            className={cn(
              "absolute z-[1] flex items-start justify-start border-2 border-emerald-500/90 bg-emerald-500/18 p-1.5 text-left text-[0.72rem] font-extrabold text-emerald-950 shadow-lg shadow-slate-900/15",
              isSelected && "z-[5] outline-2 outline-white/90",
            )}
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
            {showLabels && (
              <span className="bg-emerald-50/82 px-1.5 py-0.5">{walkway.name}</span>
            )}
            {isSelected && toolMode === "select" ? (
              <span
                className="absolute -right-1.5 -bottom-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-500 shadow-[0_0_0_4px_rgba(15,157,216,0.22)]"
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

      {routePoints ? (
        <svg
          className="pointer-events-none absolute inset-0 z-[7] h-full w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <polyline className="route-line-backdrop" points={routePoints} />
          <polyline className="route-line" points={routePoints} />
        </svg>
      ) : null}

      {booths.map((booth) => {
        const isSelected = selectedObject?.type === "booth" && selectedObject.id === booth.id;

        return (
          <button
            className={cn(
              "absolute z-[3] flex items-start justify-start border-2 p-1.5 text-left text-[0.72rem] font-bold text-slate-950 shadow-xl shadow-slate-900/15",
              isSelected && "z-[6] outline-2 outline-white/90",
            )}
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
            {showLabels && (
              <span className="bg-amber-50/80 px-1.5 py-0.5">{booth.name}</span>
            )}
            {isSelected && toolMode === "select" ? (
              <span
                className="absolute -right-1.5 -bottom-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-500 shadow-[0_0_0_4px_rgba(15,157,216,0.22)]"
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
          className={cn(
            "absolute z-[8] grid -translate-x-1/2 -translate-y-1/2 place-items-center border-[3px] border-sky-500 bg-stone-50 shadow-lg shadow-slate-900/30",
            (door.edge === "top" || door.edge === "bottom") ? "h-[0.65rem] w-[1.6rem]" : "h-[1.6rem] w-[0.65rem]",
            selectedObject?.type === "door" &&
              selectedObject.id === door.id &&
              "outline-2 outline-white/90 shadow-[0_8px_20px_rgba(15,23,42,0.32),0_0_0_5px_rgba(29,155,240,0.26)]",
          )}
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
          {showLabels && (
            <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap bg-stone-50/90 px-1.5 py-0.5 text-[0.68rem] font-extrabold text-slate-950">
              {door.name}
            </span>
          )}
        </button>
      ))}

      {draft ? (
        <div
          className={cn(
            "pointer-events-none absolute z-[9] border-2",
            toolMode === "draw-walkway"
              ? "border-dashed border-emerald-500/90 bg-emerald-500/24"
              : "border-sky-700 bg-sky-700/22",
          )}
          style={{
            left: `${normalizeDraft(draft).x * 100}%`,
            top: `${normalizeDraft(draft).y * 100}%`,
            width: `${normalizeDraft(draft).width * 100}%`,
            height: `${normalizeDraft(draft).depth * 100}%`,
          }}
        />
      ) : null}
    </div>
  );
}
