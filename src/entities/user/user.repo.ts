import db from "../../shared/db/db";

export interface Subscription {
  currency: string;
  hour: number;
  timezone: string;
}

export function addSubscription(chatId: number, currency: string, hour: number, timezone = "Europe/Minsk") {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO subscriptions (chat_id, currency, hour, timezone)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(chatId, currency, hour, timezone);
}


export function getUserSubscriptions(chatId: number): Subscription[] {
    return db.prepare(`SELECT currency, hour, timezone FROM subscriptions WHERE chat_id = ?`).all(chatId) as Subscription[];
}

export function removeSubscription(chatId: number, currency: string): void {
  db.prepare(`
    DELETE FROM subscriptions WHERE chat_id = ? AND currency = ?
  `).run(chatId, currency);
}

export function getAllChatIds(): number[] {
  const rows = db.prepare("SELECT DISTINCT chat_id FROM subscriptions").all() as { chat_id: number }[];
  return rows.map((r) => r.chat_id);
}

export function setUserTimezone(chatId: number, timezone: string) {
  db.prepare(`
    UPDATE subscriptions SET timezone = ? WHERE chat_id = ?
  `).run(timezone, chatId);
}
