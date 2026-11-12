"use client";

import { useState } from "react";
import { applyThemePref, parseThemePref, THEME_KEY, type ThemePref } from "@/lib/theme";
import { Card, Segmented } from "../ui";

function readPref(): ThemePref {
  try {
    return parseThemePref(localStorage.getItem(THEME_KEY));
  } catch {
    return "auto";
  }
}

/** Tema clar, fosc o automàtic. Es desa en aquest dispositiu (el mòbil i l'ordinador poden ser diferents). */
export function ThemeSection() {
  const [pref, setPref] = useState<ThemePref>(readPref);
  const change = (next: ThemePref) => {
    setPref(next);
    applyThemePref(next, document.documentElement, localStorage);
  };
  return (
    <Card className="max-w-lg">
      <h2 className="font-semibold">Aparença</h2>
      <p className="mb-3 mt-0.5 text-sm text-muted">«Automàtic» segueix el mode clar o fosc del dispositiu. Es desa només en aquest dispositiu.</p>
      <Segmented value={pref} onChange={change} options={[
        { value: "auto", label: "Automàtic" },
        { value: "light", label: "Clar" },
        { value: "dark", label: "Fosc" },
      ]} />
    </Card>
  );
}
