import { Context, InlineKeyboard } from "grammy";
import { getUserSubscriptions, removeSubscription } from "../../entities/user/user.repo";
import { handleUnsubscribeChange } from "../subscribe_change/unsubscribe_change.handler";

export async function handleUnsubscribe(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const keyboard = new InlineKeyboard()
    .text("⏰ Ежедневные", "unsub_type_daily")
    .row()
    .text("🔔 По изменению", "unsub_type_change")
    .row()
    .text("🏠 Главное меню", "menu_main");

  await ctx.reply(
    `❌ <b>Отписка от уведомлений</b>

Выбери тип подписки для удаления:`,
    { reply_markup: keyboard, parse_mode: "HTML" }
  );
}

export async function handleUnsubscribeCallback(ctx: Context, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("unsub_")) return next(); 

  const currency = data.replace("unsub_", "");
  const chatId = ctx.chat?.id;
  if (!chatId) return next();

  removeSubscription(chatId, currency);
  await ctx.answerCallbackQuery({ text: `✅ Подписка для ${currency} удалена.` });
  await ctx.reply(`Подписка на ${currency} отменена.`);
}

export async function handleUnsubscribeType(ctx: Context, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith("unsub_type_")) return next();

  const chatId = ctx.chat?.id;
  if (!chatId) return next();

  await ctx.answerCallbackQuery();

  if (data === "unsub_type_daily") {
    // Показать список ежедневных подписок
    const subs = getUserSubscriptions(chatId);

    if (subs.length === 0) {
      const keyboard = new InlineKeyboard()
        .text("🏠 Главное меню", "menu_main");
      await ctx.reply(
        `❌ <b>Отписка от ежедневных</b>

❗ У тебя нет ежедневных подписок.`,
        { reply_markup: keyboard, parse_mode: "HTML" }
      );
      return;
    }

    const keyboard = new InlineKeyboard();
    for (const { currency, hour, minute } of subs) {
      keyboard.text(
        `${currency} — ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        `unsub_${currency}`
      );
    }
    keyboard.row().text("🏠 Главное меню", "menu_main");

    await ctx.reply(
      `❌ <b>Отписка от ежедневных</b>

Выбери подписку для удаления:`,
      { reply_markup: keyboard, parse_mode: "HTML" }
    );
    return;
  }

  if (data === "unsub_type_change") {
    // Используем существующий обработчик для списка change-подписок
    await handleUnsubscribeChange(ctx);
    return;
  }
}
