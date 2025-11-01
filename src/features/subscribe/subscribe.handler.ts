import { Context, InlineKeyboard } from "grammy";
import { AVAILABLE_CURRENCIES } from "../rates/rate.handler";
import { addSubscription, getUserTimezone, getUserSubscriptions } from "../../entities/user/user.repo";
import { addChangeSubscription } from "../../entities/user/change.repo";
import { isPremium } from "../../shared/services/premium.service";
import { TimezoneService } from "../../shared/services/timezone.service";

// Ожидание ввода времени для выбранной валюты по chatId
const pendingTimeByChatId = new Map<number, string>();

export async function handleSubscribe(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const keyboard = new InlineKeyboard()
    .text("⏰ Ежедневно", "sub_type_daily")
    .row()
    .text("🔔 При изменении", "sub_type_change")
    .row()
    .text("🏠 Главное меню", "menu_main");

  await ctx.reply(
    `🔔 <b>Подписка на уведомления</b>

Выбери тип подписки:`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleSubscribeTypeSelect(ctx: Context, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data || (data !== "sub_type_daily" && data !== "sub_type_change")) return next();

  const chatId = ctx.chat?.id;
  if (!chatId) return next();

  await ctx.answerCallbackQuery();

  const keyboard = new InlineKeyboard();
  for (const code of AVAILABLE_CURRENCIES) {
    if (data === "sub_type_daily") {
      keyboard.text(code, `sub_currency_daily_${code}`);
    } else {
      keyboard.text(code, `sub_currency_change_${code}`);
    }
  }
  keyboard.row().text("🏠 Главное меню", "menu_main");

  const typeText = data === "sub_type_daily" ? "ежедневную" : "по изменению курса";
  await ctx.reply(
    `🔔 <b>Подписка на уведомления</b>

Выбери валюту для ${typeText} подписки:`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

/**
 * Обработка выбора типа подписки из деталей курса валюты
 * Показывает меню выбора типа подписки для конкретной валюты
 */
export async function handleSubscribeTypeSelectFromRate(ctx: Context, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("sub_type_select_")) return next();

  const chatId = ctx.chat?.id;
  if (!chatId) return next();

  await ctx.answerCallbackQuery();

  const currency = data.replace("sub_type_select_", "");
  
  // Проверяем, что валюта существует
  if (!AVAILABLE_CURRENCIES.includes(currency)) {
    await ctx.reply(`❌ Валюта ${currency} не поддерживается.`);
    return;
  }

  const keyboard = new InlineKeyboard()
    .text("⏰ Ежедневно", `sub_currency_daily_${currency}`)
    .row()
    .text("🔔 При изменении", `sub_currency_change_${currency}`)
    .row()
    .text("🏠 Главное меню", "menu_main");

  await ctx.reply(
    `🔔 <b>Подписка на ${currency}</b>

Выбери тип подписки:`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleSubscribeCurrency(ctx: Context, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("sub_currency_")) return next();

  await ctx.answerCallbackQuery();

  // Обработка ежедневной подписки
  if (data.startsWith("sub_currency_daily_")) {
    const currency = data.replace("sub_currency_daily_", "");
    const chatId = ctx.chat?.id;
    if (!chatId) return next();
    
    pendingTimeByChatId.set(chatId, currency);
    await ctx.reply(
      `Введи время для <b>${currency}</b> в формате HH:mm (например, 09:00 или 18:45).`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // Обработка подписки по изменению
  if (data.startsWith("sub_currency_change_")) {
    const currency = data.replace("sub_currency_change_", "");
    const chatId = ctx.chat?.id;
    if (!chatId) return next();
    
    if (!isPremium(chatId)) {
      await ctx.reply("🔒 Подписка по изменению курса доступна в премиум-версии.");
      return;
    }
    addChangeSubscription(chatId, currency);
    await ctx.reply(`✅ Подписка по изменению курса для <b>${currency}</b> оформлена.`, { parse_mode: "HTML" });
    return;
  }
}

export async function handleSubscribeTime(ctx: Context, next: () => Promise<void>) {
  const text = ctx.message?.text?.trim();
  const chatId = ctx.chat?.id;
  if (!text || !chatId) return next();

  const pendingCurrency = pendingTimeByChatId.get(chatId);
  if (!pendingCurrency) return next();

  // Проверяем формат времени HH:mm
  const match = text.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    await ctx.reply(
      `❌ <b>Неверный формат времени</b>\n\nПожалуйста, введи время для <b>${pendingCurrency}</b> в формате HH:mm (например, 09:00 или 18:45).`,
      { parse_mode: "HTML" }
    );
    return;
  }

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  // Проверяем диапазон часов (0-23)
  if (hour < 0 || hour > 23) {
    await ctx.reply(
      `❌ <b>Неверное значение часов</b>\n\nЧасы должны быть в диапазоне от 00 до 23.\nПожалуйста, введи время для <b>${pendingCurrency}</b> в формате HH:mm (например, 09:00 или 18:45).`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // Проверяем диапазон минут (0-59)
  if (minute < 0 || minute > 59) {
    await ctx.reply(
      `❌ <b>Неверное значение минут</b>\n\nМинуты должны быть в диапазоне от 00 до 59.\nПожалуйста, введи время для <b>${pendingCurrency}</b> в формате HH:mm (например, 09:00 или 18:45).`,
      { parse_mode: "HTML" }
    );
    return;
  }

  const userTimezone = getUserTimezone(chatId);
  const timezoneInfo = TimezoneService.getTimezoneInfo(userTimezone);
  
  addSubscription(chatId, pendingCurrency, hour, minute, userTimezone);
  
  const timezoneDisplay = timezoneInfo?.displayName || userTimezone;
  
  // Проверяем, сколько подписок уже есть для этой валюты
  const allSubs = getUserSubscriptions(chatId);
  const currencySubs = allSubs.filter(s => s.currency === pendingCurrency);
  
  let additionalMessage = "";
  if (currencySubs.length > 1) {
    additionalMessage = `\n\n💡 <i>У тебя ${currencySubs.length} подписки(ок) на ${pendingCurrency}. Можно добавить еще!</i>`;
  }

  await ctx.reply(
    `✅ <b>Подписка создана!</b>

💰 Валюта: <b>${pendingCurrency}</b>
🕐 Время: <b>${match[0]}</b>
🌍 Часовой пояс: <b>${timezoneDisplay}</b>

Уведомления будут приходить ежедневно в указанное время.
${additionalMessage}

<i>Изменить часовой пояс можно через /set_timezone</i>`,
    { parse_mode: "HTML" }
  );
  pendingTimeByChatId.delete(chatId);
}

