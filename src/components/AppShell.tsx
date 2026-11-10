"use client";

import { BarChart3, CandlestickChart, Ellipsis, PiggyBank, Plus, Settings, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { TransactionForm } from "./TransactionForm";
import { cx } from "./ui";

const NAV = [
  { href: "/", label: "Balanç", icon: Wallet },
  { href: "/ingressos", label: "Ingressos", icon: TrendingUp },
  { href: "/despeses", label: "Despeses", icon: TrendingDown },
  { href: "/accions", label: "Accions", icon: CandlestickChart },
  { href: "/pressupostos", label: "Pressupostos", icon: PiggyBank },
  { href: "/estadistiques", label: "Estadístiques", icon: BarChart3 },
  { href: "/configuracio", label: "Configuració", icon: Settings },
];
// Al mòbil: dues seccions, el botó d'afegir al centre, una tercera secció i «Més».
const MOBILE_LEFT = NAV.slice(0, 2);
const MOBILE_RIGHT = NAV.slice(2, 3);
const MOBILE_MORE = NAV.slice(3);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [adding, setAdding] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const defaultKind = pathname.startsWith("/ingressos") ? "income" : "expense";

  const mobileLink = ({ href, label, icon: Icon }: (typeof NAV)[number]) => (
    <Link key={href} href={href} onClick={() => setMoreOpen(false)} aria-current={isActive(href) ? "page" : undefined}
      className={cx("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", isActive(href) ? "text-primary" : "text-muted")}>
      <Icon size={20} /> {label}
    </Link>
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-r border-border p-4 md:flex">
        <p className="mb-4 px-2 text-lg font-semibold tracking-tight">💶 Diners</p>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}
            className={cx("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium", isActive(href) ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-2 hover:text-text")}>
            <Icon size={18} /> {label}
          </Link>
        ))}
        <button onClick={() => setAdding(true)} className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-fg hover:opacity-90">
          <Plus size={18} /> Nou moviment
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {moreOpen && (
          <div className="border-b border-border p-2">
            {MOBILE_MORE.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMoreOpen(false)}
                className={cx("flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium", isActive(href) ? "text-primary" : "text-text")}>
                <Icon size={18} /> {label}
              </Link>
            ))}
          </div>
        )}
        <div className="grid grid-cols-5">
          {MOBILE_LEFT.map(mobileLink)}
          <button onClick={() => { setMoreOpen(false); setAdding(true); }} aria-label="Nou moviment" className="grid place-items-center">
            <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-fg shadow-md"><Plus size={24} /></span>
          </button>
          {MOBILE_RIGHT.map(mobileLink)}
          <button onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}
            className={cx("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", moreOpen || MOBILE_MORE.some((n) => isActive(n.href)) ? "text-primary" : "text-muted")}>
            <Ellipsis size={20} /> Més
          </button>
        </div>
      </nav>

      {adding && <TransactionForm defaultKind={defaultKind} onClose={() => setAdding(false)} />}
    </div>
  );
}
