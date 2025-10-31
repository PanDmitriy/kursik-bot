import db from "../../shared/db/db";

export function addChangeSubscription(chatId: number, currency: string): void {
  db.prepare(
    `INSERT OR IGNORE INTO change_subscriptions (chat_id, currency) VALUES (?, ?)`
  ).run(chatId, currency);
}

export function removeChangeSubscription(chatId: number, currency: string): void {
  db.prepare(
    `DELETE FROM change_subscriptions WHERE chat_id = ? AND currency = ?`
  ).run(chatId, currency);
}

export function listChangeSubscriptions(chatId: number): string[] {
  const rows = db
    .prepare(`SELECT currency FROM change_subscriptions WHERE chat_id = ?`)
    .all(chatId) as { currency: string }[];
  return rows.map((r) => r.currency);
}

export function getChangeSubscribersByCurrency(currency: string): number[] {
  const rows = db
    .prepare(`SELECT chat_id FROM change_subscriptions WHERE currency = ?`)
    .all(currency) as { chat_id: number }[];
  return rows.map((r) => r.chat_id);
}

export function getDistinctChangeCurrencies(): string[] {
  const rows = db
    .prepare(`SELECT DISTINCT currency FROM change_subscriptions`)
    .all() as { currency: string }[];
  return rows.map((r) => r.currency);
}

export function getLastRate(currency: string): { rate: number; scale: number } | null {
  const row = db
    .prepare(`SELECT rate, scale FROM last_rates WHERE currency = ?`)
    .get(currency) as { rate: number; scale: number } | undefined;
  return row ?? null;
}

export function setLastRate(currency: string, rate: number, scale: number): void {
  db.prepare(
    `INSERT INTO last_rates (currency, rate, scale, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(currency) DO UPDATE SET rate = excluded.rate, scale = excluded.scale, updated_at = excluded.updated_at`
  ).run(currency, rate, scale);
}


