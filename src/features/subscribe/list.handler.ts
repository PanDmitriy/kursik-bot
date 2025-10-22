import { Context, InlineKeyboard } from "grammy";
import { getUserSubscriptions } from "../../entities/user/user.repo";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/utils/navigation";

export async function handleListSubscriptions(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.SUBSCRIPTIONS);

  const subs = getUserSubscriptions(chatId);
  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  if (subs.length === 0) {
    const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
      { text: "➕ Добавить подписку", callback_data: "menu_subscribe" }
    ]);
    
    await ctx.reply(
      `${breadcrumbs}🔔 <b>Мои подписки</b>

У тебя нет активных подписок.

Используй кнопку ниже, чтобы создать первую подписку:`,
      { 
        reply_markup: navKeyboard,
        parse_mode: "HTML"
      }
    );
    return;
  }

  const lines = subs.map(
    (s) => `• <b>${s.currency}</b> — ${s.hour.toString().padStart(2, "0")}:${(s.minute ?? 0).toString().padStart(2, "0")}`
  );
  
  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "➕ Добавить подписку", callback_data: "menu_subscribe" },
    { text: "❌ Удалить подписку", callback_data: "menu_unsubscribe" }
  ]);

  await ctx.reply(
    `${breadcrumbs}🔔 <b>Мои подписки</b>

${lines.join("\n")}

<i>Всего подписок: ${subs.length}</i>`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}
