import type { SelectedMapObject, ToolMode } from "../../types";
import { cn, ui } from "../../lib/ui";

interface EditorToolbarProps {
  onDeleteSelected: () => void;
  onToolModeChange: (tool: ToolMode) => void;
  selectedObject: SelectedMapObject;
  toolMode: ToolMode;
}

export function EditorToolbar({
  onDeleteSelected,
  onToolModeChange,
  selectedObject,
  toolMode,
}: EditorToolbarProps) {
  const buildPillClass = (active: boolean) =>
    cn(ui.toolPill, active && ui.toolPillActive);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={buildPillClass(toolMode === "select")}
        onClick={() => onToolModeChange("select")}
        type="button"
      >
        Select
      </button>
      <button
        className={buildPillClass(toolMode === "draw-booth")}
        onClick={() => onToolModeChange("draw-booth")}
        type="button"
      >
        Draw booth
      </button>
      <button
        className={buildPillClass(toolMode === "draw-walkway")}
        onClick={() => onToolModeChange("draw-walkway")}
        type="button"
      >
        Draw walkway
      </button>
      <button
        className={buildPillClass(toolMode === "place-door")}
        onClick={() => onToolModeChange("place-door")}
        type="button"
      >
        Place door
      </button>
      <button
        className={cn(
          ui.toolPill,
          "border-red-500/30 text-red-200 disabled:cursor-not-allowed disabled:opacity-40",
        )}
        disabled={!selectedObject}
        onClick={onDeleteSelected}
        type="button"
      >
        Delete
      </button>
    </div>
  );
}
