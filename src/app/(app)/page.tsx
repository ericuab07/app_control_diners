"use client";

import { AgendaCard } from "@/components/avui/AgendaCard";
import { CountdownsCard } from "@/components/avui/CountdownsCard";
import { DayCard } from "@/components/avui/DayCard";
import { GreetingHeader } from "@/components/avui/GreetingHeader";
import { MoneyCard } from "@/components/avui/MoneyCard";
import { TopThree } from "@/components/avui/TopThree";
import { WeekFocus } from "@/components/avui/WeekFocus";

/**
 * Portada «Avui». Mòbil: una columna en l'ordre del DOM (el teu dia, les 3, agenda…).
 * Escriptori: fila 1 = agenda ampla + les 3; fila 2 = el teu dia + comptes enrere + diners.
 */
export default function AvuiPage() {
  return (
    <>
      <GreetingHeader />
      <WeekFocus />
      <div className="mt-6 grid gap-4 lg:grid-cols-6">
        <div className="lg:order-3 lg:col-span-2"><DayCard /></div>
        <div className="lg:order-2 lg:col-span-2"><TopThree /></div>
        <div className="lg:order-1 lg:col-span-4"><AgendaCard /></div>
        <div className="lg:order-4 lg:col-span-2"><CountdownsCard /></div>
        <div className="lg:order-5 lg:col-span-2"><MoneyCard /></div>
      </div>
    </>
  );
}
