import { Scenes, Markup } from "telegraf";
import client from "../db/db.js"; // DB ulanishini import qilish
import mainMenu from "./mainMenu.js";
import { userLanguages } from "../bot.js";
import updateGoogleSheet from "./sheets.js";
import { messagesRu, messagesUz } from "../utils/language.js";
import requestType from "./requestType.js";
import getFormattedDate from "../utils/formatedDate.js";

const { WizardScene } = Scenes;
const getLanguage = (ctx) => {
  const userId = ctx.from.id;
  return userLanguages[userId] || "uz";
};

// 1.Foydalanuvchidan requst Typeni olish
const askRequestType = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(
    language === "uz" ? messagesUz.type : messagesRu.type,
    requestType(language)
  );
  return ctx.wizard.next();
};

// 2. Foydalanuvchidan murojaatni olish
const askRequest = (ctx) => {
  const language = getLanguage(ctx);
  ctx.wizard.state.type = ctx.message.text;
  ctx.reply(
    language === "uz" ? messagesUz.writeQuestion : messagesRu.writeQuestion
  );
  return ctx.wizard.next();
};

// 3. Murojaatni saqlash va guruhga yuborish
const saveRequest = async (ctx) => {
  const { type } = ctx.wizard.state;
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
        INSERT INTO requests (user_chat_id, request_text, status_uz,status_ru,type)
        VALUES ($1, $2, $3,$4,$5)
        RETURNING id;
      `;
  const values = [chatId, requestText, "юборилган", "отправил", type]; // Statusni belgilash

  try {
    // Murojaatni DBga yozish
    const res = await client.query(query, values);
    const requestId = res.rows[0].id; // Yangi murojaat ID sini olish
    await updateGoogleSheet(
      requestId,
      "юборилган",
      "отправил",
      userInfo,
      requestText,
      type
    );

    ctx.reply(
      language === "uz"
        ? messagesUz.successQuestion
        : messagesRu.successQuestion,
      mainMenu(language)
    );

    // Murojaatni guruhga yuborish
    const groupChatId = "-4541484236";

    // userga yuboriladigan message
    const message =
      language === "uz"
        ? `
  ${messagesUz[4]}
  ID: ${requestId}
  ${messagesUz[7]} ${type}
  ${messagesUz[5]} ${first_name} ${last_name}
  ${messagesUz[6]} ${phone_number}
  ${messagesUz[0]} ${requestText}
  ${messagesUz[8]} ${getFormattedDate()}
  ${messagesUz[1]} юборилган
      `
        : `
  ${messagesRu[4]}
  ID: ${requestId}
  ${messagesRu[7]} ${type}
  ${messagesRu[5]} ${first_name} ${last_name}
  ${messagesRu[6]} ${phone_number}
  ${messagesRu[0]} ${requestText}
  ${messagesRu[8]} ${getFormattedDate()}
  ${messagesRu[1]} отправил
      `;
    // Inline tugma yaratish
    const inlineKeyboard = Markup.inlineKeyboard([
      [
        {
          text: `${messagesUz.viewReq}`,
          url: `https://t.me/test_allgod_bot?start=view_${requestId}`,
        },
      ],

      //   Markup.button.callback("Murojaatni ko'rish", `view_request_${requestId}`),
    ]);

    // Guruhga xabarni inline tugma bilan yuborish
    await ctx.reply(message, mainMenu(language));
    await ctx.telegram.sendMessage(groupChatId, message, inlineKeyboard);
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
const requestScene = new WizardScene(
  "request_scene",
  askRequestType,
  askRequest,
  saveRequest
);

export default requestScene;
