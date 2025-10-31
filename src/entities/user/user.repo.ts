import db from "../../shared/db/db";

export interface Subscription {
  currency: string;
  hour: number;
  minute: number;
  timezone: string;
}

export function addSubscription(chatId: number, currency: string, hour: number, minute: number, timezone = "Europe/Minsk") {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO subscriptions (chat_id, currency, hour, minute, timezone)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(chatId, currency, hour, minute, timezone);
}


export function getUserSubscriptions(chatId: number): Subscription[] {
    return db.prepare(`SELECT currency, hour, minute, timezone FROM subscriptions WHERE chat_id = ?`).all(chatId) as Subscription[];
}

export function removeSubscription(chatId: number, currency: string, hour?: number, minute?: number): boolean {
  let result;
  
  if (hour !== undefined && minute !== undefined) {
    // Удаляем подписку с конкретным временем
    const hourNum = Number(hour);
    const minuteNum = Number(minute);
    const stmt = db.prepare(`
      DELETE FROM subscriptions WHERE chat_id = ? AND currency = ? AND hour = ? AND minute = ?
    `);
    result = stmt.run(chatId, currency, hourNum, minuteNum);
  } else {
    // Удаляем все подписки на эту валюту (обратная совместимость)
    const stmt = db.prepare(`
      DELETE FROM subscriptions WHERE chat_id = ? AND currency = ?
    `);
    result = stmt.run(chatId, currency);
  }
  
  // Возвращаем true, если была удалена хотя бы одна строка
  return (result.changes ?? 0) > 0;
}

export function getAllChatIds(): number[] {
  const rows = db.prepare("SELECT DISTINCT chat_id FROM subscriptions").all() as { chat_id: number }[];
  return rows.map((r) => r.chat_id);
}

export function getUserTimezone(chatId: number): string {
  const row = db.prepare(`
    SELECT timezone FROM subscriptions WHERE chat_id = ? LIMIT 1
  `).get(chatId) as { timezone: string } | undefined;
  
  return row?.timezone || "Europe/Minsk";
}

export function setUserTimezone(chatId: number, timezone: string) {
  db.prepare(`
    UPDATE subscriptions SET timezone = ? WHERE chat_id = ?
  `).run(timezone, chatId);
}
