import { telegramBot } from "./bot";
import { handleMainMenu, handleMenuCallback } from "../../pages/main-menu/ui";
import { handleRate, handleRateCallback, handleAllRates } from "../../pages/rates/ui";
import { handleListSubscriptions } from "../../pages/subscriptions/ui";
import { handleSettingsMenu, handleStatsMenu, handleHelpMenu, handleHelpCommands, handleHelpFaq } from "../../pages/settings/ui";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/lib/navigation";

export function setupBotHandlers(): void {
  // Команда /start
  telegramBot.command("start", async (ctx) => {
    await ctx.reply(
      `Привет, ${ctx.from?.first_name || "друг"}! 👋

Я помогу тебе отслеживать курсы валют к белорусскому рублю (BYN).

📌 Доступные команды:
/rate [код валюты] — курс валюты к BYN (по умолчанию USD)
/subscribe — ежедневная рассылка курса
/unsubscribe — отключить рассылку
/subscriptions — список подписок
/set_timezone — установить часовой пояс

💡 <b>Совет:</b> Используй /menu для быстрого доступа ко всем функциям!`,
      { parse_mode: "HTML" }
    );
  });

  // Команда /menu - главное меню
  telegramBot.command("menu", handleMainMenu);

  // Команда /rate
  telegramBot.command("rate", handleRate);

  // Команда /subscriptions
  telegramBot.command("subscriptions", handleListSubscriptions);

  // Обработка "Все валюты"
  telegramBot.callbackQuery("rate_all", handleAllRates);

  // Обработка callback-запросов для курсов
  telegramBot.on("callback_query:data", handleRateCallback);

  // Обработка callback-запросов главного меню
  telegramBot.on("callback_query:data", handleMenuCallback);

  // Обработка callback-запросов настроек
  telegramBot.callbackQuery(/^settings_/, async (ctx) => {
    const data = ctx.callbackQuery?.data;
    if (data === "settings_timezone") {
      await ctx.reply("🌍 Настройка часового пояса - в разработке");
    } else if (data === "settings_notifications") {
      await ctx.reply("🔔 Настройки уведомлений пока в разработке");
    }
    await ctx.answerCallbackQuery();
  });

  // Обработка callback-запросов помощи
  telegramBot.callbackQuery(/^help_/, async (ctx) => {
    const data = ctx.callbackQuery?.data;
    if (data === "help_commands") {
      await handleHelpCommands(ctx);
    } else if (data === "help_faq") {
      await handleHelpFaq(ctx);
    }
    await ctx.answerCallbackQuery();
  });

  // Обработка кнопки "Назад"
  telegramBot.callbackQuery("nav_back", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    await ctx.answerCallbackQuery();
    
    // Удаляем последний уровень из хлебных крошек
    NavigationManager.removeLastBreadcrumb(chatId);
    
    // Получаем предыдущий уровень
    const breadcrumbs = NavigationManager.getBreadcrumbs(chatId);
    
    if (breadcrumbs.length === 0) {
      // Если нет хлебных крошек, возвращаемся в главное меню
      await handleMainMenu(ctx);
    } else {
      // Определяем, куда вернуться на основе последнего уровня
      const lastLevel = breadcrumbs[breadcrumbs.length - 1];
      
      switch (lastLevel) {
        case NAVIGATION_LEVELS.MAIN:
          await handleMainMenu(ctx);
          break;
        case NAVIGATION_LEVELS.RATES:
          await handleRate(ctx);
          break;
        case NAVIGATION_LEVELS.ALL_CURRENCIES:
          await handleRate(ctx);
          break;
        case NAVIGATION_LEVELS.SUBSCRIPTIONS:
          await handleListSubscriptions(ctx);
          break;
        case NAVIGATION_LEVELS.SETTINGS:
          await handleSettingsMenu(ctx);
          break;
        case NAVIGATION_LEVELS.STATS:
          await handleStatsMenu(ctx);
          break;
        case NAVIGATION_LEVELS.HELP:
          await handleHelpMenu(ctx);
          break;
        case "Команды":
        case "FAQ":
          await handleHelpMenu(ctx);
          break;
        default:
          await handleMainMenu(ctx);
      }
    }
  });
}
