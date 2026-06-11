import type React from "react";
import type {
  BoothObject,
  DoorObject,
  FloorPlanSize,
  RectDraft,
  RoutePath,
  RoutePoint,
  SelectedMapObject,
  ToolMode,
  WalkwayObject,
} from "../../types";
import { cn } from "../../lib/ui";
import {
  getNormalizedPoint,
  normalizeDraft,
  type DragState,
  type PointDragState,
  type ResizeState,
} from "./editorUtils";

interface EditorCanvasProps {
  booths: BoothObject[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  doors: DoorObject[];
  draft: RectDraft | null;
  floorPlanImage: string;
  floorPlanOpacity: number;
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
  setPointDragState: (state: PointDragState | null) => void;
  setResizeState: (state: ResizeState | null) => void;
  showLabels: boolean;
  toolMode: ToolMode;
  walkways: WalkwayObject[];
  walkwayDraft: RoutePoint[] | null;
  walkwayPreviewPoint: RoutePoint | null;
}

export function EditorCanvas({
  booths,
  containerRef,
  doors,
  draft,
  floorPlanImage,
  floorPlanOpacity,
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
  setPointDragState,
  setResizeState,
  showLabels,
  toolMode,
  walkways,
  walkwayDraft,
  walkwayPreviewPoint,
}: EditorCanvasProps) {
  const routePoints = routePath?.points
    .map((point) => `${point.x * 100},${point.y * 100}`)
    .join(" ");
  const walkwayDraftPoints = walkwayDraft
    ? [
        ...walkwayDraft,
        ...(walkwayPreviewPoint ? [walkwayPreviewPoint] : []),
      ]
        .map((point) => `${point.x * 100},${point.y * 100}`)
        .join(" ")
    : null;

  const beginPointerInteraction = (
    event: React.PointerEvent<Element>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  return (
    <div
      className={cn(
        "floor-plan-canvas relative w-full touch-none select-none overflow-hidden rounded-[24px] border border-white/10",
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
        className="pointer-events-none block h-full w-full object-contain object-center"
        draggable={false}
        src={floorPlanImage}
        style={{ opacity: floorPlanOpacity }}
      />

      <svg
        className="absolute inset-0 z-[2] h-full w-full overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {walkways.map((walkway) => {
          const points = walkway.points
            .map((point) => `${point.x * 100},${point.y * 100}`)
            .join(" ");
          const isSelected =
            selectedObject?.type === "walkway" && selectedObject.id === walkway.id;
          const strokeWidth = Math.max(walkway.width * 650, 4);

          return (
            <g key={walkway.id}>
              <polyline
                fill="none"
                points={points}
                stroke="transparent"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={strokeWidth + 10}
                vectorEffect="non-scaling-stroke"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (toolMode === "select") {
                    onSelectObject({ type: "walkway", id: walkway.id });
                  }
                }}
                onPointerDown={(event) => {
                  if (toolMode !== "select" || event.button !== 0 || !containerRef.current) {
                    return;
                  }

                  beginPointerInteraction(event);
                  const bounds = containerRef.current.getBoundingClientRect();
                  const point = getNormalizedPoint(event.clientX, event.clientY, bounds);
                  onSelectObject({ type: "walkway", id: walkway.id });
                  setDragState({
                    id: walkway.id,
                    type: "walkway",
                    originPoints: walkway.points,
                    originX: walkway.points[0]?.x ?? 0,
                    originY: walkway.points[0]?.y ?? 0,
                    startX: point.x,
                    startY: point.y,
                  });
                }}
              />
              <polyline
                className="pointer-events-none"
                fill="none"
                points={points}
                stroke="rgba(255,255,255,0.9)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={strokeWidth + (isSelected ? 3 : 2)}
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                className="pointer-events-none"
                fill="none"
                points={points}
                stroke="rgba(16,185,129,0.9)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
              {isSelected
                ? walkway.points.map((point, index) => (
                    <circle
                      className="cursor-grab active:cursor-grabbing"
                      cx={point.x * 100}
                      cy={point.y * 100}
                      fill="#0ea5e9"
                      key={`${walkway.id}-${index}`}
                      onPointerDown={(event) => {
                        if (toolMode !== "select") {
                          return;
                        }

                        beginPointerInteraction(event);
                        onSelectObject({ type: "walkway", id: walkway.id });
                        setPointDragState({
                          originPoints: walkway.points,
                          pointIndex: index,
                          walkwayId: walkway.id,
                        });
                      }}
                      r="0.62"
                      stroke="#ffffff"
                      strokeWidth="0.18"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))
                : null}
            </g>
          );
        })}

        {walkwayDraftPoints ? (
          <polyline
            fill="none"
            points={walkwayDraftPoints}
            stroke="rgba(56,189,248,0.95)"
            strokeDasharray="8 7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>

      {walkways.map((walkway) => {
        const labelPoint = walkway.points[0];

        if (!showLabels || !labelPoint) {
          return null;
        }

        return (
          <span
            className="pointer-events-none absolute z-[4] -translate-x-1/2 -translate-y-full bg-emerald-50/88 px-1.5 py-0.5 text-[0.68rem] font-extrabold text-emerald-950 shadow-sm"
            key={`${walkway.id}-label`}
            style={{
              left: `${labelPoint.x * 100}%`,
              top: `${labelPoint.y * 100}%`,
            }}
          >
            {walkway.name}
          </span>
        );
      })}

      {routePoints ? (
        <svg
          className="pointer-events-none absolute inset-0 z-[7] h-full w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <polyline
            className="route-line-backdrop"
            points={routePoints}
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            className="route-line"
            points={routePoints}
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            className="route-line-flow"
            points={routePoints}
            vectorEffect="non-scaling-stroke"
          />
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
              event.preventDefault();
              event.stopPropagation();
              if (toolMode === "select") {
                onSelectObject({ type: "booth", id: booth.id });
              }
            }}
            onPointerDown={(event) => {
              if (toolMode !== "select" || event.button !== 0 || !containerRef.current) {
                return;
              }

              beginPointerInteraction(event);
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

                  beginPointerInteraction(event);
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
            event.preventDefault();
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
