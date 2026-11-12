"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { averageMood, MOODS, moodSeries } from "@/lib/calc/journal";
import { addDaysISO, fromISO } from "@/lib/dates";
import type { JournalEntry } from "@/lib/types";
import { Card } from "../ui";

const DAYS = 30;
const dayFmt = new Intl.DateTimeFormat("ca-ES", { day: "numeric", month: "short" });
const emoji = (v: number) => MOODS.find((m) => m.value === v)?.emoji ?? "";

/** Evolució de l'ànim (una sola sèrie): línia de 2 px, punts de 8 px, buits on no hi ha entrada. */
export function MoodChart({ entries, today }: { entries: JournalEntry[]; today: string }) {
  const data = useMemo(() => moodSeries(entries, today, DAYS).map((p) => ({ ...p, label: dayFmt.format(fromISO(p.date)).replace(".", "") })), [entries, today]);
  const avg = averageMood(entries, addDaysISO(today, -(DAYS - 1)), today);
  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl font-semibold">Ànim dels últims 30 dies</h2>
        <span className="num text-sm text-muted">Mitjana {avg === null ? "—" : `${avg.toFixed(1).replace(".", ",")} ${emoji(Math.round(avg))}`}</span>
      </div>
      <div className="h-52" role="img" aria-label={`Gràfic de l'ànim dels últims 30 dies. Mitjana ${avg === null ? "sense dades" : avg.toFixed(1)}. La llista d'entrades de sota té les mateixes dades.`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={emoji} tick={{ fontSize: 14 }} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              formatter={(v) => { const m = MOODS.find((x) => x.value === Number(v)); return [m ? `${m.emoji} ${m.label}` : "—", "Ànim"]; }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)" }}
              itemStyle={{ color: "var(--text)" }} cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} />
            <Line type="monotone" dataKey="mood" stroke="var(--primary)" strokeWidth={2} connectNulls={false}
              dot={{ r: 4, fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 6, stroke: "var(--surface)", strokeWidth: 2 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
