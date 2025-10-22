import { Context } from "grammy";

// Хранилище для отслеживания основного сообщения интерфейса часовых поясов
const timezoneInterfaceMessages = new Map<number, number>();

/**
 * Установить основное сообщение интерфейса для чата
 */
export function setTimezoneInterfaceMessage(chatId: number, messageId: number) {
  timezoneInterfaceMessages.set(chatId, messageId);
}

/**
 * Получить основное сообщение интерфейса для чата
 */
export function getTimezoneInterfaceMessage(chatId: number): number | undefined {
  return timezoneInterfaceMessages.get(chatId);
}

/**
 * Очистить основное сообщение интерфейса для чата
 */
export function clearTimezoneInterfaceMessage(chatId: number) {
  timezoneInterfaceMessages.delete(chatId);
}

/**
 * Отправить новое сообщение интерфейса и запомнить его ID
 */
export async function sendTimezoneInterfaceMessage(
  ctx: Context, 
  text: string, 
  options: any = {}
) {
  const message = await ctx.reply(text, options);
  setTimezoneInterfaceMessage(ctx.chat!.id, message.message_id);
  return message;
}

/**
 * Обновить существующее сообщение интерфейса или создать новое
 */
export async function updateTimezoneInterfaceMessage(
  ctx: Context,
  text: string,
  options: any = {}
) {
  const chatId = ctx.chat!.id;
  const existingMessageId = getTimezoneInterfaceMessage(chatId);

  if (existingMessageId) {
    try {
      // Пытаемся отредактировать существующее сообщение
      await ctx.api.editMessageText(chatId, existingMessageId, text, options);
      return { message_id: existingMessageId };
    } catch (error) {
      // Если редактирование не удалось (например, сообщение было удалено),
      // создаем новое сообщение
      console.log(`Failed to edit message ${existingMessageId}, creating new one:`, error);
      clearTimezoneInterfaceMessage(chatId);
    }
  }

  // Создаем новое сообщение
  const message = await ctx.reply(text, options);
  setTimezoneInterfaceMessage(chatId, message.message_id);
  return message;
}

/**
 * Завершить интерфейс часовых поясов и очистить отслеживание
 */
export function finishTimezoneInterface(chatId: number) {
  clearTimezoneInterfaceMessage(chatId);
}
