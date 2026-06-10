import { ui } from "../../lib/ui";

interface StatusOverviewProps {
  boothCount: number;
  catalogStatus: string;
  doorCount: number;
  floorPlanOpacity: number;
  floorPlanStatus: string;
  gridVisible: boolean;
  onFloorPlanOpacityChange: (opacity: number) => void;
  onGridVisibleChange: (visible: boolean) => void;
  onShowLabelsChange: (show: boolean) => void;
  showLabels: boolean;
  walkwayCount: number;
}

export function StatusOverview({
  boothCount,
  catalogStatus,
  doorCount,
  floorPlanOpacity,
  floorPlanStatus,
  gridVisible,
  onFloorPlanOpacityChange,
  onGridVisibleChange,
  onShowLabelsChange,
  showLabels,
  walkwayCount,
}: StatusOverviewProps) {
  return (
    <section className={`${ui.panel} grid gap-3`}>
      <div className={ui.softCard}>
        <span className={ui.statsLabel}>Total booths</span>
        <strong className={ui.statsValue}>{boothCount}</strong>
      </div>
      <div className={ui.softCard}>
        <span className={ui.statsLabel}>Navigation</span>
        <strong className={ui.statsValue}>
          {walkwayCount} walkways / {doorCount} doors
        </strong>
      </div>
      <div className={ui.softCard}>
        <span className={ui.statsLabel}>Catalog</span>
        <strong className={ui.statsValue}>{catalogStatus}</strong>
      </div>
      <div className={ui.softCard}>
        <span className={ui.statsLabel}>Floor plan</span>
        <strong className={ui.statsValue}>{floorPlanStatus}</strong>
      </div>
      <div className={ui.switchRow}>
        <label className="inline-flex items-center gap-2">
          <input
            checked={gridVisible}
            className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-sky-400 focus:ring-sky-400/40"
            onChange={(event) => onGridVisibleChange(event.target.checked)}
            type="checkbox"
          />
          Grid
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            checked={showLabels}
            className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-sky-400 focus:ring-sky-400/40"
            onChange={(event) => onShowLabelsChange(event.target.checked)}
            type="checkbox"
          />
          Labels
        </label>
      </div>
      <div className={ui.softCard}>
        <div className="flex items-center justify-between gap-3">
          <span className={ui.statsLabel}>Background opacity</span>
          <strong className="text-sm font-semibold text-white">
            {Math.round(floorPlanOpacity * 100)}%
          </strong>
        </div>
        <input
          className="mt-3 h-2 w-full accent-sky-400"
          max="1"
          min="0"
          onChange={(event) => onFloorPlanOpacityChange(Number(event.target.value))}
          step="0.05"
          type="range"
          value={floorPlanOpacity}
        />
      </div>
    </section>
  );
}
