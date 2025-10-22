import { Context } from "grammy";

// Хранилище для отслеживания сообщений интерфейса часовых поясов
const timezoneMessages = new Map<number, number[]>();

/**
 * Добавить ID сообщения в список для отслеживания
 */
export function trackTimezoneMessage(chatId: number, messageId: number) {
  if (!timezoneMessages.has(chatId)) {
    timezoneMessages.set(chatId, []);
  }
  timezoneMessages.get(chatId)!.push(messageId);
}

/**
 * Удалить все отслеживаемые сообщения интерфейса часовых поясов
 */
export async function clearTimezoneMessages(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const messageIds = timezoneMessages.get(chatId);
  if (!messageIds || messageIds.length === 0) return;

  // Удаляем сообщения с задержкой, чтобы избежать ошибок API
  for (const messageId of messageIds) {
    try {
      await ctx.api.deleteMessage(chatId, messageId);
      // Небольшая задержка между удалениями
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Игнорируем ошибки удаления (сообщение уже удалено или недоступно)
      console.log(`Failed to delete message ${messageId}:`, error);
    }
  }

  // Очищаем список сообщений
  timezoneMessages.delete(chatId);
}

/**
 * Очистить список отслеживаемых сообщений без удаления
 */
export function clearTimezoneMessagesList(chatId: number) {
  timezoneMessages.delete(chatId);
}

/**
 * Отправить сообщение и отследить его для последующего удаления
 */
export async function sendTrackedMessage(
  ctx: Context, 
  text: string, 
  options: any = {}
) {
  const message = await ctx.reply(text, options);
  trackTimezoneMessage(ctx.chat!.id, message.message_id);
  return message;
}

/**
 * Редактировать сообщение и отследить его
 */
export async function editTrackedMessage(
  ctx: Context,
  messageId: number,
  text: string,
  options: any = {}
) {
  const message = await ctx.api.editMessageText(ctx.chat!.id, messageId, text, options);
  trackTimezoneMessage(ctx.chat!.id, messageId);
  return message;
}
