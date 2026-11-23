"use client";

import { Flame, GraduationCap, Menu, NotebookPen, Plus, Settings, Sun, Target, Wallet, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isDinersPath, sectionOf, type Section } from "@/lib/nav";
import type { TxKind } from "@/lib/types";
import { DINERS_TABS, DinersTabs } from "./DinersTabs";
import { QuickAdd } from "./QuickAdd";
import { TransactionForm } from "./TransactionForm";
import { cx } from "./ui";

type NavItem = { section: Section; href: string; label: string; icon: typeof Sun };

const NAV: NavItem[] = [
  { section: "avui", href: "/", label: "Avui", icon: Sun },
  { section: "habits", href: "/habits", label: "Hàbits", icon: Flame },
  { section: "objectius", href: "/objectius", label: "Objectius", icon: Target },
  { section: "estudis", href: "/estudis", label: "Estudis", icon: GraduationCap },
  { section: "diari", href: "/diari", label: "Diari", icon: NotebookPen },
  { section: "diners", href: "/diners", label: "Diners", icon: Wallet },
  { section: "configuracio", href: "/configuracio", label: "Configuració", icon: Settings },
];

/** Què s'està afegint: «auto» és el «+» (moviment a Diners, tria a la resta). */
type Adding = null | "auto" | TxKind;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [adding, setAdding] = useState<Adding>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const current = sectionOf(pathname);
  const inDiners = isDinersPath(pathname);
  const defaultKind: TxKind = pathname.startsWith("/ingressos") ? "income" : "expense";
  const currentLabel = NAV.find((n) => n.section === current)?.label ?? "Panell de vida";

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-r border-border p-4 md:flex">
        <p className="mb-4 px-2 font-serif text-lg font-semibold tracking-tight">🌅 Panell de vida</p>
        {NAV.map(({ section, href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={current === section ? "page" : undefined}
            className={cx("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium", current === section ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-2 hover:text-text")}>
            <Icon size={18} /> {label}
          </Link>
        ))}
        <button onClick={() => setAdding("auto")} className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-fg hover:opacity-90">
          <Plus size={18} /> {inDiners ? "Nou moviment" : "Afegir"}
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Capçalera del mòbil: menú a dalt a l'esquerra. */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-surface/95 px-2 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
          <button onClick={() => setMenuOpen(true)} aria-label="Obre el menú" aria-expanded={menuOpen}
            className="grid size-11 place-items-center rounded-lg text-text hover:bg-surface-2">
            <Menu size={24} />
          </button>
          <p className="min-w-0 truncate font-serif text-lg font-semibold tracking-tight">{currentLabel}</p>
        </header>

        <main className="px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-8">
          {inDiners && <DinersTabs />}
          {children}
        </main>
      </div>

      {/* «+» flotant del mòbil, a l'abast del polze. */}
      <button onClick={() => setAdding("auto")} aria-label={inDiners ? "Nou moviment" : "Afegir"}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-fg shadow-lg md:hidden">
        <Plus size={26} />
      </button>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMenuOpen(false)}>
          <nav aria-label="Menú" className="drawer-in flex h-full w-[min(20rem,85vw)] flex-col overflow-y-auto border-r border-border bg-surface pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="font-serif text-lg font-semibold tracking-tight">🌅 Panell de vida</p>
              <button onClick={() => setMenuOpen(false)} aria-label="Tanca el menú" className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface-2">
                <X size={22} />
              </button>
            </div>

            <ul className="border-t border-border p-2">
              {NAV.map(({ section, href, label, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} onClick={() => setMenuOpen(false)} aria-current={current === section && section !== "diners" ? "page" : undefined}
                    className={cx("flex min-h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium", current === section ? "bg-primary/10 text-primary" : "text-text hover:bg-surface-2")}>
                    <Icon size={20} /> {label}
                  </Link>
                  {section === "diners" && (
                    <ul className="mb-1 ml-[1.375rem] border-l border-border pl-3">
                      {DINERS_TABS.map((tab) => (
                        <li key={tab.href}>
                          <Link href={tab.href} onClick={() => setMenuOpen(false)} aria-current={isActive(tab.href) ? "page" : undefined}
                            className={cx("flex min-h-10 items-center rounded-lg px-3 text-sm", isActive(tab.href) ? "font-medium text-primary" : "text-muted hover:bg-surface-2 hover:text-text")}>
                            {tab.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {adding === "auto" && !inDiners && <QuickAdd onClose={() => setAdding(null)} />}
      {adding !== null && (adding !== "auto" || inDiners) && (
        <TransactionForm defaultKind={adding === "auto" ? defaultKind : adding} onClose={() => setAdding(null)} />
      )}
    </div>
  );
}
