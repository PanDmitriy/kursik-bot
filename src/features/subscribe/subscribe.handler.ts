import { Context, InlineKeyboard } from "grammy";
import { AVAILABLE_CURRENCIES } from "../rates/rate.handler";
import { addSubscription } from "../../entities/user/user.repo";

// Ожидание ввода времени для выбранной валюты по chatId
const pendingTimeByChatId = new Map<number, string>();

export async function handleSubscribe(ctx: Context) {
  const keyboard = new InlineKeyboard();

  for (const code of AVAILABLE_CURRENCIES) {
    keyboard.text(code, `sub_currency_${code}`);
  }

  await ctx.reply("Выбери валюту для подписки:", {
    reply_markup: keyboard,
  });
}

export async function handleSubscribeCurrency(ctx: Context, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("sub_currency_")) return next();

  const currency = data.replace("sub_currency_", "");
  await ctx.answerCallbackQuery();
  await ctx.reply(
    `Введи время для ${currency} в формате HH:mm (например, 09:00 или 18:45).`,
  );
  if (ctx.chat?.id) {
    pendingTimeByChatId.set(ctx.chat.id, currency);
  }
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

  addSubscription(chatId, pendingCurrency, hour, minute, "Europe/Minsk");
  await ctx.reply(
    `✅ Подписка: ${pendingCurrency} в ${match[0]} по Минску. Измени часовой пояс через /set_timezone`
  );
  pendingTimeByChatId.delete(chatId);
}
