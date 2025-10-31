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
  
  // Если это запрос на выбор типа отписки, передаем его дальше
  if (data.startsWith("unsub_type_")) {
    return next();
  }

  // Парсим callback data: unsub_CURRENCY_HOUR_MINUTE или unsub_CURRENCY (старый формат)
  // Удаляем префикс "unsub_"
  const rest = data.replace("unsub_", "");
  const chatId = ctx.chat?.id;
  if (!chatId) return next();

  // Проверяем, есть ли в конце два числа через подчеркивание (час и минута)
  // Формат: CURRENCY_HOUR_MINUTE
  const match = rest.match(/^(.+)_(\d{1,2})_(\d{1,2})$/);
  
  if (match) {
    // Новый формат: unsub_CURRENCY_HOUR_MINUTE
    const [, currency, hourStr, minuteStr] = match;
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    console.log(`[UNSUBSCRIBE] Парсинг callback: data=${data}, rest=${rest}, currency=${currency}, hour=${hour}, minute=${minute}`);
    
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      await ctx.answerCallbackQuery({ text: "❌ Ошибка при обработке запроса" });
      return next();
    }

    // Для отладки: получаем текущие подписки
    const currentSubs = getUserSubscriptions(chatId);
    console.log(`[UNSUBSCRIBE] Текущие подписки для chatId=${chatId}:`, JSON.stringify(currentSubs));

    const deleted = removeSubscription(chatId, currency, hour, minute);
    if (deleted) {
      await ctx.answerCallbackQuery({ text: `✅ Подписка ${currency} на ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} удалена.` });
      await ctx.reply(`✅ Подписка на ${currency} в ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} отменена.`);
    } else {
      console.error(`[UNSUBSCRIBE] Не удалось удалить подписку: chatId=${chatId}, currency=${currency}, hour=${hour}, minute=${minute}`);
      await ctx.answerCallbackQuery({ text: `❌ Не удалось найти подписку ${currency} на ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}` });
      await ctx.reply(`❌ Не удалось удалить подписку. Возможно, она уже была удалена или не существует.`);
    }
  } else {
    // Старый формат для обратной совместимости: unsub_CURRENCY
    const currency = rest;
    const deleted = removeSubscription(chatId, currency);
    if (deleted) {
      await ctx.answerCallbackQuery({ text: `✅ Подписка для ${currency} удалена.` });
      await ctx.reply(`✅ Подписка на ${currency} отменена.`);
    } else {
      console.error(`[UNSUBSCRIBE] Не удалось удалить подписку: chatId=${chatId}, currency=${currency}`);
      await ctx.answerCallbackQuery({ text: `❌ Не удалось найти подписку ${currency}` });
      await ctx.reply(`❌ Не удалось удалить подписку. Возможно, она уже была удалена или не существует.`);
    }
  }
}

export async function handleUnsubscribeType(ctx: Context, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith("unsub_type_")) return next();

  const chatId = ctx.chat?.id;
  if (!chatId) return next();

  await ctx.answerCallbackQuery();

  if (data === "unsub_type_daily") {
    // Показать список ежедневных подписок с кнопками времени
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
    // Создаем кнопки для каждой комбинации валюта + время
    for (const { currency, hour, minute } of subs) {
      keyboard.text(
        `${currency} — ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        `unsub_${currency}_${hour}_${minute}`
      );
      keyboard.row();
    }
    keyboard.text("🏠 Главное меню", "menu_main");

    await ctx.reply(
      `❌ <b>Отписка от ежедневных</b>

Выбери время уведомления для отписки:`,
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
