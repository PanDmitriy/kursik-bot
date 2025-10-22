import { Context, Keyboard, InlineKeyboard } from "grammy";
import tzLookup from "tz-lookup";
import { setUserTimezone } from "../../entities/user/user.repo";
import { TimezoneService } from "../../shared/services/timezone.service";
import { 
  clearTimezoneMessages, 
  sendTrackedMessage, 
  editTrackedMessage,
  clearTimezoneMessagesList 
} from "../../shared/utils/message-manager";

export async function handleSetTimezone(ctx: Context) {
  // Очищаем предыдущие сообщения интерфейса
  await clearTimezoneMessages(ctx);

  const keyboard = new Keyboard()
    .requestLocation("📍 Отправить геолокацию")
    .row()
    .text("🗂 Выбрать из списка")
    .row()
    .text("🔍 Поиск часового пояса")
    .resized();

  await sendTrackedMessage(
    ctx,
    `🌍 <b>Настройка часового пояса</b>

Выбери способ установки часового пояса:

📍 <b>Геолокация</b> — автоматическое определение по координатам
🗂 <b>Список</b> — выбор из популярных часовых поясов
🔍 <b>Поиск</b> — найти нужный часовой пояс

<i>Часовой пояс нужен для корректного времени уведомлений о курсах валют.</i>`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleLocation(ctx: Context) {
  const location = ctx.message?.location;
  const chatId = ctx.chat?.id;
  if (!location || !chatId) return;

  try {
    const timezone = tzLookup(location.latitude, location.longitude);
    
    if (!TimezoneService.isValidTimezone(timezone)) {
      await sendTrackedMessage(ctx, "⚠️ Не удалось определить корректный часовой пояс по координатам.");
      return;
    }

    const timezoneInfo = TimezoneService.getTimezoneInfo(timezone);
    setUserTimezone(chatId, timezone);

    const currentTime = TimezoneService.getCurrentTimeInTimezone(timezone);
    
    await sendTrackedMessage(
      ctx,
      `✅ <b>Часовой пояс установлен!</b>

🌍 <b>${timezoneInfo?.displayName}</b>
🕐 Текущее время: <code>${currentTime}</code>

Теперь уведомления будут приходить в правильное время для твоего региона.`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    await sendTrackedMessage(ctx, "⚠️ Не удалось определить часовой пояс по координатам. Попробуй другой способ.");
  }
}

export async function handleManualTimezone(ctx: Context) {
  const popularTimezones = TimezoneService.getPopularTimezones();
  
  const keyboard = new InlineKeyboard();
  
  // Добавляем популярные часовые пояса в виде кнопок
  for (let i = 0; i < popularTimezones.length; i += 2) {
    const row = [];
    
    // Первая кнопка в ряду
    const tz1 = popularTimezones[i];
    row.push({ text: `🌍 ${tz1.name}`, callback_data: `tz_${tz1.id}` });
    
    // Вторая кнопка в ряду (если есть)
    if (i + 1 < popularTimezones.length) {
      const tz2 = popularTimezones[i + 1];
      row.push({ text: `🌍 ${tz2.name}`, callback_data: `tz_${tz2.id}` });
    }
    
    keyboard.row(...row);
  }
  
  // Добавляем кнопку для просмотра всех регионов
  keyboard.row({ text: "🗂 Все регионы", callback_data: "tz_regions" });

  await sendTrackedMessage(
    ctx,
    `🗂 <b>Популярные часовые пояса</b>

Выбери один из популярных часовых поясов или посмотри все доступные регионы:`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleTimezoneSearch(ctx: Context) {
  await sendTrackedMessage(
    ctx,
    `🔍 <b>Поиск часового пояса</b>

Введи название города или региона для поиска часового пояса.

<i>Например: Москва, Лондон, Токио, Нью-Йорк</i>`,
    { parse_mode: "HTML" }
  );
}

export async function handleTimezoneSearchQuery(ctx: Context) {
  const query = ctx.message?.text?.trim();
  const chatId = ctx.chat?.id;
  
  if (!query || !chatId) return;

  const results = TimezoneService.searchTimezones(query);
  
  if (results.length === 0) {
    await sendTrackedMessage(
      ctx,
      `🔍 <b>Результаты поиска</b>

По запросу "<i>${query}</i>" ничего не найдено.

Попробуй ввести название города или региона на русском или английском языке.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  const keyboard = new InlineKeyboard();
  
  for (const timezone of results.slice(0, 8)) { // Ограничиваем до 8 результатов
    keyboard.row({ 
      text: `🌍 ${timezone.displayName}`, 
      callback_data: `tz_${timezone.id}` 
    });
  }

  await sendTrackedMessage(
    ctx,
    `🔍 <b>Результаты поиска</b>

Найдено ${results.length} часовых поясов по запросу "<i>${query}</i>":`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleTimezoneRegions(ctx: Context) {
  const regions = TimezoneService.getTimezoneGroups();
  const keyboard = new InlineKeyboard();
  
  for (const [regionName, timezones] of Object.entries(regions)) {
    keyboard.row({ 
      text: `🌍 ${regionName} (${timezones.length})`, 
      callback_data: `tz_region_${regionName}` 
    });
  }
  
  keyboard.row({ text: "🔙 Назад к популярным", callback_data: "tz_popular" });

  await sendTrackedMessage(
    ctx,
    `🗂 <b>Все регионы</b>

Выбери регион для просмотра доступных часовых поясов:`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleTimezoneRegion(ctx: Context, regionName: string) {
  const regions = TimezoneService.getTimezoneGroups();
  const timezones = regions[regionName];
  
  if (!timezones) {
    await sendTrackedMessage(ctx, "⚠️ Регион не найден.");
    return;
  }

  const keyboard = new InlineKeyboard();
  
  // Показываем максимум 10 часовых поясов из региона
  for (const timezoneId of timezones.slice(0, 10)) {
    const timezoneInfo = TimezoneService.getTimezoneInfo(timezoneId);
    if (timezoneInfo) {
      keyboard.row({ 
        text: `🌍 ${timezoneInfo.displayName}`, 
        callback_data: `tz_${timezoneId}` 
      });
    }
  }
  
  keyboard.row({ text: "🔙 Назад к регионам", callback_data: "tz_regions" });

  await sendTrackedMessage(
    ctx,
    `🌍 <b>${regionName}</b>

Доступные часовые пояса в регионе:`,
    { 
      reply_markup: keyboard,
      parse_mode: "HTML"
    }
  );
}

export async function handleTimezoneCallback(ctx: Context, timezoneId: string) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  if (!TimezoneService.isValidTimezone(timezoneId)) {
    await ctx.answerCallbackQuery("⚠️ Неверный часовой пояс");
    return;
  }

  const timezoneInfo = TimezoneService.getTimezoneInfo(timezoneId);
  if (!timezoneInfo) {
    await ctx.answerCallbackQuery("⚠️ Ошибка получения информации о часовом поясе");
    return;
  }

  setUserTimezone(chatId, timezoneId);
  const currentTime = TimezoneService.getCurrentTimeInTimezone(timezoneId);

  // Очищаем все сообщения интерфейса часовых поясов
  await clearTimezoneMessages(ctx);

  // Отправляем финальное сообщение (не отслеживаем его для удаления)
  await ctx.reply(
    `✅ <b>Часовой пояс установлен!</b>

🌍 <b>${timezoneInfo.displayName}</b>
🕐 Текущее время: <code>${currentTime}</code>

Теперь уведомления будут приходить в правильное время для твоего региона.`,
    { parse_mode: "HTML" }
  );

  await ctx.answerCallbackQuery("✅ Часовой пояс установлен!");
}

export async function handleTimezoneText(ctx: Context) {
  const timezone = ctx.message?.text;
  const chatId = ctx.chat?.id;

  if (!timezone || !chatId) return;

  // Проверяем, является ли текст валидным часовым поясом
  if (TimezoneService.isValidTimezone(timezone)) {
    const timezoneInfo = TimezoneService.getTimezoneInfo(timezone);
    if (timezoneInfo) {
      setUserTimezone(chatId, timezone);
      const currentTime = TimezoneService.getCurrentTimeInTimezone(timezone);
      
      // Очищаем все сообщения интерфейса часовых поясов
      await clearTimezoneMessages(ctx);
      
      // Отправляем финальное сообщение (не отслеживаем его для удаления)
      await ctx.reply(
        `✅ <b>Часовой пояс установлен!</b>

🌍 <b>${timezoneInfo.displayName}</b>
🕐 Текущее время: <code>${currentTime}</code>`,
        { parse_mode: "HTML" }
      );
      return;
    }
  }

  // Если это не часовой пояс, возможно это поисковый запрос
  await handleTimezoneSearchQuery(ctx);
}
