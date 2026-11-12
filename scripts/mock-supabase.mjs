// Servidor que imita prou Supabase (PostgREST) per veure l'app amb dades simulades, sense login real.
// Ús: node scripts/mock-supabase.mjs   (port 54399)  i, en un altre terminal:
//     NEXT_PUBLIC_SUPABASE_URL=http://localhost:54399 npx next dev -p 3100
// Després, al navegador, executa a la consola el `seed` que mostra http://localhost:54399/session
// (desa una sessió falsa a localStorage) i recarrega. Les dades viuen en memòria i es perden en aturar-lo.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT ?? 54399);
const USER_ID = "00000000-0000-4000-8000-000000000001";

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const hhmm = (minutes) => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}:00`;
const now = new Date();
const nowMin = now.getHours() * 60 + now.getMinutes();
const today = iso(now);
const weekday = (now.getDay() + 6) % 7;
const monday = addDays(-weekday);
const at = (p) => ({ id: randomUUID(), user_id: USER_ID, created_at: new Date().toISOString(), ...p });

const db = {
  settings: [at({ display_name: "Eric", week_focus: "Preparar el parcial d'ER", week_focus_monday: monday, step_goal: 8000, water_goal: 8, sleep_goal_minutes: 450 })],
  tasks: [
    at({ title: "Repassar el tema 3 d'ER", date: today, top_rank: 1, done: true, done_at: new Date().toISOString() }),
    at({ title: "Enviar la pràctica d'Estructura de Dades", date: today, top_rank: 2, done: false, done_at: null }),
    at({ title: "Trucar a l'àvia", date: today, top_rank: 3, done: false, done_at: null }),
  ],
  events: [
    at({ title: "Estructura de Dades", start_time: hhmm(Math.max(0, nowMin - 180)), end_time: hhmm(Math.max(30, nowMin - 90)), kind: "class", date: null, weekday, repeat_until: null }),
    at({ title: "Gimnàs", start_time: hhmm(Math.max(0, nowMin - 30)), end_time: hhmm(Math.min(1439, nowMin + 15)), kind: "personal", date: today, weekday: null, repeat_until: null }),
    at({ title: "Sopar amb la Laia", start_time: hhmm(Math.min(1380, nowMin + 32)), end_time: hhmm(Math.min(1439, nowMin + 92)), kind: "personal", date: today, weekday: null, repeat_until: null }),
  ],
  countdowns: [
    at({ title: "Viatge a Roma", emoji: "✈️", start_date: addDays(-26), target_date: addDays(39), archived: false }),
    at({ title: "Parcial d'ER", emoji: "📚", start_date: addDays(-10), target_date: addDays(4), archived: false }),
  ],
  accounts: [
    at({ name: "Compte corrent", type: "checking", initial_balance_cents: 125000, color: "#2563eb", archived: false }),
    at({ name: "Estalvis", type: "savings", initial_balance_cents: 340000, color: "#16a34a", archived: false }),
  ],
  categories: [],
  transactions: [],
  recurring_rules: [],
  budgets: [],
  trades: [],
  price_cache: [],
};
db.transactions.push(
  at({ account_id: db.accounts[0].id, kind: "income", amount_cents: 90000, date: addDays(-8), description: "Nòmina", category_id: null, transfer_account_id: null, recurring_rule_id: null }),
  at({ account_id: db.accounts[0].id, kind: "expense", amount_cents: 4320, date: addDays(-2), description: "Supermercat", category_id: null, transfer_account_id: null, recurring_rule_id: null }),
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Expose-Headers": "Content-Range",
};

function send(res, status, body) {
  res.writeHead(status, { ...cors, "Content-Type": "application/json" });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

/** Filtres PostgREST mínims: col=eq.x, col=gte.x */
function applyFilters(rows, params) {
  let out = rows;
  for (const [k, v] of params) {
    if (["select", "order", "on_conflict", "limit", "offset", "columns"].includes(k)) continue;
    const [op, ...rest] = v.split(".");
    const val = rest.join(".");
    if (op === "eq") out = out.filter((r) => String(r[k]) === val);
    if (op === "gte") out = out.filter((r) => r[k] !== null && String(r[k]) >= val);
  }
  return out;
}

function readBody(req) {
  return new Promise((resolve) => {
    let s = "";
    req.on("data", (c) => (s += c));
    req.on("end", () => resolve(s ? JSON.parse(s) : null));
  });
}

createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204);
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/session") {
    const session = {
      access_token: "mock", refresh_token: "mock", token_type: "bearer", expires_in: 3600 * 24 * 365,
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
      user: { id: USER_ID, aud: "authenticated", role: "authenticated", email: "mock@example.test", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
    };
    const seed = `localStorage.setItem("sb-localhost-auth-token", ${JSON.stringify(JSON.stringify(session))}); location.href = "/";`;
    return send(res, 200, { seed });
  }
  if (url.pathname.startsWith("/auth/v1/user")) return send(res, 200, { id: USER_ID, aud: "authenticated", role: "authenticated", email: "mock@example.test" });
  if (url.pathname.startsWith("/auth/v1/")) return send(res, 200, {});

  const m = /^\/rest\/v1\/(\w+)$/.exec(url.pathname);
  if (!m || !(m[1] in db)) return send(res, 404, { message: `taula desconeguda: ${url.pathname}` });
  const table = db[m[1]];
  const wantsObject = (req.headers.accept ?? "").includes("vnd.pgrst.object");
  const reply = (rows) => (wantsObject ? (rows[0] ? send(res, 200, rows[0]) : send(res, 406, { message: "0 rows" })) : send(res, 200, rows));

  if (req.method === "GET") {
    const rows = applyFilters(table, url.searchParams);
    const offset = Number((req.headers.range ?? "0-").split("-")[0]) || Number(url.searchParams.get("offset") ?? 0);
    return reply(rows.slice(offset));
  }
  if (req.method === "POST") {
    const body = await readBody(req);
    const list = Array.isArray(body) ? body : [body];
    const conflict = url.searchParams.get("on_conflict");
    const out = [];
    for (const row of list) {
      const existing = conflict === "user_id" ? table[0] : undefined;
      if (existing) { Object.assign(existing, row); out.push(existing); continue; }
      if (m[1] === "tasks" && row.top_rank != null && table.some((t) => t.date === row.date && t.top_rank === row.top_rank)) {
        return send(res, 409, { message: 'duplicate key value violates unique constraint "tasks_user_date_rank_key"' });
      }
      const created = at({ done: false, done_at: null, archived: false, ...row });
      table.push(created);
      out.push(created);
    }
    return reply(out);
  }
  if (req.method === "PATCH") {
    const body = await readBody(req);
    const rows = applyFilters(table, url.searchParams);
    for (const r of rows) Object.assign(r, body);
    return reply(rows);
  }
  if (req.method === "DELETE") {
    const ids = new Set(applyFilters(table, url.searchParams).map((r) => r.id));
    db[m[1]] = table.filter((r) => !ids.has(r.id));
    return send(res, 204);
  }
  return send(res, 405, { message: "mètode no suportat" });
}).listen(PORT, () => console.log(`Mock de Supabase a http://localhost:${PORT}`));
