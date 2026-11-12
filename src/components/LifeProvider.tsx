"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { supabase } from "@/lib/supabase";
import type { Settings } from "@/lib/types";

/** Columnes de `settings` que l'app llegeix i escriu. */
const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

function pickSettings(row: Record<string, unknown> | null): Settings {
  if (!row) return DEFAULT_SETTINGS;
  const out = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const k of SETTINGS_KEYS) if (row[k] !== undefined && row[k] !== null) out[k] = row[k];
  return out as unknown as Settings;
}

interface LifeContext {
  settings: Settings;
  saveSettings: (patch: Partial<Settings>) => Promise<void>;
}

const Ctx = createContext<LifeContext | null>(null);

export function useLife(): LifeContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLife s'ha d'usar dins de LifeProvider");
  return ctx;
}

/** Dades del panell de vida. Patró de DataProvider (que no es toca) per a les taules noves. */
export function LifeProvider({ session, children }: { session: Session; children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const reload = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("settings").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      // Sense fila (primera sessió): valors per defecte, sense escriure res.
      setSettings(pickSettings(data));
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

  const value = useMemo<LifeContext>(() => ({ settings, saveSettings }), [settings, saveSettings]);

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
