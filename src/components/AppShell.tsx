"use client";

import { Ellipsis, Flame, GraduationCap, NotebookPen, Plus, Settings, Sun, Target, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { isDinersPath, sectionOf, type Section } from "@/lib/nav";
import { DinersTabs } from "./DinersTabs";
import { QuickAdd } from "./QuickAdd";
import { TransactionForm } from "./TransactionForm";
import { cx } from "./ui";

type NavItem = { section: Section; href: string; label: string; icon: typeof Sun; mobile: "bar" | "more" };

const NAV: NavItem[] = [
  { section: "avui", href: "/", label: "Avui", icon: Sun, mobile: "bar" },
  { section: "habits", href: "/habits", label: "Hàbits", icon: Flame, mobile: "bar" },
  { section: "objectius", href: "/objectius", label: "Objectius", icon: Target, mobile: "bar" },
  { section: "estudis", href: "/estudis", label: "Estudis", icon: GraduationCap, mobile: "more" },
  { section: "diari", href: "/diari", label: "Diari", icon: NotebookPen, mobile: "more" },
  { section: "diners", href: "/diners", label: "Diners", icon: Wallet, mobile: "more" },
  { section: "configuracio", href: "/configuracio", label: "Configuració", icon: Settings, mobile: "more" },
];
const BAR = NAV.filter((n) => n.mobile === "bar");
const MORE = NAV.filter((n) => n.mobile === "more");
// Al mòbil el botó «+» queda al centre: la meitat dels elements de la barra a l'esquerra.
const BAR_LEFT = BAR.slice(0, Math.ceil(BAR.length / 2));
const BAR_RIGHT = BAR.slice(Math.ceil(BAR.length / 2));

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [adding, setAdding] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const current = sectionOf(pathname);
  const inDiners = isDinersPath(pathname);
  const defaultKind = pathname.startsWith("/ingressos") ? "income" : "expense";

  const mobileLink = ({ section, href, label, icon: Icon }: NavItem) => (
    <Link key={href} href={href} onClick={() => setMoreOpen(false)} aria-current={current === section ? "page" : undefined}
      className={cx("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", current === section ? "text-primary" : "text-muted")}>
      <Icon size={20} /> {label}
    </Link>
  );

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
        <button onClick={() => setAdding(true)} className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-fg hover:opacity-90">
          <Plus size={18} /> {inDiners ? "Nou moviment" : "Afegir"}
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-8">
        {inDiners && <DinersTabs />}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {moreOpen && (
          <div className="border-b border-border p-2">
            {MORE.map(({ section, href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMoreOpen(false)}
                className={cx("flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium", current === section ? "text-primary" : "text-text")}>
                <Icon size={18} /> {label}
              </Link>
            ))}
          </div>
        )}
        <div className="grid auto-cols-fr grid-flow-col">
          {BAR_LEFT.map(mobileLink)}
          <button onClick={() => { setMoreOpen(false); setAdding(true); }} aria-label={inDiners ? "Nou moviment" : "Afegir"} className="grid place-items-center">
            <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-fg shadow-md"><Plus size={24} /></span>
          </button>
          {BAR_RIGHT.map(mobileLink)}
          <button onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}
            className={cx("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", moreOpen || MORE.some((n) => n.section === current) ? "text-primary" : "text-muted")}>
            <Ellipsis size={20} /> Més
          </button>
        </div>
      </nav>

      {adding && (inDiners
        ? <TransactionForm defaultKind={defaultKind} onClose={() => setAdding(false)} />
        : <QuickAdd onClose={() => setAdding(false)} />)}
    </div>
  );
}
