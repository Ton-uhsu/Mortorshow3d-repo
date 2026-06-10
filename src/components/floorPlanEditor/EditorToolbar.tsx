import type { ToolMode } from "../../types";
import { cn, ui } from "../../lib/ui";

interface EditorToolbarProps {
  onToolModeChange: (tool: ToolMode) => void;
  toolMode: ToolMode;
}

export function EditorToolbar({
  onToolModeChange,
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
    </div>
  );
}
