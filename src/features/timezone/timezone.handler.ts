import { Context, Keyboard } from "grammy";
import tzLookup from "tz-lookup";
import { setUserTimezone } from "../../entities/user/user.repo";

const popularZones = [
  "Europe/Minsk",
  "Europe/Moscow",
  "Europe/Kiev",
  "Europe/Vilnius",
  "Asia/Almaty",
];

export async function handleSetTimezone(ctx: Context) {
  const keyboard = new Keyboard()
    .requestLocation("📍 Отправить геолокацию")
    .row()
    .text("🗂 Выбрать из списка")
    .resized();

  await ctx.reply("Как ты хочешь указать свой часовой пояс?", {
    reply_markup: keyboard,
  });
}

export async function handleLocation(ctx: Context) {
  const location = ctx.message?.location;
  const chatId = ctx.chat?.id;
  if (!location || !chatId) return;

  try {
    const timezone = tzLookup(location.latitude, location.longitude);
    setUserTimezone(chatId, timezone);

    await ctx.reply(`✅ Часовой пояс установлен: ${timezone}`);
  } catch (err) {
    await ctx.reply("⚠️ Не удалось определить часовой пояс по координатам.");
  }
}

export async function handleManualTimezone(ctx: Context) {
  const keyboard = new Keyboard();
  for (const zone of popularZones) {
    keyboard.text(zone);
  }

  await ctx.reply("Выбери один из часовых поясов:", {
    reply_markup: keyboard.resized(),
  });
}

export async function handleTimezoneText(ctx: Context) {
  const timezone = ctx.message?.text;
  const chatId = ctx.chat?.id;

  if (!timezone || !chatId) return;

  if (!popularZones.includes(timezone)) {
    return ctx.reply("⚠️ Пожалуйста, выбери один из предложенных вариантов.");
  }

  setUserTimezone(chatId, timezone);
  await ctx.reply(`✅ Часовой пояс установлен: ${timezone}`);
}
