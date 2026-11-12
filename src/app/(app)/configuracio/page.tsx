"use client";

import { useState } from "react";
import { AccountsSection } from "@/components/settings/AccountsSection";
import { CategoriesSection } from "@/components/settings/CategoriesSection";
import { DataSection } from "@/components/settings/DataSection";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { ImportSection } from "@/components/settings/ImportSection";
import { RecurringSection } from "@/components/settings/RecurringSection";
import { cx, PageHeader } from "@/components/ui";

const TABS = [
  { id: "profile", label: "Perfil", Component: ProfileSection },
  { id: "accounts", label: "Comptes", Component: AccountsSection },
  { id: "categories", label: "Categories", Component: CategoriesSection },
  { id: "recurring", label: "Recurrents", Component: RecurringSection },
  { id: "import", label: "Importar CSV", Component: ImportSection },
  { id: "data", label: "Dades i sessió", Component: DataSection },
] as const;

export default function SettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("profile");
  const Active = TABS.find((t) => t.id === tab)!.Component;
  return (
    <>
      <PageHeader title="Configuració" />
      <div role="tablist" className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={cx("-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium", tab === t.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-text")}>
            {t.label}
          </button>
        ))}
      </div>
      <Active />
    </>
  );
}
