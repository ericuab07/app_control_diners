"use client";

import { Plus, Repeat } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { eventStatus, eventsOn, minutesUntilStart, startsInLabel } from "@/lib/calc/agenda";
import { formatDuration, toMinutes } from "@/lib/time";
import type { LifeEvent } from "@/lib/types";
import { useLife } from "../LifeProvider";
import { Button, Card, cx } from "../ui";
import { EventForm, KIND_COLORS, KIND_LABELS } from "./EventForm";
import { useNow } from "./useNow";

export function AgendaCard() {
  const { events } = useLife();
  const { today, now } = useNow();
  const [editing, setEditing] = useState<LifeEvent | "new" | null>(null);

  const list = useMemo(
    () => eventsOn(events, today).map((ev) => ({ ev, status: eventStatus(ev, now) })),
    [events, today, now],
  );
  const pending = list.filter((i) => i.status !== "done").length;
  // La línia «ara» va just abans del primer que no s'ha acabat (o al final si tots han passat).
  const nowIndex = list.findIndex((i) => i.status !== "done");
  const firstUpcoming = list.findIndex((i) => i.status === "upcoming");

  const nowLine = (
    <li aria-hidden className="flex items-center gap-2 py-1">
      <span className="num w-12 text-right text-xs font-semibold text-primary">{now}</span>
      <span className="size-2 rounded-full bg-primary" />
      <span className="h-px flex-1 bg-primary" />
    </li>
  );

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl font-semibold">Agenda d&apos;avui</h2>
          {list.length > 0 && <p className="text-sm text-muted">{pending === 0 ? "Tot fet per avui" : `${pending} pendent${pending === 1 ? "" : "s"}`}</p>}
        </div>
        {list.length > 0 && (
          <Button variant="secondary" onClick={() => setEditing("new")} aria-label="Afegeix un esdeveniment"><Plus size={16} /> Afegir</Button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center">
          <p className="text-sm text-muted">Res a l&apos;agenda d&apos;avui.</p>
          <Button className="mt-3" onClick={() => setEditing("new")}><Plus size={16} /> Afegeix un esdeveniment</Button>
        </div>
      ) : (
        <ol className="space-y-1">
          {list.map(({ ev, status }, i) => {
            const label = i === firstUpcoming ? startsInLabel(minutesUntilStart(ev, now)) : null;
            return (
              <Fragment key={ev.id}>
                {i === nowIndex && nowLine}
                <li>
                  <button onClick={() => setEditing(ev)}
                    className={cx("flex w-full items-stretch gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-2", status === "done" && "opacity-55", status === "current" && "bg-surface-2")}>
                    <span className="num w-12 shrink-0 pt-0.5 text-right text-sm font-medium">{ev.start_time}</span>
                    <span className="w-1 shrink-0 rounded-full" style={{ background: KIND_COLORS[ev.kind] }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className={cx("block break-words font-medium", status === "done" && "line-through")}>{ev.title}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted">
                        {KIND_LABELS[ev.kind]} · {ev.start_time}–{ev.end_time} · {formatDuration(toMinutes(ev.end_time) - toMinutes(ev.start_time))}
                        {ev.weekday != null && <Repeat size={12} aria-label="Setmanal" />}
                      </span>
                    </span>
                    {status === "current" && <span className="self-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-fg">Ara</span>}
                    {label && <span className="self-center whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{label}</span>}
                  </button>
                </li>
              </Fragment>
            );
          })}
          {nowIndex === -1 && nowLine}
        </ol>
      )}
      {editing && <EventForm existing={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}
