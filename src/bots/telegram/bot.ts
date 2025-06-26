import { Bot, Context } from "grammy";
import { config } from "dotenv";
import { handleRate, handleRateCallback } from "../../features/rates/rate.handler";
// Загружаем переменные из .env
config();

const bot = new Bot<Context>(process.env.BOT_TOKEN!);

// Команда /start
bot.command("start", async (ctx) => {
  await ctx.reply(
    `Привет, ${ctx.from?.first_name || "друг"}! 👋

Я помогу тебе отслеживать курсы валют к белорусскому рублю (BYN).

📌 Доступные команды:
/rate [код валюты] — курс валюты к BYN (по умолчанию USD)
/subscribe — ежедневная рассылка курса
/unsubscribe — отключить рассылку`
  );
});

bot.command("rate", handleRate);

bot.command("rate", handleRate);
bot.on("callback_query:data", handleRateCallback);


export { bot };
