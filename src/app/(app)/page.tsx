"use client";

import { AgendaCard } from "@/components/avui/AgendaCard";
import { CountdownsCard } from "@/components/avui/CountdownsCard";
import { DayCard } from "@/components/avui/DayCard";
import { GoalsCard } from "@/components/avui/GoalsCard";
import { GreetingHeader } from "@/components/avui/GreetingHeader";
import { HabitsCard } from "@/components/avui/HabitsCard";
import { MoneyCard } from "@/components/avui/MoneyCard";
import { NumbersCard } from "@/components/avui/NumbersCard";
import { StudyCard } from "@/components/avui/StudyCard";
import { TopThree } from "@/components/avui/TopThree";
import { WeekFocus } from "@/components/avui/WeekFocus";

/**
 * Portada «Avui». Mòbil: una columna en l'ordre del DOM.
 * Escriptori: fila 1 = agenda ampla (i properes entregues a sota) + les 3; fila 2 = el teu dia + números +
 * hàbits; fila 3 = comptes enrere + objectius + diners.
 */
export default function AvuiPage() {
  return (
    <>
      <GreetingHeader />
      <WeekFocus />
      <div className="mt-6 grid gap-4 lg:grid-cols-6">
        <div className="lg:order-3 lg:col-span-2"><DayCard /></div>
        <div className="lg:order-2 lg:col-span-2"><TopThree /></div>
        <div className="flex flex-col gap-4 lg:order-1 lg:col-span-4">
          <AgendaCard />
          <StudyCard />
        </div>
        <div className="lg:order-4 lg:col-span-2"><NumbersCard /></div>
        <div className="lg:order-5 lg:col-span-2"><HabitsCard /></div>
        <div className="lg:order-6 lg:col-span-2"><CountdownsCard /></div>
        <div className="lg:order-7 lg:col-span-2"><GoalsCard /></div>
        <div className="lg:order-8 lg:col-span-2"><MoneyCard /></div>
      </div>
    </>
  );
}
