import { Context, InlineKeyboard } from "grammy";
import { subscriptionApi } from "../../entities/subscription";
import { TimezoneService } from "../../shared/lib/timezone";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/lib/navigation";

export async function handleListSubscriptions(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.SUBSCRIPTIONS);

  const subscriptions = subscriptionApi.getByChatId(chatId);
  const userTimezone = subscriptionApi.getUserTimezone(chatId);
  const timezoneInfo = TimezoneService.getTimezoneInfo(userTimezone);
  
  const timezoneDisplay = timezoneInfo?.displayName || userTimezone;

  if (subscriptions.length === 0) {
    const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
      { text: "🔔 Подписаться", callback_data: "menu_subscribe" }
    ]);
    const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

    await ctx.reply(
      `${breadcrumbs}🔔 <b>Мои подписки</b>

У тебя пока нет активных подписок.

🌍 <b>Часовой пояс:</b> ${timezoneDisplay}

<i>Подпишись на уведомления о курсах валют!</i>`,
      { 
        reply_markup: navKeyboard,
        parse_mode: "HTML"
      }
    );
    return;
  }

  const subscriptionList = subscriptions.map(sub => {
    const time = `${sub.hour.toString().padStart(2, '0')}:${sub.minute.toString().padStart(2, '0')}`;
    return `💰 <b>${sub.currency}</b> — ${time}`;
  }).join('\n');

  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "🔔 Добавить подписку", callback_data: "menu_subscribe" },
    { text: "❌ Отписаться", callback_data: "menu_unsubscribe" }
  ]);
  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${breadcrumbs}🔔 <b>Мои подписки</b>

${subscriptionList}

🌍 <b>Часовой пояс:</b> ${timezoneDisplay}

<i>Всего подписок: ${subscriptions.length}</i>`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}
