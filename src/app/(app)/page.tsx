"use client";

import { AgendaCard } from "@/components/avui/AgendaCard";
import { CountdownsCard } from "@/components/avui/CountdownsCard";
import { DayCard } from "@/components/avui/DayCard";
import { GoalsCard } from "@/components/avui/GoalsCard";
import { GreetingHeader } from "@/components/avui/GreetingHeader";
import { HabitsCard } from "@/components/avui/HabitsCard";
import { MoneyCard } from "@/components/avui/MoneyCard";
import { MoodCard } from "@/components/avui/MoodCard";
import { NumbersCard } from "@/components/avui/NumbersCard";
import { StudyCard } from "@/components/avui/StudyCard";
import { TopThree } from "@/components/avui/TopThree";
import { WeekFocus } from "@/components/avui/WeekFocus";

/** Cada targeta porta el seu `order-N` per al mòbil; a l'escriptori mana l'ordre del DOM (classes literals perquè Tailwind les detecti). */
const ITEM = "lg:order-none empty:hidden";

/**
 * Portada «Avui».
 * Escriptori: dues columnes independents que s'omplen de dalt a baix sense forats.
 *   Esquerra (ampla): agenda, properes entregues, [el teu dia | números], [comptes enrere | objectius].
 *   Dreta: les 3, com estàs, hàbits, diners.
 * Mòbil: una sola columna en l'ordre dels `order-N` (els contenidors fan `display: contents`).
 */
export default function AvuiPage() {
  return (
    <>
      <GreetingHeader />
      <WeekFocus />
      <div className="mt-6 flex flex-col gap-4 lg:grid lg:grid-cols-6 lg:items-start">
        <div className="contents lg:col-span-4 lg:flex lg:flex-col lg:gap-4">
          <div className={`order-4 ${ITEM}`}><AgendaCard /></div>
          <div className={`order-5 ${ITEM}`}><StudyCard /></div>
          <div className="contents lg:grid lg:grid-cols-2 lg:gap-4">
            <div className={`order-1 ${ITEM}`}><DayCard /></div>
            <div className={`order-6 ${ITEM}`}><NumbersCard /></div>
          </div>
          <div className="contents lg:grid lg:grid-cols-2 lg:gap-4">
            <div className={`order-8 ${ITEM}`}><CountdownsCard /></div>
            <div className={`order-9 ${ITEM}`}><GoalsCard /></div>
          </div>
        </div>
        <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-4">
          <div className={`order-2 ${ITEM}`}><TopThree /></div>
          <div className={`order-3 ${ITEM}`}><MoodCard /></div>
          <div className={`order-7 ${ITEM}`}><HabitsCard /></div>
          <div className={`order-10 ${ITEM}`}><MoneyCard /></div>
        </div>
      </div>
    </>
  );
}
