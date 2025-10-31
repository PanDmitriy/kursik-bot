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
  
  // Для отладки: проверяем существующие записи перед удалением
  const checkStmt = db.prepare(`
    SELECT chat_id, currency, hour, minute FROM subscriptions WHERE chat_id = ? AND currency = ?
  `);
  const existing = checkStmt.all(chatId, currency) as Array<{chat_id: number, currency: string, hour: number, minute: number}>;
  console.log(`[REMOVE_SUBSCRIPTION] Найдено подписок для удаления: chatId=${chatId}, currency=${currency}, existing=`, JSON.stringify(existing));
  
  if (hour !== undefined && minute !== undefined) {
    // Удаляем подписку с конкретным временем
    // Убеждаемся, что hour и minute - числа
    const hourNum = Number(hour);
    const minuteNum = Number(minute);
    console.log(`[REMOVE_SUBSCRIPTION] Пытаемся удалить: chatId=${chatId}, currency=${currency}, hour=${hourNum} (type: ${typeof hourNum}), minute=${minuteNum} (type: ${typeof minuteNum})`);
    const stmt = db.prepare(`
      DELETE FROM subscriptions WHERE chat_id = ? AND currency = ? AND hour = ? AND minute = ?
    `);
    result = stmt.run(chatId, currency, hourNum, minuteNum);
    console.log(`[REMOVE_SUBSCRIPTION] Результат удаления: changes=${result.changes}`);
    
    // Если не удалось удалить по времени, попробуем удалить просто по валюте (fallback)
    if (result.changes === 0) {
      console.log(`[REMOVE_SUBSCRIPTION] Попытка удалить по валюте как fallback...`);
      const fallbackStmt = db.prepare(`
        DELETE FROM subscriptions WHERE chat_id = ? AND currency = ?
      `);
      const fallbackResult = fallbackStmt.run(chatId, currency);
      console.log(`[REMOVE_SUBSCRIPTION] Fallback результат: changes=${fallbackResult.changes}`);
      return (fallbackResult.changes ?? 0) > 0;
    }
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
