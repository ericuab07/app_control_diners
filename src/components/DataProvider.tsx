"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { dueOccurrences } from "@/lib/calc/recurring";
import { todayISO } from "@/lib/dates";
import { DEFAULT_CATEGORIES } from "@/lib/defaults";
import { supabase } from "@/lib/supabase";
import type { Account, Budget, Category, PriceQuote, RecurringRule, Trade, Transaction } from "@/lib/types";

interface Tables {
  accounts: Account;
  categories: Category;
  transactions: Transaction;
  recurring_rules: RecurringRule;
  budgets: Budget;
  trades: Trade;
}
type TableName = keyof Tables;
type State = { [K in TableName]: Tables[K][] };

const EMPTY: State = { accounts: [], categories: [], transactions: [], recurring_rules: [], budgets: [], trades: [] };
const PAGE = 1000;
const QUOTE_TTL_MS = 15 * 60 * 1000;

/** PostgREST retorna `numeric` com a text; aquí es converteix a número. */
const NUMERIC: Partial<Record<TableName, string[]>> = { trades: ["quantity", "price", "fx_rate"] };

function normalize<K extends TableName>(table: K, row: Record<string, unknown>): Tables[K] {
  for (const col of NUMERIC[table] ?? []) row[col] = Number(row[col]);
  return row as unknown as Tables[K];
}

async function fetchAll<K extends TableName>(table: K): Promise<Tables[K][]> {
  const out: Tables[K][] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...data.map((r) => normalize(table, r)));
    if (data.length < PAGE) return out;
  }
}

function toQuote(row: Record<string, unknown>): PriceQuote {
  return { ...(row as unknown as PriceQuote), price: Number(row.price), fx_rate: Number(row.fx_rate) };
}

interface DataContext extends State {
  session: Session;
  quotes: Map<string, PriceQuote>;
  quotesLoading: boolean;
  quotesFailed: string[];
  insert: <K extends TableName>(table: K, rows: Partial<Tables[K]> | Partial<Tables[K]>[]) => Promise<Tables[K][]>;
  update: <K extends TableName>(table: K, id: string, patch: Partial<Tables[K]>) => Promise<void>;
  remove: (table: TableName, id: string) => Promise<void>;
  reload: () => Promise<void>;
  /** Actualitza cotitzacions; sense `force` només si la memòria cau té més de 15 minuts. */
  refreshQuotes: (force?: boolean) => Promise<void>;
  lookupQuote: (symbol: string) => Promise<PriceQuote | null>;
  setManualPrice: (symbol: string, price: number, base: Pick<PriceQuote, "name" | "currency" | "fx_rate">) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<DataContext | null>(null);

export function useData(): DataContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData s'ha d'usar dins de DataProvider");
  return ctx;
}

/** Crea els moviments pendents de les regles recurrents. La clau única (regla, data) evita duplicats. */
async function runRecurring(rules: RecurringRule[]): Promise<boolean> {
  const today = todayISO();
  let created = false;
  for (const rule of rules) {
    const { dates, nextDate } = dueOccurrences(rule, today);
    if (dates.length > 0) {
      const { error } = await supabase.from("transactions").upsert(
        dates.map((date) => ({
          account_id: rule.account_id,
          category_id: rule.category_id,
          kind: rule.kind,
          amount_cents: rule.amount_cents,
          description: rule.description,
          date,
          recurring_rule_id: rule.id,
        })),
        { onConflict: "recurring_rule_id,date", ignoreDuplicates: true },
      );
      if (error) throw new Error(error.message);
      created = true;
    }
    if (nextDate !== rule.next_date) {
      const { error } = await supabase.from("recurring_rules").update({ next_date: nextDate }).eq("id", rule.id);
      if (error) throw new Error(error.message);
      rule.next_date = nextDate;
    }
  }
  return created;
}

async function loadEverything(): Promise<{ state: State; quotes: Map<string, PriceQuote> }> {
  const [accounts, categories, transactions, recurring_rules, budgets, trades, cache] = await Promise.all([
    fetchAll("accounts"),
    fetchAll("categories"),
    fetchAll("transactions"),
    fetchAll("recurring_rules"),
    fetchAll("budgets"),
    fetchAll("trades"),
    supabase.from("price_cache").select("*"),
  ]);
  if (cache.error) throw new Error(cache.error.message);
  const state: State = { accounts, categories, transactions, recurring_rules, budgets, trades };

  if (categories.length === 0) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(DEFAULT_CATEGORIES, { onConflict: "user_id,kind,name", ignoreDuplicates: true })
      .select();
    if (error) throw new Error(error.message);
    state.categories = data as Category[];
  }
  if (await runRecurring(recurring_rules)) state.transactions = await fetchAll("transactions");

  return { state, quotes: new Map(cache.data.map((r) => [r.symbol as string, toQuote(r)])) };
}

