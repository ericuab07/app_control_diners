import type { HealthLog, Settings } from "../types";

export type HealthKey = "water" | "steps" | "sleep" | "workout";

/** Les 4 metes de salut del dia com a elements del progrés (sense registre: totes pendents). */
export function healthItems(
  log: HealthLog | undefined,
  goals: Pick<Settings, "step_goal" | "water_goal" | "sleep_goal_minutes">,
): { key: HealthKey; done: boolean }[] {
  return [
    { key: "water", done: (log?.water_glasses ?? 0) >= goals.water_goal },
    { key: "steps", done: (log?.steps ?? 0) >= goals.step_goal },
    { key: "sleep", done: (log?.sleep_minutes ?? 0) >= goals.sleep_goal_minutes },
    // Entrenar i descansar compten tots dos: descansar també és part del pla.
    { key: "workout", done: log?.workout != null },
  ];
}
