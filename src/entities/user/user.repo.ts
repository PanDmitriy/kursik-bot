import db from "../../shared/db/db";

export interface Subscription {
  currency: string;
  hour: number;
}


export function addSubscription(chatId: number, currency: string, hour: number) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO subscriptions (chat_id, currency, hour)
    VALUES (?, ?, ?)
  `);
  stmt.run(chatId, currency, hour);
}

export function getUserSubscriptions(chatId: number): Subscription[] {
  return db.prepare(`
    SELECT currency, hour FROM subscriptions WHERE chat_id = ?
  `).all(chatId) as Subscription[];
}

export function removeSubscription(chatId: number, currency: string): void {
  db.prepare(`
    DELETE FROM subscriptions WHERE chat_id = ? AND currency = ?
  `).run(chatId, currency);
}
