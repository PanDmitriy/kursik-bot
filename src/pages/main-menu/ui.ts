import { Context, InlineKeyboard } from "grammy";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/lib/navigation";
import { handleRate } from "../rates/ui";
import { handleListSubscriptions } from "../subscriptions/ui";
import { handleSettingsMenu, handleStatsMenu, handleHelpMenu } from "../settings/ui";

/**
 * Главное меню бота с основными функциями
 */
export async function handleMainMenu(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Очищаем хлебные крошки и устанавливаем главное меню
  NavigationManager.clearBreadcrumbs(chatId);
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.MAIN);

  const keyboard = new InlineKeyboard()
    .text("💰 Курсы валют", "menu_rates")
    .row()
    .text("🔔 Мои подписки", "menu_subscriptions")
    .text("⚙️ Настройки", "menu_settings")
    .row()
    .text("📊 Статистика", "menu_stats")
    .text("ℹ️ Помощь", "menu_help");

  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${breadcrumbs}🏠 <b>Главное меню</b>

Выбери нужную функцию:`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

/**
 * Обработка нажатий на кнопки главного меню
 */
export async function handleMenuCallback(ctx: Context, next: () => Promise<void>): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("menu_")) return next();

  await ctx.answerCallbackQuery();

  switch (data) {
    case "menu_main":
      await handleMainMenu(ctx);
      break;
      
    case "menu_rates":
      await handleRate(ctx);
      break;
      
    case "menu_subscriptions":
      await handleListSubscriptions(ctx);
      break;
      
    case "menu_settings":
      await handleSettingsMenu(ctx);
      break;
      
    case "menu_stats":
      await handleStatsMenu(ctx);
      break;
      
    case "menu_help":
      await handleHelpMenu(ctx);
      break;
      
    default:
      await ctx.reply("❓ Неизвестная команда");
  }
}
