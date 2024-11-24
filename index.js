// index.js
import {
  bot,
  startCommand,
  changeLanguageCommand,
  langCommand,
} from "./bot.js";

let commandsSet = false; // Komandalar o'rnatilganligini tekshirish uchun flag

(async () => {
  if (!commandsSet) {
    await bot.telegram.setMyCommands(
      [
        { command: "start", description: "Ботни бошлаш" },
        { command: "lang", description: "Тилни ўзгартириш" },
      ],
      { scope: { type: "all_private_chats" } }
    );

    await bot.telegram.setMyCommands([], { scope: { type: "all_group_chats" } });

    commandsSet = true; // Bir marta bajarilgandan keyin flagni o'zgartiring
    console.log("Komandalar o'rnatildi!");
  }

  bot.start((ctx) => {
    if (ctx.chat.type !== "private") return;
    startCommand(ctx);
  });

  bot.command("lang", (ctx) => {
    if (ctx.chat.type !== "private") return;
    langCommand(ctx);
  });

  bot.on("callback_query", (ctx) => {
    if (ctx.chat.type !== "private") return;
    changeLanguageCommand(ctx);
  });

  bot.launch();
  console.log("Bot muvaffaqiyatli ishga tushdi!");
})();
