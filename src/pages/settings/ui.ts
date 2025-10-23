import { Context, InlineKeyboard } from "grammy";
import { subscriptionApi } from "../../entities/subscription";
import { TimezoneService } from "../../shared/lib/timezone";
import { NavigationManager, NAVIGATION_LEVELS } from "../../shared/lib/navigation";

export async function handleSettingsMenu(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Проверяем, не находимся ли мы уже в меню настроек
  const breadcrumbs = NavigationManager.getBreadcrumbs(chatId);
  const isAlreadyInSettings = breadcrumbs.includes(NAVIGATION_LEVELS.SETTINGS);
  
  // Добавляем уровень в хлебные крошки только если мы еще не в меню настроек
  if (!isAlreadyInSettings) {
    NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.SETTINGS);
  }

  const currentBreadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  // Добавляем навигационные кнопки
  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "🌍 Часовой пояс", callback_data: "settings_timezone" },
    { text: "🔔 Уведомления", callback_data: "settings_notifications" }
  ]);

  await ctx.reply(
    `${currentBreadcrumbs}⚙️ <b>Настройки</b>

Выбери что хочешь настроить:`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleStatsMenu(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Добавляем уровень в хлебные крошки
  NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.STATS);

  // Получаем статистику пользователя
  const subs = subscriptionApi.getByChatId(chatId);
  const totalSubs = subs.length;
  
  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId);
  const breadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${breadcrumbs}📊 <b>Твоя статистика</b>

🔔 Активных подписок: <b>${totalSubs}</b>
💰 Отслеживаемых валют: <b>${new Set(subs.map(s => s.currency)).size}</b>
🌍 Часовой пояс: <b>${subscriptionApi.getUserTimezone(chatId)}</b>

<i>Статистика обновляется в реальном времени</i>`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleHelpMenu(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Проверяем, не находимся ли мы уже в меню помощи
  const breadcrumbs = NavigationManager.getBreadcrumbs(chatId);
  const isAlreadyInHelp = breadcrumbs.includes(NAVIGATION_LEVELS.HELP);
  
  // Добавляем уровень в хлебные крошки только если мы еще не в меню помощи
  if (!isAlreadyInHelp) {
    NavigationManager.addBreadcrumb(chatId, NAVIGATION_LEVELS.HELP);
  }

  const currentBreadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  // Создаем клавиатуру с кнопками помощи и навигацией
  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "📋 Команды", callback_data: "help_commands" },
    { text: "❓ FAQ", callback_data: "help_faq" }
  ]);

  await ctx.reply(
    `${currentBreadcrumbs}ℹ️ <b>Помощь</b>

Выбери что тебя интересует:`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleHelpCommands(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Проверяем, не находимся ли мы уже в разделе команд
  const breadcrumbs = NavigationManager.getBreadcrumbs(chatId);
  const isAlreadyInCommands = breadcrumbs.includes("Команды");
  
  // Добавляем уровень в хлебные крошки только если мы еще не в разделе команд
  if (!isAlreadyInCommands) {
    NavigationManager.addBreadcrumb(chatId, "Команды");
  }

  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "❓ FAQ", callback_data: "help_faq" }
  ]);
  const currentBreadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${currentBreadcrumbs}📋 <b>Доступные команды</b>

<b>Основные:</b>
/start — запуск бота
/menu — главное меню
/rate — курсы валют
/subscribe — подписка на уведомления
/unsubscribe — отмена подписки
/subscriptions — список подписок
/set_timezone — настройка часового пояса

<b>Быстрые действия:</b>
• Нажми на кнопки в главном меню
• Используй /menu для быстрого доступа ко всем функциям`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleHelpFaq(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  // Проверяем, не находимся ли мы уже в разделе FAQ
  const breadcrumbs = NavigationManager.getBreadcrumbs(chatId);
  const isAlreadyInFaq = breadcrumbs.includes("FAQ");
  
  // Добавляем уровень в хлебные крошки только если мы еще не в разделе FAQ
  if (!isAlreadyInFaq) {
    NavigationManager.addBreadcrumb(chatId, "FAQ");
  }

  const navKeyboard = NavigationManager.createNavigationKeyboard(chatId, [
    { text: "📋 Команды", callback_data: "help_commands" }
  ]);
  const currentBreadcrumbs = NavigationManager.formatBreadcrumbs(chatId);

  await ctx.reply(
    `${currentBreadcrumbs}❓ <b>Часто задаваемые вопросы</b>

<b>Как работает подписка?</b>
• Выбери валюту и время уведомления
• Бот будет присылать курс каждый день в указанное время
• Время учитывает твой часовой пояс

<b>Как изменить время уведомлений?</b>
• Отмени старую подписку через /unsubscribe
• Создай новую через /subscribe

<b>Откуда берутся курсы?</b>
• Используем официальный API Национального банка РБ
• Курсы обновляются ежедневно в рабочие дни

<b>Поддерживаемые валюты:</b>
USD, EUR, RUB, CNY, PLN`,
    { 
      reply_markup: navKeyboard,
      parse_mode: "HTML"
    }
  );
}
