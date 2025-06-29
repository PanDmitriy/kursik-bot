import { Context, InlineKeyboard } from "grammy";
import { AVAILABLE_CURRENCIES } from "../rates/rate.handler";
import { addSubscription } from "../../entities/user/user.repo";

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

  const keyboard = new InlineKeyboard()
    .text("09:00", `sub_time_${currency}_9`)
    .text("12:00", `sub_time_${currency}_12`)
    .text("18:00", `sub_time_${currency}_18`);

  await ctx.answerCallbackQuery();
  await ctx.reply(`Выбери время рассылки для ${currency}:`, {
    reply_markup: keyboard,
  });
}

export async function handleSubscribeTime(ctx: Context, next: () => Promise<void>) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("sub_time_")) return next();

  const [, , currency, hourStr] = data.split("_");
  const hour = parseInt(hourStr);

  if (ctx.chat?.id && currency && hour) {
    addSubscription(ctx.chat.id, currency, hour);
    await ctx.answerCallbackQuery({ text: "Подписка оформлена!" });
    await ctx.reply(`✅ Подписка: ${currency} в ${hour.toString().padStart(2, "0")}:00`);
  }
}
