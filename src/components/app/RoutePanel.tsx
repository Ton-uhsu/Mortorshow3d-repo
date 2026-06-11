import type { DoorObject } from "../../types";
import { ui } from "../../lib/ui";

interface RoutePanelProps {
  className?: string;
  doors: DoorObject[];
  fromDoorId: string | null;
  onFromDoorChange: (id: string | null) => void;
  onToDoorChange: (id: string | null) => void;
  routeDistance: number | null;
  routeStatus: string;
  toDoorId: string | null;
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
}: RoutePanelProps) {
  return (
    <section className={`${ui.panel} ${className}`}>
      <header className={ui.panelHeader}>
        <div>
          <p className={ui.eyebrow}>Directions</p>
          <h2 className={ui.panelTitle}>Route preview</h2>
        </div>
      </header>

      <div className={`${ui.fieldGrid} grid-cols-1 md:grid-cols-2`}>
        <label className={ui.field}>
          <span className={ui.fieldHint}>From door</span>
          <select
            className={`${ui.input} min-h-14 touch-manipulation py-4 text-base font-semibold`}
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
          <span className={ui.fieldHint}>To door</span>
          <select
            className={`${ui.input} min-h-14 touch-manipulation py-4 text-base font-semibold`}
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

      <div className={`${ui.metaCard} md:grid-cols-2`}>
        <div>
          <span className={ui.statsLabel}>Status</span>
          <strong className={ui.statsValue}>{routeStatus}</strong>
        </div>
        <div>
          <span className={ui.statsLabel}>Route distance</span>
          <strong className={ui.statsValue}>
            {routeDistance !== null ? `${(routeDistance * 100).toFixed(1)} units` : "-"}
          </strong>
        </div>
      </div>
    </section>
  );
}
