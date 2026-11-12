"use client";

import { carryOverPlan } from "@/lib/calc/closeDay";
import { useLife } from "../LifeProvider";

/**
 * Passa tasques pendents d'un dia a un altre: ocupen els rangs lliures del dia nou i, si ja n'hi ha 3,
 * es converteixen en apunts de la safata. Torna quantes han anat a la safata.
 */
export function useCarryOver() {
  const { tasks, update, insert, remove } = useLife();
  return async (from: string, to: string, onlyIds?: string[]): Promise<number> => {
    let toInbox = 0;
    // Un per un: cada pas ocupa un rang i la BD comprova que no es repeteixi.
    for (const { task, rank } of carryOverPlan(tasks, from, to, onlyIds)) {
      if (rank !== null) {
        await update("tasks", task.id, { date: to, top_rank: rank });
      } else {
        await insert("inbox_items", { text: task.title });
        await remove("tasks", task.id);
        toInbox++;
      }
    }
    return toInbox;
  };
}
