import { InlineKeyboard } from "grammy";
import { AVAILABLE_CURRENCIES } from "../../entities/currency/model";

export function createCurrencyKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // Добавляем кнопки валют в один ряд
  for (const currency of AVAILABLE_CURRENCIES) {
    keyboard.text(currency.code, `rate_${currency.code}`);
  }
  
  // Переходим на новую строку для "Все валюты"
  keyboard.row().text("📊 Все валюты", "rate_all");
  
  return keyboard;
}

export function createRateDetailKeyboard(currency: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("🔄 Обновить", `rate_${currency}`)
    .text("📊 Все валюты", "rate_all")
    .row()
    .text("🔔 Подписаться", `sub_currency_${currency}`)
    .row();
}

export function createAllRatesKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🔄 Обновить", "rate_all")
    .row();
}
