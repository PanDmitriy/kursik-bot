import { Context, InlineKeyboard } from "grammy";
import { subscriptionApi } from "../../entities/subscription";
import { AVAILABLE_CURRENCIES } from "../../entities/currency";
import { TimezoneService } from "../../shared/lib/timezone";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/lib/navigation";

// Ожидание ввода времени для выбранной валюты по chatId
const pendingTimeByChatId = new Map<number, string>();

export async function handleSubscribe(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  console.log("handleSubscribe called for chatId:", chatId);
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.SUBSCRIBE);

  const keyboard = new InlineKeyboard();

  // Добавляем кнопки валют в ряды по 2-3 кнопки
  for (let i = 0; i < AVAILABLE_CURRENCIES.length; i += 2) {
    const row = [];
    
    // Первая кнопка в ряду
    const currency1 = AVAILABLE_CURRENCIES[i];
    row.push({ text: currency1.code, callback_data: `sub_currency_${currency1.code}` });
    console.log("Adding currency button:", currency1.code, "with callback:", `sub_currency_${currency1.code}`);
    
    // Вторая кнопка в ряду (если есть)
    if (i + 1 < AVAILABLE_CURRENCIES.length) {
      const currency2 = AVAILABLE_CURRENCIES[i + 1];
      row.push({ text: currency2.code, callback_data: `sub_currency_${currency2.code}` });
      console.log("Adding currency button:", currency2.code, "with callback:", `sub_currency_${currency2.code}`);
    }
    
    keyboard.row(...row);
  }

  // Добавляем навигационные кнопки
  const breadcrumbs = NavigationManager.getBreadcrumbs(chatId);
  if (breadcrumbs.length > 1) {
    keyboard.row();
    keyboard.text("🔙 Назад", "nav_back");
  }
  keyboard.text("🏠 Главное меню", "menu_main");
  const breadcrumbsText = NavigationManager.formatBreadcrumbs(chatId);

  console.log("Sending subscription message with keyboard");
  await ctx.reply(
    `${breadcrumbsText}🔔 <b>Подписка на уведомления</b>

Выбери валюту для подписки:`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
  console.log("Subscription message sent successfully");
}

export async function handleSubscribeCurrency(ctx: Context, next: () => Promise<void>): Promise<void> {
  const data = ctx.callbackQuery?.data;
  console.log("handleSubscribeCurrency called with data:", data);
  if (!data?.startsWith("sub_currency_")) return next();

  const currency = data.replace("sub_currency_", "");
  console.log("Selected currency:", currency);
  await ctx.answerCallbackQuery();
  await ctx.reply(
    `Введи время для ${currency} в формате HH:mm (например, 09:00 или 18:45).`,
  );
  if (ctx.chat?.id) {
    pendingTimeByChatId.set(ctx.chat.id, currency);
    console.log("Set pending currency for chat", ctx.chat.id, ":", currency);
  }
}

export async function handleSubscribeTime(ctx: Context, next: () => Promise<void>): Promise<void> {
  const text = ctx.message?.text?.trim();
  const chatId = ctx.chat?.id;
  console.log("handleSubscribeTime called with text:", text, "chatId:", chatId);
  if (!text || !chatId) return next();

  const pendingCurrency = pendingTimeByChatId.get(chatId);
  console.log("Pending currency for chat", chatId, ":", pendingCurrency);
  if (!pendingCurrency) return next();

  const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  console.log("Time match result:", match);
  if (!match) return next();

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  const userTimezone = subscriptionApi.getUserTimezone(chatId);
  const timezoneInfo = TimezoneService.getTimezoneInfo(userTimezone);
  
  subscriptionApi.add(chatId, pendingCurrency, hour, minute, userTimezone);
  
  const timezoneDisplay = timezoneInfo?.displayName || userTimezone;
  
  await ctx.reply(
    `✅ <b>Подписка создана!</b>

💰 Валюта: <b>${pendingCurrency}</b>
🕐 Время: <b>${match[0]}</b>
🌍 Часовой пояс: <b>${timezoneDisplay}</b>

Уведомления будут приходить ежедневно в указанное время.

<i>Изменить часовой пояс можно через /set_timezone</i>`,
    { parse_mode: "HTML" }
  );
  pendingTimeByChatId.delete(chatId);
}

export async function handleUnsubscribe(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.UNSUBSCRIBE);

  const subscriptions = subscriptionApi.getByChatId(chatId);

  if (subscriptions.length === 0) {
    const navKeyboard = NavigationManager.createNavigationKeyboard(chatId);
    const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

    await ctx.reply(
      `${breadcrumbs}❌ <b>Отписка от уведомлений</b>

У тебя нет активных подписок для отмены.`,
      { 
        reply_markup: navKeyboard,
        parse_mode: "HTML"
      }
    );
    return;
  }

  const keyboard = new InlineKeyboard();

  for (const sub of subscriptions) {
    const time = `${sub.hour.toString().padStart(2, '0')}:${sub.minute.toString().padStart(2, '0')}`;
    keyboard.text(`${sub.currency} (${time})`, `unsub_${sub.currency}`);
  }

  // Добавляем навигационные кнопки
  const breadcrumbs = NavigationManager.getBreadcrumbs(chatId);
  if (breadcrumbs.length > 1) {
    keyboard.row();
    keyboard.text("🔙 Назад", "nav_back");
  }
  keyboard.text("🏠 Главное меню", "menu_main");
  const breadcrumbsText = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${breadcrumbsText}❌ <b>Отписка от уведомлений</b>

Выбери подписку для отмены:`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleUnsubscribeCallback(ctx: Context, next: () => Promise<void>): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("unsub_")) return next();

  const currency = data.replace("unsub_", "");
  const chatId = ctx.chat?.id;
  
  if (!chatId) return next();

  await ctx.answerCallbackQuery();
  
  subscriptionApi.remove(chatId, currency);
  
  await ctx.reply(
    `✅ <b>Подписка отменена!</b>

💰 Валюта: <b>${currency}</b>

Ты больше не будешь получать уведомления по этой валюте.`,
    { parse_mode: "HTML" }
  );
}
