import { useMemo, useRef } from "react";
import type {
  BoothObject,
  DoorObject,
  FloorPlanSize,
  RectDraft,
  RoutePath,
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
  const {
    draft,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    resizeState,
    setDragState,
    setResizeState,
  } = useFloorPlanEditorInteractions({
    booths,
    onAddBooth,
    onAddDoor,
    onAddWalkway,
    onSelectObject,
    onUpdateBooth,
    onUpdateWalkway,
    toolMode,
    walkways,
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
          onDeleteSelected={onDeleteSelected}
          onToolModeChange={onToolModeChange}
          selectedObject={selectedObject}
          toolMode={toolMode}
        />
      </header>

      <div className="my-3 flex flex-wrap justify-between gap-3 text-sm text-slate-300">
        <span>Booths block routes. Walkways are the only walkable zones.</span>
        <span>Doors snap to booth edges and connect booths to walkways.</span>
      </div>

      <EditorCanvas
        booths={booths}
        containerRef={containerRef}
        doors={doors}
        draft={draft}
        floorPlanImage={floorPlanImage}
        floorPlanSize={floorPlanSize}
        gridVisible={gridVisible}
        onCanvasPointerDown={handleCanvasPointerDown}
        onCanvasPointerMove={handleCanvasPointerMove}
        onCanvasPointerUp={handleCanvasPointerUp}
        onSelectObject={onSelectObject}
        resizeState={resizeState}
        routePath={routePath}
        selectedObject={selectedObject}
        setDragState={setDragState}
        setResizeState={setResizeState}
        showLabels={showLabels}
        toolMode={toolMode}
        walkways={walkways}
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
