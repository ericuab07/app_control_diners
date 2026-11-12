"use client";

import { useEffect, useState } from "react";
import { todayISO } from "@/lib/dates";
import { nowHHMM } from "@/lib/time";

const read = () => ({ today: todayISO(), now: nowHHMM() });

/** Data d'avui (ISO) i hora actual ("HH:MM"), refrescades cada 30 s. */
export function useNow(): { today: string; now: string } {
  const [value, setValue] = useState(read);
  useEffect(() => {
    const id = setInterval(() => {
      const next = read();
      setValue((v) => (v.today === next.today && v.now === next.now ? v : next));
    }, 30_000);
    return () => clearInterval(id);
  }, []);
  return value;
}
