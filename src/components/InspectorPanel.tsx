import { BOOTH_CATEGORIES } from "../constants/editor";
import { cn, ui } from "../lib/ui";
import type { BoothCatalogEntry, BoothCategory, BoothObject } from "../types";

interface InspectorPanelProps {
  booth: BoothObject | null;
  catalogEntries: BoothCatalogEntry[];
  catalogEntry: BoothCatalogEntry | null;
  onDelete: () => void;
  onDuplicate: () => void;
  onAssignCatalogEntry: (code: string) => void;
  onUpdate: (patch: Partial<BoothObject>) => void;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function InspectorPanel({
  booth,
  catalogEntries,
  catalogEntry,
  onDelete,
  onDuplicate,
  onAssignCatalogEntry,
  onUpdate,
}: InspectorPanelProps) {
  return (
    <aside className={ui.panel}>
      <header className={ui.panelHeader}>
        <div>
          <p className={ui.eyebrow}>Inspector</p>
          <h2 className={ui.panelTitle}>Object settings</h2>
        </div>
      </header>

      {!booth ? (
        <div className={ui.emptyState}>
          <strong className={ui.emptyStateTitle}>No booth selected</strong>
          <p className={ui.sectionText}>
            Use Draw booth to create a rectangle, then click it to edit name, color,
            height, size, and rotation.
          </p>
        </div>
      ) : (
        <>
          <div className={ui.fieldGrid}>
            <label className={ui.field}>
              <span className={ui.fieldHint}>Booth code</span>
              <select
                className={ui.input}
                onChange={(event) => onAssignCatalogEntry(event.target.value)}
                value={booth.boothCode ?? ""}
              >
                <option value="">Custom / not linked</option>
                {catalogEntries.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.code} - {entry.brandEnglish || entry.brandThai}
                  </option>
                ))}
              </select>
            </label>

            <label className={ui.field}>
              <span className={ui.fieldHint}>Name</span>
              <input
                className={ui.input}
                onChange={(event) => onUpdate({ name: event.target.value })}
                type="text"
                value={booth.name}
              />
            </label>

            <label className={ui.field}>
              <span className={ui.fieldHint}>Category</span>
              <select
                className={ui.input}
                onChange={(event) =>
                  onUpdate({ category: event.target.value as BoothCategory })
                }
                value={booth.category}
              >
                {BOOTH_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={ui.field}>
              <span className={ui.fieldHint}>Color</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[76px_1fr] sm:items-center">
                <input
                  className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 p-1"
                  onChange={(event) => onUpdate({ color: event.target.value })}
                  type="color"
                  value={booth.color}
                />
                <input
                  className={ui.input}
                  onChange={(event) => onUpdate({ color: event.target.value })}
                  type="text"
                  value={booth.color}
                />
              </div>
            </label>

            <label className={ui.field}>
              <span className={ui.fieldHint}>3D height</span>
              <div className={ui.dualInput}>
                <input
                  className="accent-sky-400"
                  max={4}
                  min={0.2}
                  onChange={(event) =>
                    onUpdate({
                      extrudeHeight: clampNumber(Number(event.target.value), 0.2, 4),
                    })
                  }
                  step={0.1}
                  type="range"
                  value={booth.extrudeHeight}
                />
                <input
                  className={ui.input}
                  max={4}
                  min={0.2}
                  onChange={(event) =>
                    onUpdate({
                      extrudeHeight: clampNumber(Number(event.target.value), 0.2, 4),
                    })
                  }
                  step={0.1}
                  type="number"
                  value={booth.extrudeHeight}
                />
              </div>
            </label>

            <label className={ui.field}>
              <span className={ui.fieldHint}>Width</span>
              <div className={ui.dualInput}>
                <input
                  className="accent-sky-400"
                  max={0.8}
                  min={0.02}
                  onChange={(event) =>
                    onUpdate({ width: clampNumber(Number(event.target.value), 0.02, 0.8) })
                  }
                  step={0.005}
                  type="range"
                  value={booth.width}
                />
                <input
                  className={ui.input}
                  max={0.8}
                  min={0.02}
                  onChange={(event) =>
                    onUpdate({ width: clampNumber(Number(event.target.value), 0.02, 0.8) })
                  }
                  step={0.005}
                  type="number"
                  value={booth.width}
                />
              </div>
            </label>

            <label className={ui.field}>
              <span className={ui.fieldHint}>Depth</span>
              <div className={ui.dualInput}>
                <input
                  className="accent-sky-400"
                  max={0.8}
                  min={0.02}
                  onChange={(event) =>
                    onUpdate({ depth: clampNumber(Number(event.target.value), 0.02, 0.8) })
                  }
                  step={0.005}
                  type="range"
                  value={booth.depth}
                />
                <input
                  className={ui.input}
                  max={0.8}
                  min={0.02}
                  onChange={(event) =>
                    onUpdate({ depth: clampNumber(Number(event.target.value), 0.02, 0.8) })
                  }
                  step={0.005}
                  type="number"
                  value={booth.depth}
                />
              </div>
            </label>

            <label className={ui.field}>
              <span className={ui.fieldHint}>Rotation</span>
              <div className={ui.dualInput}>
                <input
                  className="accent-sky-400"
                  max={180}
                  min={-180}
                  onChange={(event) =>
                    onUpdate({ rotation: clampNumber(Number(event.target.value), -180, 180) })
                  }
                  step={1}
                  type="range"
                  value={booth.rotation}
                />
                <input
                  className={ui.input}
                  max={180}
                  min={-180}
                  onChange={(event) =>
                    onUpdate({ rotation: clampNumber(Number(event.target.value), -180, 180) })
                  }
                  step={1}
                  type="number"
                  value={booth.rotation}
                />
              </div>
            </label>
          </div>

          {catalogEntry ? (
            <div className={`${ui.softCard} mt-4 grid gap-2`}>
              <div>
                <span className="mb-1 block text-[0.78rem] uppercase tracking-[0.1em] text-amber-200">
                  Catalog match
                </span>
                <strong className="block text-white">
                  {catalogEntry.code} - {catalogEntry.brandEnglish || catalogEntry.brandThai}
                </strong>
              </div>
              <p className="break-words text-sm text-slate-300">
                {catalogEntry.companyEnglish || catalogEntry.companyThai}
              </p>
              <p className="break-words text-sm text-slate-300">{catalogEntry.section}</p>
              {catalogEntry.logoUrl ? (
                <img
                  alt={`${catalogEntry.code} logo`}
                  className="max-h-[92px] w-full rounded-2xl bg-white/95 object-contain object-left p-3"
                  src={catalogEntry.logoUrl}
                />
              ) : null}
            </div>
          ) : null}

          <div className={`${ui.metaCard} md:grid-cols-2`}>
            <div>
              <span className={ui.statsLabel}>Footprint</span>
              <strong className={ui.statsValue}>
                {(booth.width * 100).toFixed(1)}% x {(booth.depth * 100).toFixed(1)}%
              </strong>
            </div>
            <div>
              <span className={ui.statsLabel}>Anchor</span>
              <strong className={ui.statsValue}>
                {(booth.x * 100).toFixed(1)}%, {(booth.y * 100).toFixed(1)}%
              </strong>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {BOOTH_CATEGORIES.map((category) => (
              <button
                className={cn(
                  "inline-flex items-center justify-center rounded-2xl border px-3 py-2 text-sm font-medium text-white transition-transform duration-150 hover:-translate-y-px",
                  booth.category === category.value
                    ? "bg-white/10"
                    : "bg-white/5",
                )}
                key={category.value}
                onClick={() =>
                  onUpdate({ category: category.value, color: booth.color || category.color })
                }
                style={{ borderColor: category.color }}
                type="button"
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className={ui.actionRow}>
            <button className={ui.buttonGhost} onClick={onDuplicate} type="button">
              Duplicate
            </button>
            <button className={ui.buttonDanger} onClick={onDelete} type="button">
              Delete
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
