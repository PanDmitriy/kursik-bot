import { Context } from "grammy";
import { getExchangeRate } from "../../shared/api/exchange";

export async function handleRate(ctx: Context) {
  const input = ctx.message?.text?.split(" ");
  const currency = input?.[1]?.toUpperCase() || "USD";

  await ctx.reply(`🔄 Получаю курс ${currency} по данным НБРБ...`);

  const result = await getExchangeRate(currency);

  if (result) {
    const { rate, scale } = result;
    await ctx.reply(`💱 ${scale} ${currency} = ${rate.toFixed(4)} BYN (по данным НБРБ)`);
  } else {
    await ctx.reply(`❌ Не удалось получить курс для ${currency}. Возможно, такая валюта не поддерживается НБРБ.`);
  }
}
