import { Context } from "grammy";
import { getUserSubscriptions } from "../../entities/user/user.repo";

export async function handleListSubscriptions(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const subs = getUserSubscriptions(chatId);

  if (subs.length === 0) {
    return ctx.reply("🔔 У тебя нет активных подписок.");
  }

  const lines = subs.map(
    (s) => `• ${s.currency} — ${s.hour.toString().padStart(2, "0")}:${(s.minute ?? 0).toString().padStart(2, "0")}`
  );
  const text = `📋 Твои подписки:\n\n${lines.join("\n")}`;

  await ctx.reply(text);
}
