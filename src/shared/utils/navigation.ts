import { InlineKeyboard } from "grammy";

/**
 * Система навигации для бота
 */
export class NavigationManager {
  private static breadcrumbs = new Map<number, string[]>();

  /**
   * Добавить уровень в хлебные крошки
   */
  static addBreadcrumb(chatId: number, level: string) {
    const current = this.breadcrumbs.get(chatId) || [];
    current.push(level);
    this.breadcrumbs.set(chatId, current);
  }

  /**
   * Удалить последний уровень из хлебных крошек
   */
  static removeLastBreadcrumb(chatId: number) {
    const current = this.breadcrumbs.get(chatId) || [];
    if (current.length > 0) {
      current.pop();
      this.breadcrumbs.set(chatId, current);
    }
  }

  /**
   * Получить текущие хлебные крошки
   */
  static getBreadcrumbs(chatId: number): string[] {
    return this.breadcrumbs.get(chatId) || [];
  }

  /**
   * Очистить хлебные крошки
   */
  static clearBreadcrumbs(chatId: number) {
    this.breadcrumbs.delete(chatId);
  }

  /**
   * Создать клавиатуру с навигацией
   */
  static createNavigationKeyboard(
    chatId: number,
    additionalButtons: Array<{text: string, callback_data: string}> = []
  ): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    // Добавляем дополнительные кнопки
    for (const button of additionalButtons) {
      keyboard.text(button.text, button.callback_data);
    }
    
    // Добавляем кнопку "Назад" если есть хлебные крошки
    const breadcrumbs = this.getBreadcrumbs(chatId);
    if (breadcrumbs.length > 1) {
      keyboard.row();
      keyboard.text("🔙 Назад", "nav_back");
    }
    
    // Всегда добавляем кнопку "Главное меню"
    keyboard.text("🏠 Главное меню", "menu_main");
    
    return keyboard;
  }

  /**
   * Форматировать хлебные крошки для отображения
   */
  static formatBreadcrumbs(chatId: number): string {
    const breadcrumbs = this.getBreadcrumbs(chatId);
    if (breadcrumbs.length === 0) return "";
    
    return `📍 <b>${breadcrumbs.join(" > ")}</b>\n\n`;
  }

  /**
   * Создать кнопку "Назад" для конкретного уровня
   */
  static createBackButton(targetCallback: string): {text: string, callback_data: string} {
    return {
      text: "🔙 Назад",
      callback_data: targetCallback
    };
  }
}

/**
 * Константы для навигации
 */
export const NAVIGATION_LEVELS = {
  MAIN: "Главное меню",
  RATES: "Курсы валют",
  RATE_DETAIL: "Курс валюты",
  SUBSCRIPTIONS: "Мои подписки",
  SUBSCRIBE: "Подписка",
  UNSUBSCRIBE: "Отписка",
  SETTINGS: "Настройки",
  TIMEZONE: "Часовой пояс",
  STATS: "Статистика",
  HELP: "Помощь",
  ALL_CURRENCIES: "Все валюты"
} as const;
