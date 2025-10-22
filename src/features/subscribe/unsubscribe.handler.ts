import { Context, InlineKeyboard } from "grammy";
import { getUserSubscriptions, removeSubscription } from "../../entities/user/user.repo";

export async function handleUnsubscribe(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const subs = getUserSubscriptions(chatId);
  if (subs.length === 0) {
    return ctx.reply("❗ У тебя нет активных подписок.");
  }

  const keyboard = new InlineKeyboard();
  for (const { currency, hour, minute } of subs) {
    keyboard.text(
      `${currency} — ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      `unsub_${currency}`
    );
  }

  await ctx.reply("Выбери подписку для удаления:", {
    reply_markup: keyboard,
  });
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
