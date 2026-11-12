export type TxKind = "income" | "expense" | "transfer";
export type CategoryKind = "income" | "expense";
export type AccountType = "checking" | "savings" | "cash" | "broker" | "other";
export type Frequency = "weekly" | "monthly" | "yearly";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initial_balance_cents: number;
  color: string;
  archived: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  kind: TxKind;
  amount_cents: number;
  /** ISO date, YYYY-MM-DD */
  date: string;
  description: string;
  category_id: string | null;
  transfer_account_id: string | null;
  recurring_rule_id: string | null;
  created_at: string;
}

export interface RecurringRule {
  id: string;
  account_id: string;
  category_id: string | null;
  kind: CategoryKind;
  amount_cents: number;
  description: string;
  frequency: Frequency;
  start_date: string;
  end_date: string | null;
  next_date: string;
  active: boolean;
}

export interface Budget {
  id: string;
  /** null = pressupost global mensual */
  category_id: string | null;
  amount_cents: number;
}

export interface Trade {
  id: string;
  symbol: string;
  name: string;
  side: "buy" | "sell";
  quantity: number;
  /** Preu per acció en la moneda del valor */
  price: number;
  currency: string;
  /** EUR per 1 unitat de la moneda del valor, el dia de l'operació */
  fx_rate: number;
  fee_cents: number;
  date: string;
  account_id: string | null;
}

export interface PriceQuote {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  /** EUR per 1 unitat de la moneda del valor */
  fx_rate: number;
  manual: boolean;
  fetched_at: string;
}

/** Preferències del panell de vida (una fila per usuari a `settings`). */
export interface Settings {
  display_name: string;
  week_focus: string;
  week_focus_monday: string | null;
  step_goal: number;
  water_goal: number;
  sleep_goal_minutes: number;
}

export type EventKind = "class" | "work" | "personal" | "other";

/** Esdeveniment de l'agenda: puntual (`date`) o setmanal (`weekday` 0 = dilluns, fins a `repeat_until`). */
export interface LifeEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  kind: EventKind;
  date: string | null;
  weekday: number | null;
  repeat_until: string | null;
}

/** Tasca d'un dia; `top_rank` 1–3 la fa una de «les 3 d'avui». */
export interface Task {
  id: string;
  title: string;
  date: string;
  top_rank: 1 | 2 | 3 | null;
  done: boolean;
  done_at: string | null;
}

export interface Countdown {
  id: string;
  title: string;
  emoji: string;
  start_date: string;
  target_date: string;
  archived: boolean;
}
