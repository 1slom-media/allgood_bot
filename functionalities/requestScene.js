import { Scenes, Markup } from "telegraf";
import client from "../db/db.js"; // DB ulanishini import qilish
import mainMenu from "./mainMenu.js";
import { userLanguages } from "../bot.js";
import updateGoogleSheet from "./sheets.js";
import { messagesRu, messagesUz } from "../utils/language.js";

const { WizardScene } = Scenes;
const getLanguage = (ctx) => {
  const userId = ctx.from.id;
  return userLanguages[userId] || "uz";
};

// 1. Foydalanuvchidan murojaatni olish
const askRequest = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(
    language === "uz" ? messagesUz.writeQuestion : messagesRu.writeQuestion
  );
  return ctx.wizard.next();
};

// 2. Murojaatni saqlash va guruhga yuborish
const saveRequest = async (ctx) => {
  const requestText = ctx.message.text;
  const chatId = ctx.chat.id;
  const language = getLanguage(ctx);

  // Foydalanuvchini DBdan olish
  const userQuery = `SELECT first_name, last_name, phone_number FROM users WHERE chat_id = $1;`;
  const userValues = [chatId];

  let userInfo;
  try {
    const userRes = await client.query(userQuery, userValues);
    userInfo = userRes.rows[0]; // Foydalanuvchining ma'lumotlarini olish
  } catch (err) {
    console.error("Foydalanuvchini olishda xatolik:", err);
    return ctx.reply(
      language === "uz" ? messagesUz.error : messagesRu.error,
      mainMenu(language)
    );
  }

  if (!userInfo) {
    return ctx.reply(
      language === "uz" ? messagesUz.registerError : messagesRu.registerError,
      mainMenu(language)
    );
  }

  const { first_name, last_name, phone_number } = userInfo;

  // Murojaatlarni saqlash uchun DBga yozish
  const query = `
        INSERT INTO requests (user_chat_id, request_text, status_uz,status_ru)
        VALUES ($1, $2, $3,$4)
        RETURNING id;
      `;
  const values = [chatId, requestText, "yuborilgan", "отправил"]; // Statusni belgilash

  try {
    // Murojaatni DBga yozish
    const res = await client.query(query, values);
    const requestId = res.rows[0].id; // Yangi murojaat ID sini olish
    await updateGoogleSheet(
      requestId,
      "yuborilgan",
      "отправил",
      userInfo,
      requestText
    );

    ctx.reply(language === "uz" ? messagesUz.successQuestion : messagesRu.successQuestion, mainMenu(language));

    // Murojaatni guruhga yuborish
    const groupChatId = "-4541484236";

    // userga yuboriladigan message
    const message =
      language === "uz"
        ? `
  Yangi murojaat:
  ID: ${requestId}
  Murojaatchi: ${first_name} ${last_name}
  Aloqa uchun: ${phone_number}
  Murojaat: ${requestText}
  Status: yuborilgan
      `
        : `
  Новый запрос:
  ID: ${requestId}
  Отправитель: ${first_name} ${last_name}
  Контактный номер: ${phone_number}
  Запрос: ${requestText}
  Статус: отправил
      `;

    const messageGroup = `
  Yangi murojaat:
  ID: ${requestId}
  Murojaatchi: ${first_name} ${last_name}
  Aloqa uchun: ${phone_number}
  Murojaat: ${requestText}
  Status: yuborilgan
      `;

    // Inline tugma yaratish
    const inlineKeyboard = Markup.inlineKeyboard([
      [
        {
          text: "Murojaatni ko'rish",
          url: `https://t.me/test_allgod_bot?start=view_${requestId}`,
        },
      ],

      //   Markup.button.callback("Murojaatni ko'rish", `view_request_${requestId}`),
    ]);

    // Guruhga xabarni inline tugma bilan yuborish
    await ctx.telegram.sendMessage(groupChatId, messageGroup, inlineKeyboard);
    await ctx.reply(message, mainMenu(language));
  } catch (err) {
    console.error("Murojaatni saqlashda xatolik:", err);
    ctx.reply(
      language === "uz" ? messagesUz.error : messagesRu.error,
      mainMenu(language)
    );
  }

  return ctx.scene.leave();
};
// Murojaat sahnasini yaratish
const requestScene = new WizardScene("request_scene", askRequest, saveRequest);

export default requestScene;
