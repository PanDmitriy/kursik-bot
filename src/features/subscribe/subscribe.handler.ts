import { Context, InlineKeyboard } from "grammy";
import { AVAILABLE_CURRENCIES } from "../rates/rate.handler";
import { addSubscription, getUserTimezone } from "../../entities/user/user.repo";
import { addChangeSubscription } from "../../entities/user/change.repo";
import { isPremium } from "../../shared/services/premium.service";
import { TimezoneService } from "../../shared/services/timezone.service";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/utils/navigation";

// Ожидание ввода времени для выбранной валюты по chatId
const pendingTimeByChatId = new Map<number, string>();

export async function handleSubscribe(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.SUBSCRIBE);

  const keyboard = new InlineKeyboard();

  for (const code of AVAILABLE_CURRENCIES) {
    keyboard.text(code, `sub_currency_${code}`);
  }

  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId);
  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${breadcrumbs}🔔 <b>Подписка на уведомления</b>

Выбери валюту для подписки:`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleSubscribeCurrency(ctx: Context, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("sub_currency_")) return next();

  const currency = data.replace("sub_currency_", "");
  await ctx.answerCallbackQuery();
  const keyboard = new InlineKeyboard()
    .text("⏰ Ежедневно", `sub_type_daily_${currency}`)
    .row()
    .text("🔔 При изменении", `sub_type_change_${currency}`);

  await ctx.reply(
    `Выбери тип подписки для <b>${currency}</b>:`,
    { reply_markup: keyboard, parse_mode: "HTML" }
  );
}

export async function handleSubscribeTime(ctx: Context, next: () => Promise<void>) {
  const text = ctx.message?.text?.trim();
  const chatId = ctx.chat?.id;
  if (!text || !chatId) return next();

  const pendingCurrency = pendingTimeByChatId.get(chatId);
  if (!pendingCurrency) return next();

  const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return next();

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  const userTimezone = getUserTimezone(chatId);
  const timezoneInfo = TimezoneService.getTimezoneInfo(userTimezone);
  
  addSubscription(chatId, pendingCurrency, hour, minute, userTimezone);
  
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

export async function handleSubscribeType(ctx: Context, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("sub_type_")) return next();

  const chatId = ctx.chat?.id;
  if (!chatId) return next();

  await ctx.answerCallbackQuery();

  if (data.startsWith("sub_type_daily_")) {
    const currency = data.replace("sub_type_daily_", "");
    pendingTimeByChatId.set(chatId, currency);
    await ctx.reply(
      `Введи время для ${currency} в формате HH:mm (например, 09:00 или 18:45).`
    );
    return;
  }

  if (data.startsWith("sub_type_change_")) {
    const currency = data.replace("sub_type_change_", "");
    if (!isPremium(chatId)) {
      await ctx.reply("🔒 Подписка по изменению курса доступна в премиум-версии.");
      return;
    }
    addChangeSubscription(chatId, currency);
    await ctx.reply(`✅ Подписка по изменению курса для <b>${currency}</b> оформлена.`, { parse_mode: "HTML" });
    return;
  }
}
