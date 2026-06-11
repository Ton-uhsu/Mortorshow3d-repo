import type { DoorObject } from "../../types";
import { ui } from "../../lib/ui";

export interface RoutePanelProps {
  className?: string;
  doors: DoorObject[];
  fromDoorId: string | null;
  onFromDoorChange: (id: string | null) => void;
  onToDoorChange: (id: string | null) => void;
  routeDistance: number | null;
  routeStatus: string;
  toDoorId: string | null;
  variant?: "panel" | "overlay";
}

export function RoutePanel({
  className = "",
  doors,
  fromDoorId,
  onFromDoorChange,
  onToDoorChange,
  routeDistance,
  routeStatus,
  toDoorId,
  variant = "panel",
}: RoutePanelProps) {
  const isOverlay = variant === "overlay";
  const shellClass = isOverlay
    ? "rounded-2xl border border-white/14 bg-slate-950/82 p-3 shadow-2xl shadow-slate-950/35 backdrop-blur-xl"
    : ui.panel;
  const headerClass = isOverlay ? "flex items-start justify-between gap-3" : ui.panelHeader;
  const titleClass = isOverlay ? "text-base font-semibold tracking-tight text-white" : ui.panelTitle;
  const gridClass = isOverlay
    ? "mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
    : `${ui.fieldGrid} grid-cols-1 md:grid-cols-2`;
  const selectClass = isOverlay
    ? `${ui.input} min-h-12 touch-manipulation rounded-xl px-3 py-3 text-base font-semibold`
    : `${ui.input} min-h-14 touch-manipulation py-4 text-base font-semibold`;
  const metaClass = isOverlay
    ? "mt-2 grid grid-cols-2 gap-2 rounded-xl border border-white/8 bg-white/6 px-3 py-2"
    : `${ui.metaCard} md:grid-cols-2`;
  const statValueClass = isOverlay
    ? "mt-0.5 block truncate text-sm font-semibold text-white"
    : ui.statsValue;

  return (
    <section className={`${shellClass} ${className}`}>
      <header className={headerClass}>
        <div>
          <p className={ui.eyebrow}>Directions</p>
          <h2 className={titleClass}>Route preview</h2>
        </div>
      </header>

      <div className={gridClass}>
        <label className={ui.field}>
          <span className={isOverlay ? "text-xs font-semibold text-slate-300" : ui.fieldHint}>
            From door
          </span>
          <select
            className={selectClass}
            onChange={(event) => onFromDoorChange(event.target.value || null)}
            value={fromDoorId ?? ""}
          >
            <option value="">Select start</option>
            {doors.map((door) => (
              <option key={door.id} value={door.id}>
                {door.name}
              </option>
            ))}
          </select>
        </label>

        <label className={ui.field}>
          <span className={isOverlay ? "text-xs font-semibold text-slate-300" : ui.fieldHint}>
            To door
          </span>
          <select
            className={selectClass}
            onChange={(event) => onToDoorChange(event.target.value || null)}
            value={toDoorId ?? ""}
          >
            <option value="">Select destination</option>
            {doors.map((door) => (
              <option key={door.id} value={door.id}>
                {door.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={metaClass}>
        <div>
          <span className={isOverlay ? "block text-[0.68rem] text-slate-300" : ui.statsLabel}>
            Status
          </span>
          <strong className={statValueClass}>{routeStatus}</strong>
        </div>
        <div>
          <span className={isOverlay ? "block text-[0.68rem] text-slate-300" : ui.statsLabel}>
            Distance
          </span>
          <strong className={statValueClass}>
            {routeDistance !== null ? `${(routeDistance * 100).toFixed(1)} units` : "-"}
          </strong>
        </div>
      </div>
    </section>
  );
}
