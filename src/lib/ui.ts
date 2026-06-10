export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium transition-transform duration-150 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:transform-none";

export const ui = {
  actionRow: "mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
  buttonDanger: `${buttonBase} border-red-500/30 bg-red-500/18 text-red-200`,
  buttonGhost: `${buttonBase} border-white/10 bg-white/5 text-stone-100`,
  buttonPrimary: `${buttonBase} border-transparent bg-linear-to-br from-sky-500 to-blue-600 text-white`,
  colorDot: "h-3 w-3 rounded-full",
  dualInput: "grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_92px] sm:items-center",
  emptyState:
    "mt-4 rounded-3xl border border-white/8 bg-white/5 p-4 text-sm leading-6 text-slate-300",
  emptyStateTitle: "mb-2 block text-base font-semibold text-white",
  eyebrow: "mb-1 text-[0.72rem] uppercase tracking-[0.18em] text-amber-200",
  field: "grid gap-2",
  fieldGrid: "mt-4 grid gap-4",
  fieldHint: "text-sm text-slate-300",
  input:
    "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-hidden transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30",
  metaCard: "mt-4 grid gap-3 rounded-3xl border border-white/8 bg-white/5 p-4",
  panel:
    "rounded-[28px] border border-white/10 bg-[color:var(--panel)] p-4 shadow-[0_24px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl",
  panelHeader: "flex flex-wrap items-start justify-between gap-3",
  panelTitle: "text-xl font-semibold tracking-tight text-white",
  sectionText: "text-sm leading-6 text-slate-300",
  softCard: "rounded-3xl border border-white/8 bg-white/5 p-4",
  statsLabel: "block text-sm text-slate-300",
  statsValue: "mt-1 block text-lg font-semibold text-white break-words",
  summaryList: "mt-4 flex flex-col gap-3",
  switchRow:
    "flex flex-wrap items-center justify-center gap-4 rounded-3xl border border-white/8 bg-white/5 p-4 text-sm text-stone-100",
  toolPill:
    "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-transform duration-150 hover:-translate-y-px",
  toolPillActive:
    "border-amber-400/55 bg-amber-400/20 text-amber-100",
};
