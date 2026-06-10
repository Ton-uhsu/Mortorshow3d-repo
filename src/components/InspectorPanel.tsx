import type { BoothCatalogEntry, BoothCategory, BoothObject } from "../types";

const categories: Array<{ value: BoothCategory; label: string; color: string }> = [
  { value: "standard", label: "Standard", color: "#60a5fa" },
  { value: "premium", label: "Premium", color: "#f59e0b" },
  { value: "food", label: "Food", color: "#ef4444" },
  { value: "stage", label: "Stage", color: "#8b5cf6" },
  { value: "service", label: "Service", color: "#14b8a6" },
];

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
    <aside className="inspector-card">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Inspector</p>
          <h2>Object settings</h2>
        </div>
      </header>

      {!booth ? (
        <div className="empty-state">
          <strong>No booth selected</strong>
          <p>Use Draw booth to create a rectangle, then click it to edit name, color, height, size, and rotation.</p>
        </div>
      ) : (
        <>
          <div className="field-grid">
            <label className="field">
              <span>Booth code</span>
              <select
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

            <label className="field">
              <span>Name</span>
              <input
                onChange={(event) => onUpdate({ name: event.target.value })}
                type="text"
                value={booth.name}
              />
            </label>

            <label className="field">
              <span>Category</span>
              <select
                onChange={(event) =>
                  onUpdate({ category: event.target.value as BoothCategory })
                }
                value={booth.category}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Color</span>
              <div className="color-row">
                <input
                  onChange={(event) => onUpdate({ color: event.target.value })}
                  type="color"
                  value={booth.color}
                />
                <input
                  onChange={(event) => onUpdate({ color: event.target.value })}
                  type="text"
                  value={booth.color}
                />
              </div>
            </label>

            <label className="field">
              <span>3D height</span>
              <div className="dual-input">
                <input
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

            <label className="field">
              <span>Width</span>
              <div className="dual-input">
                <input
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

            <label className="field">
              <span>Depth</span>
              <div className="dual-input">
                <input
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

            <label className="field">
              <span>Rotation</span>
              <div className="dual-input">
                <input
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
            <div className="catalog-card">
              <div>
                <span className="catalog-label">Catalog match</span>
                <strong>
                  {catalogEntry.code} - {catalogEntry.brandEnglish || catalogEntry.brandThai}
                </strong>
              </div>
              <p>{catalogEntry.companyEnglish || catalogEntry.companyThai}</p>
              <p>{catalogEntry.section}</p>
              {catalogEntry.logoUrl ? (
                <img
                  alt={`${catalogEntry.code} logo`}
                  className="catalog-logo"
                  src={catalogEntry.logoUrl}
                />
              ) : null}
            </div>
          ) : null}

          <div className="meta-card">
            <div>
              <span>Footprint</span>
              <strong>
                {(booth.width * 100).toFixed(1)}% x {(booth.depth * 100).toFixed(1)}%
              </strong>
            </div>
            <div>
              <span>Anchor</span>
              <strong>
                {(booth.x * 100).toFixed(1)}%, {(booth.y * 100).toFixed(1)}%
              </strong>
            </div>
          </div>

          <div className="category-palette">
            {categories.map((category) => (
              <button
                className={booth.category === category.value ? "palette-chip active" : "palette-chip"}
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

          <div className="action-row">
            <button className="ghost-button" onClick={onDuplicate} type="button">
              Duplicate
            </button>
            <button className="danger-button" onClick={onDelete} type="button">
              Delete
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
