import { Context, InlineKeyboard } from "grammy";
import { getExchangeRate } from "../../shared/api/exchange";

export const AVAILABLE_CURRENCIES = ["USD", "EUR", "RUB", "CNY", "PLN"];

export async function handleRate(ctx: Context) {
  const keyboard = new InlineKeyboard();

  for (const code of AVAILABLE_CURRENCIES) {
    keyboard.text(code, `rate_${code}`);
  }

  await ctx.reply("Выберите валюту:", {
    reply_markup: keyboard,
  });
}

// Обработка нажатий на кнопки
export async function handleRateCallback(ctx: Context) {
  const callbackData = ctx.callbackQuery?.data;

  if (!callbackData || !callbackData.startsWith("rate_")) return;

  const currency = callbackData.replace("rate_", "");

  const result = await getExchangeRate(currency);

  if (result) {
    const { rate, scale } = result;
    await ctx.answerCallbackQuery(); // убирает "загрузка..."
    await ctx.reply(`💱 ${scale} ${currency} = ${rate.toFixed(4)} BYN (по данным НБРБ)`);
  } else {
    await ctx.answerCallbackQuery({ text: "Ошибка получения курса", show_alert: true });
  }
}
