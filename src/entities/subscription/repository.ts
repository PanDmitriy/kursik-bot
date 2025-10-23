import db from "../../shared/db/db";
import { Subscription } from "./model";

export class SubscriptionRepository {
  static add(chatId: number, currency: string, hour: number, minute: number, timezone = "Europe/Minsk"): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO subscriptions (chat_id, currency, hour, minute, timezone)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(chatId, currency, hour, minute, timezone);
  }

  static getByChatId(chatId: number): Subscription[] {
    return db.prepare(`
      SELECT currency, hour, minute, timezone 
      FROM subscriptions 
      WHERE chat_id = ?
    `).all(chatId) as Subscription[];
  }

  static remove(chatId: number, currency: string): void {
    db.prepare(`
      DELETE FROM subscriptions WHERE chat_id = ? AND currency = ?
    `).run(chatId, currency);
  }

  static getAllChatIds(): number[] {
    const rows = db.prepare("SELECT DISTINCT chat_id FROM subscriptions").all() as { chat_id: number }[];
    return rows.map((r) => r.chat_id);
  }

  static getUserTimezone(chatId: number): string {
    const row = db.prepare(`
      SELECT timezone FROM subscriptions WHERE chat_id = ? LIMIT 1
    `).get(chatId) as { timezone: string } | undefined;
    
    return row?.timezone || "Europe/Minsk";
  }

  static setUserTimezone(chatId: number, timezone: string): void {
    db.prepare(`
      UPDATE subscriptions SET timezone = ? WHERE chat_id = ?
    `).run(timezone, chatId);
  }
}
