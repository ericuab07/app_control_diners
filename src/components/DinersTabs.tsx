"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

const TABS = [
  { href: "/diners", label: "Balanç" },
  { href: "/ingressos", label: "Ingressos" },
  { href: "/despeses", label: "Despeses" },
  { href: "/accions", label: "Accions" },
  { href: "/pressupostos", label: "Pressupostos" },
  { href: "/estadistiques", label: "Estadístiques" },
];

/** Pestanyes secundàries del mòdul Diners. */
export function DinersTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Diners" className="-mx-4 mb-5 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="flex w-max gap-1 border-b border-border">
        {TABS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={cx("-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium", active ? "border-primary text-primary" : "border-transparent text-muted hover:text-text")}>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
