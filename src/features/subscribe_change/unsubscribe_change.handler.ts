import { Context, InlineKeyboard } from "grammy";
import { listChangeSubscriptions, removeChangeSubscription } from "../../entities/user/change.repo";

export async function handleUnsubscribeChange(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const subs = await listChangeSubscriptions(chatId);
  if (subs.length === 0) {
    await ctx.reply("❌ У тебя нет подписок по изменению курса.");
    return;
  }

  const keyboard = new InlineKeyboard();
  for (const currency of subs) {
    keyboard.text(currency, `unsubchg_${currency}`);
  }

  await ctx.reply("Выбери подписку для удаления:", { reply_markup: keyboard });
}

export async function handleUnsubscribeChangeCallback(
  ctx: Context,
  next: () => Promise<void>
) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("unsubchg_")) return next();

  const currency = data.replace("unsubchg_", "");
  const chatId = ctx.chat?.id;
  if (!chatId) return next();

  await removeChangeSubscription(chatId, currency);
  await ctx.answerCallbackQuery({ text: `✅ Подписка для ${currency} удалена.` });
  await ctx.reply(`Подписка по изменению курса ${currency} отменена.`);
}


