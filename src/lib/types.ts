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
