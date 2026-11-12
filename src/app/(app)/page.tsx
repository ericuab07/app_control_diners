"use client";

import { GreetingHeader } from "@/components/avui/GreetingHeader";
import { MoneyCard } from "@/components/avui/MoneyCard";
import { WeekFocus } from "@/components/avui/WeekFocus";

export default function AvuiPage() {
  return (
    <>
      <GreetingHeader />
      <WeekFocus />
      <div className="mt-6 grid gap-4">
        <MoneyCard />
      </div>
    </>
  );
}
