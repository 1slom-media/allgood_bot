// index.js
import { bot, startCommand, changeLanguageCommand, langCommand } from './bot.js';

// Komandalar ro'yxatini sozlash
bot.telegram.setMyCommands([
  { command: 'start', description: 'Botni boshlash' },
  { command: 'lang', description: 'Tilni o\'zgartirish' },
]);

// Komandalar
bot.start(startCommand);
bot.command('lang', langCommand);  // /lang komandasini qo'shish
bot.on('callback_query', changeLanguageCommand);

// Botni ishga tushirish
bot.launch();
