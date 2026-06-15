import { useMemo, useRef } from "react";
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
} from "../types";
import { ui } from "../lib/ui";
import { EditorCanvas } from "./floorPlanEditor/EditorCanvas";
import { EditorToolbar } from "./floorPlanEditor/EditorToolbar";
import { useFloorPlanEditorInteractions } from "./floorPlanEditor/useFloorPlanEditorInteractions";

interface FloorPlanEditorProps {
  booths: BoothObject[];
  doors: DoorObject[];
  floorPlanImage: string;
  floorPlanOpacity: number;
  floorPlanSize: FloorPlanSize;
  gridVisible: boolean;
  routePath: RoutePath | null;
  selectedObject: SelectedMapObject;
  showLabels: boolean;
  toolMode: ToolMode;
  walkways: WalkwayObject[];
  onAddBooth: (rect: RectDraft) => void;
  onAddDoor: (door: Omit<DoorObject, "id" | "name">) => void;
  onAddWalkway: (points: RoutePoint[]) => void;
  onClearAll: () => void;
  onDeleteSelected: () => void;
  onSelectObject: (selection: SelectedMapObject) => void;
  onResetProject: () => void;
  onRouteStartPointChange: (point: RoutePoint | null) => void;
  onToolModeChange: (tool: ToolMode) => void;
  onUpdateBooth: (id: string, patch: Partial<BoothObject>) => void;
  onUpdateWalkway: (id: string, patch: Partial<WalkwayObject>) => void;
  routeStartPoint: RoutePoint | null;
}

export function FloorPlanEditor({
  booths,
  doors,
  floorPlanImage,
  floorPlanOpacity,
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
  onClearAll,
  onDeleteSelected,
  onSelectObject,
  onResetProject,
  onRouteStartPointChange,
  onToolModeChange,
  onUpdateBooth,
  onUpdateWalkway,
  routeStartPoint,
}: FloorPlanEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    draft,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    resizeState,
    setDragState,
    setPointDragState,
    setRouteStartDragState,
    setResizeState,
    walkwayDraft,
    walkwayPreviewPoint,
  } = useFloorPlanEditorInteractions({
    booths,
    onAddBooth,
    onAddDoor,
    onAddWalkway,
    onRouteStartPointChange,
    onSelectObject,
    onUpdateBooth,
    onUpdateWalkway,
    toolMode,
  });

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

  return (
    <section className={ui.panel}>
      <header className={ui.panelHeader}>
        <div>
          <p className={ui.eyebrow}>2D Editor</p>
          <h2 className={ui.panelTitle}>Floor plan canvas</h2>
        </div>
        <EditorToolbar
          onToolModeChange={onToolModeChange}
          toolMode={toolMode}
        />
      </header>

      <div className="my-3 flex flex-wrap justify-between gap-3 text-sm text-slate-300">
        <span>Booths block routes. Walkways are thick paths you can branch and bend.</span>
        <span>Draw walkway: click points, Enter to finish, Esc to cancel. Place start: click once.</span>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          className={`${ui.buttonDanger} w-full sm:w-auto`}
          disabled={!selectedObject}
          onClick={onDeleteSelected}
          type="button"
        >
          Delete selected
        </button>
        <button
          className={`${ui.buttonDanger} w-full sm:w-auto`}
          onClick={onClearAll}
          type="button"
        >
          Clear all
        </button>
        <button
          className={`${ui.buttonGhost} w-full sm:w-auto`}
          onClick={onResetProject}
          type="button"
        >
          Reset project
        </button>
      </div>

      {selectedWalkway ? (
        <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-3 text-sm text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-white">Walkway width</span>
            <span className="font-mono text-xs text-emerald-100">
              {(selectedWalkway.width * 100).toFixed(1)}%
            </span>
          </div>
          <input
            className="mt-3 h-2 w-full accent-emerald-400"
            max="0.08"
            min="0.006"
            onChange={(event) =>
              onUpdateWalkway(selectedWalkway.id, {
                width: Number(event.target.value),
              })
            }
            step="0.002"
            type="range"
            value={selectedWalkway.width}
          />
        </div>
      ) : null}

      <EditorCanvas
        booths={booths}
        containerRef={containerRef}
        doors={doors}
        draft={draft}
        floorPlanImage={floorPlanImage}
        floorPlanOpacity={floorPlanOpacity}
        floorPlanSize={floorPlanSize}
        gridVisible={gridVisible}
        onCanvasPointerDown={handleCanvasPointerDown}
        onCanvasPointerMove={handleCanvasPointerMove}
        onCanvasPointerUp={handleCanvasPointerUp}
        onSelectObject={onSelectObject}
        resizeState={resizeState}
        routePath={routePath}
        routeStartPoint={routeStartPoint}
        selectedObject={selectedObject}
        setDragState={setDragState}
        setPointDragState={setPointDragState}
        setRouteStartDragState={setRouteStartDragState}
        setResizeState={setResizeState}
        showLabels={showLabels}
        toolMode={toolMode}
        walkways={walkways}
        walkwayDraft={walkwayDraft}
        walkwayPreviewPoint={walkwayPreviewPoint}
      />

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <div>
          <strong className="font-semibold text-white">{booths.length}</strong> custom object
          {booths.length === 1 ? "" : "s"}
        </div>
        <div>
          <strong className="font-semibold text-white">{walkways.length}</strong> walkway
          {walkways.length === 1 ? "" : "s"} /{" "}
          <strong className="font-semibold text-white">{doors.length}</strong> door
          {doors.length === 1 ? "" : "s"}
        </div>
        <div>{selectedLabel ? `${selectedLabel} selected` : "No object selected"}</div>
      </footer>
    </section>
  );
}
