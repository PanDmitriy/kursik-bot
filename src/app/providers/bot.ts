import { Bot, Context } from "grammy";
import { config } from "dotenv";

// Загружаем переменные из .env
config();

export const bot = new Bot<Context>(process.env.BOT_TOKEN!);

export { bot as telegramBot };
