import { Context, InlineKeyboard } from "grammy";
import { AVAILABLE_CURRENCIES } from "../rates/rate.handler";
import { addChangeSubscription } from "../../entities/user/change.repo";
import { isPremium } from "../../shared/services/premium.service";

export async function handleSubscribeChange(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  if (!isPremium(chatId)) {
    await ctx.reply("🔒 Подписка по изменению курса доступна в премиум-версии.");
    return;
  }

  const keyboard = new InlineKeyboard();
  for (const code of AVAILABLE_CURRENCIES) {
    keyboard.text(code, `subchg_${code}`);
  }

  await ctx.reply(
    "🔔 Подписка на уведомления при изменении курса\n\nВыбери валюту:",
    { reply_markup: keyboard }
  );
}

export async function handleSubscribeChangeCurrency(
  ctx: Context,
  next: () => Promise<void>
) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("subchg_")) return next();

  const currency = data.replace("subchg_", "");
  const chatId = ctx.chat?.id;
  if (!chatId) return next();

  if (!isPremium(chatId)) {
    await ctx.answerCallbackQuery();
    await ctx.reply("🔒 Подписка по изменению курса доступна в премиум-версии.");
    return;
  }

  await addChangeSubscription(chatId, currency);
  await ctx.answerCallbackQuery({ text: `✅ Подписка на ${currency} оформлена` });
  await ctx.reply(
    `Теперь ты получишь уведомление, как только курс ${currency} изменится.`,
  );
}