export function DataProvider({ session, children }: { session: Session; children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [quotes, setQuotes] = useState<Map<string, PriceQuote>>(new Map());
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesFailed, setQuotesFailed] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  // Mirall de `quotes` que s'actualitza abans del render: els efectes de les pàgines
  // s'executen abans que els del proveïdor i necessiten veure el valor recent.
  const quotesRef = useRef(quotes);
  const applyQuotes = useCallback((next: Map<string, PriceQuote>) => {
    quotesRef.current = next;
    setQuotes(next);
  }, []);

  const reload = useCallback(async () => {
    try {
      const loaded = await loadEverything();
      setState(loaded.state);
      applyQuotes(loaded.quotes);
      setStatus("ready");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, [applyQuotes]);

  const userId = session.user.id;
  const trades = state.trades;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- càrrega inicial des de la xarxa
    void reload();
  }, [reload, userId]);

  const insert = useCallback<DataContext["insert"]>(async (table, rows) => {
    const { data, error } = await supabase.from(table).insert(rows as never).select();
    if (error) throw new Error(error.message);
    const added = (data as Record<string, unknown>[]).map((r) => normalize(table, r));
    setState((s) => ({ ...s, [table]: [...s[table], ...added] }));
    return added;
  }, []);

  const update = useCallback<DataContext["update"]>(async (table, id, patch) => {
    const { data, error } = await supabase.from(table).update(patch as never).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    const row = normalize(table, data as Record<string, unknown>);
    setState((s) => ({ ...s, [table]: s[table].map((r) => (r.id === id ? row : r)) }));
  }, []);

  const remove = useCallback<DataContext["remove"]>(async (table, id) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw new Error(error.message);
    // Esborrar un compte o una categoria afecta altres taules (cascade / set null): es recarrega tot.
    if (table === "accounts" || table === "categories" || table === "recurring_rules") await reload();
    else setState((s) => ({ ...s, [table]: s[table].filter((r) => r.id !== id) }));
  }, [reload]);

  const fetchQuotes = useCallback(
    async (symbols: string[]): Promise<{ quotes: PriceQuote[]; failed: string[] }> => {
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return { quotes: [], failed: symbols };
      const json = await res.json();
      const now = new Date().toISOString();
      return {
        quotes: json.quotes.map((q: PriceQuote) => ({ ...q, manual: false, fetched_at: now })),
        failed: json.failed,
      };
    },
    [session.access_token],
  );

  const refreshQuotes = useCallback<DataContext["refreshQuotes"]>(
    async (force = false) => {
      const symbols = [...new Set(trades.map((t) => t.symbol))];
      if (symbols.length === 0) return;
      const now = Date.now();
      const stale = symbols.some((s) => {
        const q = quotesRef.current.get(s);
        return !q || now - new Date(q.fetched_at).getTime() > QUOTE_TTL_MS;
      });
      if (!force && !stale) return;
      setQuotesLoading(true);
      try {
        const result = await fetchQuotes(symbols);
        setQuotesFailed(result.failed);
        if (result.quotes.length > 0) {
          // Si desar la memòria cau falla, els preus es mostren igualment en aquesta sessió.
          const { error } = await supabase.from("price_cache").upsert(result.quotes, { onConflict: "user_id,symbol" });
          if (error) console.warn("No s'ha pogut desar la memòria cau de preus:", error.message);
          const next = new Map(quotesRef.current);
          for (const q of result.quotes) next.set(q.symbol, q);
          applyQuotes(next);
        }
      } catch {
        setQuotesFailed(symbols);
      } finally {
        setQuotesLoading(false);
      }
    },
    [fetchQuotes, trades, applyQuotes],
  );

  const lookupQuote = useCallback<DataContext["lookupQuote"]>(
    async (symbol) => {
      try {
        return (await fetchQuotes([symbol])).quotes[0] ?? null;
      } catch {
        return null;
      }
    },
    [fetchQuotes],
  );

  const setManualPrice = useCallback<DataContext["setManualPrice"]>(async (symbol, price, base) => {
    const quote: PriceQuote = { symbol, price, ...base, manual: true, fetched_at: new Date().toISOString() };
    const { error } = await supabase.from("price_cache").upsert(quote, { onConflict: "user_id,symbol" });
    if (error) throw new Error(error.message);
    applyQuotes(new Map(quotesRef.current).set(symbol, quote));
  }, [applyQuotes]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<DataContext>(
    () => ({
      ...state, session, quotes, quotesLoading, quotesFailed,
      insert, update, remove, reload, refreshQuotes, lookupQuote, setManualPrice, signOut,
    }),
    [state, session, quotes, quotesLoading, quotesFailed, insert, update, remove, reload, refreshQuotes, lookupQuote, setManualPrice, signOut],
  );

  if (status === "loading") {
    return <div className="grid min-h-dvh place-items-center text-muted">Carregant les teves dades…</div>;
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

