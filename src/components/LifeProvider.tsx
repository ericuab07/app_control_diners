"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addDaysISO, todayISO } from "@/lib/dates";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { supabase } from "@/lib/supabase";
import type { Countdown, Habit, HabitLog, HealthLog, LifeEvent, Settings, Task } from "@/lib/types";

/** Taules del panell de vida que es carreguen en memòria. */
export interface LifeTables {
  tasks: Task;
  events: LifeEvent;
  countdowns: Countdown;
  habits: Habit;
  habit_logs: HabitLog;
  health_logs: HealthLog;
}
export type LifeTable = keyof LifeTables;
type State = { [K in LifeTable]: LifeTables[K][] };

const EMPTY: State = { tasks: [], events: [], countdowns: [], habits: [], habit_logs: [], health_logs: [] };
const PAGE = 1000;
/** Dies d'historial que es carreguen de les taules diàries. */
const HISTORY_DAYS = 400;
/** Taules amb columna `date` que només es carreguen des de fa HISTORY_DAYS dies. */
const DATED: LifeTable[] = ["tasks", "habit_logs", "health_logs"];
/** Columnes `time` de Postgres ("HH:MM:SS") que es treballen com a "HH:MM". */
const TIMES: Partial<Record<LifeTable, string[]>> = { events: ["start_time", "end_time"] };

function normalize<K extends LifeTable>(table: K, row: Record<string, unknown>): LifeTables[K] {
  for (const col of TIMES[table] ?? []) if (typeof row[col] === "string") row[col] = (row[col] as string).slice(0, 5);
  return row as unknown as LifeTables[K];
}

async function fetchAll<K extends LifeTable>(table: K, since: string): Promise<LifeTables[K][]> {
  const out: LifeTables[K][] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select("*");
    if (DATED.includes(table)) q = q.gte("date", since);
    const { data, error } = await q
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...data.map((r) => normalize(table, r)));
    if (data.length < PAGE) return out;
  }
}

/** Columnes de `settings` que l'app llegeix i escriu. */
const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

function pickSettings(row: Record<string, unknown> | null): Settings {
  if (!row) return DEFAULT_SETTINGS;
  const out = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const k of SETTINGS_KEYS) if (row[k] !== undefined && row[k] !== null) out[k] = row[k];
  return out as unknown as Settings;
}

export interface LifeContext extends State {
  settings: Settings;
  saveSettings: (patch: Partial<Settings>) => Promise<void>;
  insert: <K extends LifeTable>(table: K, rows: Partial<LifeTables[K]> | Partial<LifeTables[K]>[]) => Promise<LifeTables[K][]>;
  update: <K extends LifeTable>(table: K, id: string, patch: Partial<LifeTables[K]>) => Promise<void>;
  remove: (table: LifeTable, id: string) => Promise<void>;
  /** Insereix o substitueix per la clau única `onConflict` (p. ex. "user_id,date"). */
  upsert: <K extends LifeTable>(table: K, row: Partial<LifeTables[K]>, onConflict: string) => Promise<LifeTables[K]>;
}

const Ctx = createContext<LifeContext | null>(null);

export function useLife(): LifeContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLife s'ha d'usar dins de LifeProvider");
  return ctx;
}

/** Dades del panell de vida. Patró de DataProvider (que no es toca) per a les taules noves. */
export function LifeProvider({ session, children }: { session: Session; children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const reload = useCallback(async () => {
    try {
      const since = addDaysISO(todayISO(), -HISTORY_DAYS);
      const [settingsRes, tasks, events, countdowns, habits, habit_logs, health_logs] = await Promise.all([
        supabase.from("settings").select("*").maybeSingle(),
        fetchAll("tasks", since),
        fetchAll("events", since),
        fetchAll("countdowns", since),
        fetchAll("habits", since),
        fetchAll("habit_logs", since),
        fetchAll("health_logs", since),
      ]);
      if (settingsRes.error) throw new Error(settingsRes.error.message);
      // Sense fila (primera sessió): valors per defecte, sense escriure res.
      setSettings(pickSettings(settingsRes.data));
      setState({ tasks, events, countdowns, habits, habit_logs, health_logs });
      setStatus("ready");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  const userId = session.user.id;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- càrrega inicial des de la xarxa
    void reload();
  }, [reload, userId]);

  const saveSettings = useCallback<LifeContext["saveSettings"]>(
    async (patch) => {
      // upsert per user_id: la primera sessió o dos dispositius alhora no creen duplicats.
      const next = { ...settings, ...patch };
      const { data, error } = await supabase
        .from("settings")
        .upsert({ ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      setSettings(pickSettings(data));
    },
    [settings],
  );

  const insert = useCallback<LifeContext["insert"]>(async (table, rows) => {
    const { data, error } = await supabase.from(table).insert(rows as never).select();
    if (error) throw new Error(error.message);
    const added = (data as Record<string, unknown>[]).map((r) => normalize(table, r));
    setState((s) => ({ ...s, [table]: [...s[table], ...added] }));
    return added;
  }, []);

  const update = useCallback<LifeContext["update"]>(async (table, id, patch) => {
    const { data, error } = await supabase.from(table).update(patch as never).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    const row = normalize(table, data as Record<string, unknown>);
    setState((s) => ({ ...s, [table]: (s[table] as { id: string }[]).map((r) => (r.id === id ? row : r)) }));
  }, []);

  const remove = useCallback<LifeContext["remove"]>(async (table, id) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw new Error(error.message);
    setState((s) => {
      const next = { ...s, [table]: (s[table] as { id: string }[]).filter((r) => r.id !== id) };
      // Esborrar un hàbit esborra els seus registres a la BD (cascade): també a l'estat.
      if (table === "habits") next.habit_logs = s.habit_logs.filter((l) => l.habit_id !== id);
      return next;
    });
  }, []);

  const upsert = useCallback<LifeContext["upsert"]>(async (table, row, onConflict) => {
    const { data, error } = await supabase.from(table).upsert(row as never, { onConflict }).select().single();
    if (error) throw new Error(error.message);
    const saved = normalize(table, data as Record<string, unknown>);
    const id = (saved as { id: string }).id;
    setState((s) => {
      const rows = s[table] as { id: string }[];
      return { ...s, [table]: rows.some((r) => r.id === id) ? rows.map((r) => (r.id === id ? saved : r)) : [...rows, saved] };
    });
    return saved;
  }, []);

  const value = useMemo<LifeContext>(
    () => ({ ...state, settings, saveSettings, insert, update, remove, upsert }),
    [state, settings, saveSettings, insert, update, remove, upsert],
  );

  if (status === "loading") {
    return <div className="grid min-h-dvh place-items-center text-muted">Carregant el teu panell…</div>;
  }
  if (status === "error") {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="font-medium">No s&apos;han pogut carregar les dades.</p>
          <p className="mt-1 text-sm text-muted">{errorMsg}</p>
          <button onClick={() => { setStatus("loading"); void reload(); }} className="mt-4 rounded-lg bg-primary px-4 py-2 font-medium text-primary-fg">
            Tornar-ho a provar
          </button>
        </div>
      </div>
    );
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
