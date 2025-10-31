import { Context, InlineKeyboard } from "grammy";
import { getUserSubscriptions } from "../../entities/user/user.repo";
import { listChangeSubscriptions } from "../../entities/user/change.repo";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/utils/navigation";

export async function handleListSubscriptions(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.SUBSCRIPTIONS);

  const subs = getUserSubscriptions(chatId);
  const changeSubs = listChangeSubscriptions(chatId);
  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  if (subs.length === 0 && changeSubs.length === 0) {
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

  const dailyLines = subs.map(
    (s) => `• <b>${s.currency}</b> — ${s.hour.toString().padStart(2, "0")}:${(s.minute ?? 0).toString().padStart(2, "0")}`
  );
  const changeLines = changeSubs.map((c) => `• <b>${c}</b> — при изменении курса`);

  const sections: string[] = [];
  if (dailyLines.length > 0) {
    sections.push(`<u>Ежедневные</u>\n${dailyLines.join("\n")}`);
  }
  if (changeLines.length > 0) {
    sections.push(`<u>По изменению</u>\n${changeLines.join("\n")}`);
  }
  
  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "➕ Добавить подписку", callback_data: "menu_subscribe" },
    { text: "❌ Удалить подписку", callback_data: "menu_unsubscribe" }
  ]);

  await ctx.reply(
    `${breadcrumbs}🔔 <b>Мои подписки</b>

${sections.join("\n\n")}

<i>Всего подписок: ${subs.length + changeSubs.length}</i>`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}
