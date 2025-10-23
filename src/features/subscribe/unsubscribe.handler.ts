import { Context, InlineKeyboard } from "grammy";
import { getUserSubscriptions, removeSubscription } from "../../entities/user/user.repo";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/utils/navigation";

export async function handleUnsubscribe(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.UNSUBSCRIBE);

  const subs = getUserSubscriptions(chatId);
  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  if (subs.length === 0) {
    const navKeyboard = NavigationManager.createNavigationKeyboard(chatId);
    
    await ctx.reply(
      `${breadcrumbs}❌ <b>Отписка от уведомлений</b>

❗ У тебя нет активных подписок.`,
      { 
        reply_markup: navKeyboard,
        parse_mode: "HTML"
      }
    );
    return;
  }

  const keyboard = new InlineKeyboard();
  for (const { currency, hour, minute } of subs) {
    keyboard.text(
      `${currency} — ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      `unsub_${currency}`
    );
  }

  // Добавляем навигационные кнопки
  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId);
  
  // Объединяем клавиатуры
  const combinedKeyboard = new InlineKeyboard();
  
  // Добавляем кнопки подписок
  for (const { currency, hour, minute } of subs) {
    combinedKeyboard.text(
      `${currency} — ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      `unsub_${currency}`
    );
  }
  
  // Добавляем навигационные кнопки
  const navButtons = NavigationManager.getBreadcrumbs(chatId);
  if (navButtons.length > 1) {
    combinedKeyboard.row();
    combinedKeyboard.text("🔙 Назад", "nav_back");
  }
  combinedKeyboard.text("🏠 Главное меню", "menu_main");

  await ctx.reply(
    `${breadcrumbs}❌ <b>Отписка от уведомлений</b>

Выбери подписку для удаления:`,
    { 
      reply_markup: combinedKeyboard,
      parse_mode: "HTML"
    }
  );
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
