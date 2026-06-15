import type { BoothObject, DoorObject, RoutePoint } from "../../types";
import { ui } from "../../lib/ui";

export interface RoutePanelProps {
  booths: BoothObject[];
  className?: string;
  doors: DoorObject[];
  fromDoorId: string | null;
  onDestinationTypeChange: (type: "door" | "booth") => void;
  onFromDoorChange: (id: string | null) => void;
  onRouteStartModeChange: (mode: "door" | "point") => void;
  onRouteStartPointChange: (point: RoutePoint | null) => void;
  onToDoorChange: (id: string | null) => void;
  onToBoothChange: (id: string | null) => void;
  onClose?: () => void;
  routeDestinationType: "door" | "booth";
  routeDistance: number | null;
  routeStartMode: "door" | "point";
  routeStartPoint: RoutePoint | null;
  routeStatus: string;
  toBoothId: string | null;
  toDoorId: string | null;
  variant?: "panel" | "overlay";
}

export function RoutePanel({
  booths,
  className = "",
  doors,
  fromDoorId,
  onClose,
  onDestinationTypeChange,
  onFromDoorChange,
  onRouteStartModeChange,
  onToBoothChange,
  onToDoorChange,
  routeDestinationType,
  routeDistance,
  routeStartMode,
  routeStartPoint,
  routeStatus,
  toBoothId,
  toDoorId,
  variant = "panel",
}: RoutePanelProps) {
  const isOverlay = variant === "overlay";
  const shellClass = isOverlay
    ? "rounded-2xl border border-white/14 bg-slate-950/88 p-3 shadow-2xl shadow-slate-950/35 backdrop-blur-xl"
    : ui.panel;
  const headerClass = isOverlay ? "flex items-start justify-between gap-3" : ui.panelHeader;
  const titleClass = isOverlay ? "text-sm font-semibold tracking-tight text-white" : ui.panelTitle;
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
  const segmentedButtonClass = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm font-bold transition ${
      active
        ? "border-cyan-300/45 bg-cyan-300/18 text-cyan-50"
        : "border-white/10 bg-white/6 text-slate-300"
    }`;

  return (
    <section className={`${shellClass} ${className}`}>
      <header className={headerClass}>
        <div>
          <p className={ui.eyebrow}>Directions</p>
          <h2 className={titleClass}>Route preview</h2>
        </div>
        {isOverlay && onClose ? (
          <button
            className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-xs font-bold text-white"
            onClick={onClose}
            type="button"
          >
            Hide
          </button>
        ) : null}
      </header>

      <div className={gridClass}>
        <label className={ui.field}>
          <span className={isOverlay ? "text-xs font-semibold text-slate-300" : ui.fieldHint}>
            From
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={segmentedButtonClass(routeStartMode === "door")}
              onClick={() => onRouteStartModeChange("door")}
              type="button"
            >
              Door
            </button>
            <button
              className={segmentedButtonClass(routeStartMode === "point")}
              onClick={() => onRouteStartModeChange("point")}
              type="button"
            >
              Start point
            </button>
          </div>
          {routeStartMode === "door" ? (
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
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-slate-100">
              {routeStartPoint
                ? `${(routeStartPoint.x * 100).toFixed(1)}, ${(routeStartPoint.y * 100).toFixed(1)}`
                : "Use Place start on the 2D map"}
            </div>
          )}
        </label>

        <label className={ui.field}>
          <span className={isOverlay ? "text-xs font-semibold text-slate-300" : ui.fieldHint}>
            To
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={segmentedButtonClass(routeDestinationType === "door")}
              onClick={() => onDestinationTypeChange("door")}
              type="button"
            >
              Door
            </button>
            <button
              className={segmentedButtonClass(routeDestinationType === "booth")}
              onClick={() => onDestinationTypeChange("booth")}
              type="button"
            >
              Booth
            </button>
          </div>
          {routeDestinationType === "door" ? (
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
          ) : (
            <select
              className={selectClass}
              onChange={(event) => onToBoothChange(event.target.value || null)}
              value={toBoothId ?? ""}
            >
              <option value="">Select booth</option>
              {booths.map((booth) => (
                <option key={booth.id} value={booth.id}>
                  {booth.boothCode ? `${booth.boothCode} - ${booth.name}` : booth.name}
                </option>
              ))}
            </select>
          )}
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
