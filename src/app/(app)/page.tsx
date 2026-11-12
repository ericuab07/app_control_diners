"use client";

import { AgendaCard } from "@/components/avui/AgendaCard";
import { DayCard } from "@/components/avui/DayCard";
import { GreetingHeader } from "@/components/avui/GreetingHeader";
import { MoneyCard } from "@/components/avui/MoneyCard";
import { TopThree } from "@/components/avui/TopThree";
import { WeekFocus } from "@/components/avui/WeekFocus";

export default function AvuiPage() {
  return (
    <>
      <GreetingHeader />
      <WeekFocus />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AgendaCard />
        <DayCard />
        <TopThree />
        <MoneyCard />
      </div>
    </>
  );
}
