import { goalProgress, goalStatusLabel } from "@/lib/calc/goals";
import { formatNumber } from "@/lib/money";
import type { Goal } from "@/lib/types";
import { cx } from "../ui";

/** Barra de progrés d'un objectiu amb una marca al ritme esperat per la data. */
export function GoalBar({ goal, today }: { goal: Goal; today: string }) {
  const p = goalProgress(goal, today);
  const pct = Math.round(p.ratio * 100);
  const label = goalStatusLabel(p.status);
  return (
    <div>
      <div className="relative h-2.5 w-full rounded-full bg-surface-2" role="progressbar" aria-label={`${goal.title}: ${label}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={cx("h-full rounded-full", p.status === "behind" ? "bg-warn" : p.status === "done" ? "bg-done" : "bg-primary")} style={{ width: `${pct}%` }} />
        {p.status !== "done" && p.expected > 0 && p.expected < 1 && (
          <span className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-text/60" style={{ left: `${p.expected * 100}%` }} title="On hauries de ser avui" aria-hidden />
        )}
      </div>
      <p className="mt-1 flex justify-between gap-2 text-xs">
        <span className="num text-muted">{formatNumber(goal.current_value)} de {formatNumber(goal.target_value)} {goal.unit}</span>
        <span className={cx("font-medium", p.status === "behind" ? "text-warn" : p.status === "done" ? "text-done" : "text-primary")}>{label}</span>
      </p>
    </div>
  );
}
