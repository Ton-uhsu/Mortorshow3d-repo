import { CATEGORY_COLORS } from "../../constants/editor";
import { ui } from "../../lib/ui";

interface SummaryPanelProps {
  catalogCount: number;
  categorySummary: Record<string, number>;
  hasPdfSource: boolean;
}

export function SummaryPanel({
  catalogCount,
  categorySummary,
  hasPdfSource,
}: SummaryPanelProps) {
  return (
    <section className={ui.panel}>
      <header className={ui.panelHeader}>
        <div>
          <p className={ui.eyebrow}>Map Summary</p>
          <h2 className={ui.panelTitle}>Category mix</h2>
        </div>
      </header>

      <div className={ui.summaryList}>
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div
            className="grid grid-cols-[12px_1fr_auto] items-center gap-3 rounded-3xl border border-white/8 bg-white/5 px-4 py-3"
            key={category}
          >
            <span className={ui.colorDot} style={{ backgroundColor: color }} />
            <span className="text-sm text-slate-200">{category}</span>
            <strong className="text-base font-semibold text-white">
              {categorySummary[category] ?? 0}
            </strong>
          </div>
        ))}
      </div>

      <div className={`${ui.metaCard} md:grid-cols-2`}>
        <div>
          <span className={ui.statsLabel}>Catalog rows</span>
          <strong className={ui.statsValue}>{catalogCount}</strong>
        </div>
        <div>
          <span className={ui.statsLabel}>Real asset source</span>
          <strong className={ui.statsValue}>
            {hasPdfSource ? "PDF + CSV" : "Image + CSV"}
          </strong>
        </div>
      </div>

      <div className={`${ui.softCard} mt-4`}>
        <strong className="mb-2 block text-white">Next step</strong>
        <p className={ui.sectionText}>
          Next we can refine booth placement tools, improve snapping, and make
          resizing booths even easier.
        </p>
      </div>
    </section>
  );
}
