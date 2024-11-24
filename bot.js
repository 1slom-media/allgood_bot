import { Telegraf, Scenes, session } from "telegraf";
import client from "./db/db.js";
import userInfoWizard from "./functionalities/loginScene.js";
import { messagesRu, messagesUz, statuses } from "./utils/language.js";
import mainMenu from "./functionalities/mainMenu.js";
import faqMenu from "./functionalities/faqMenu.js";
import requestScene from "./functionalities/requestScene.js";
import murojaatlarniKorish from "./functionalities/murojaatlarniKorish.js";
import murojaatniTekshirishScene from "./functionalities/murojaatniTekshirishScene.js";
import getFormattedDate from "./utils/formatedDate.js";

// Bot tokenini kiritish
const token = "5903395341:AAHFIlLNmQ6Z2wceX5ktmmiBvKNmn9hVyV8";
const bot = new Telegraf(token);

// bazani tinglash va notif yuborish--------------------------------------------------------------------------------------------------
client.connect();
client.query("LISTEN schedule_update");
client.on("notification", async (msg) => {
  const ids = msg.payload.split(","); // Bir nechta idlarni olish

  try {
    let messages = [];

    for (const id of ids) {
      const query = `
        SELECT id, status, backend_application_id, 
               client_info, 
               created_at, updated_at, merchant_id,
               approved_amount, goods_details, contract_period, 
               merchant_markup, merchant_name, formulated_at, provider_billing_id, 
               schedule_file
        FROM public.billing_applications 
        WHERE backend_application_id = $1;
      `;
      const result = await client.query(query, [id]);

      if (result.rows.length > 0) {
        const row = result.rows[0];

        const groupQuery = `
          SELECT group_id 
          FROM public.merchants_bot 
          WHERE merchant_id = $1;
        `;
        const groupResult = await client.query(groupQuery, [row.merchant_id]);

        if (groupResult.rows.length > 0) {
          const chatId = groupResult.rows[0].group_id;

          const message = `
*Поздравляем Вас\\!*  
Вы успешно оформили рассрочку клиенту  
*Заявка № ID* ${row.backend_application_id}  
*Ссылка линк на pdf рассрочкага:* [pdf документ](https://pdf\\.allgoodnasiya\\.uz/${row.schedule_file.replace(
            /\./g,
            "\\."
          )})
`.trim();

          // Xabarlarni bir joyga to'plab yuborish
          messages.push({ chatId, message });
        }
      }
    }

    // Barcha xabarlarni yuborish
    for (const msg of messages) {
      await bot.telegram.sendMessage(msg.chatId, msg.message, {
        parse_mode: "MarkdownV2",
      });
      console.log(`Xabar ${msg.chatId} guruhga yuborildi.`);
    }
  } catch (error) {
    console.error(`Bazaga so'rov yuborishda xatolik yuz berdi:`, error);
  }
});

// check register---------------------------------------------------------------------------------------------------------------------
const checkUserRegistered = async (chatId) => {
  const query = `SELECT * FROM users WHERE chat_id = $1;`;
  const values = [chatId];

  try {
    const res = await client.query(query, values);
    return res.rows.length > 0;
  } catch (err) {
    console.error("Foydalanuvchini tekshirishda xatolik:", err);
    return false;
  }
};

// stage
const stage = new Scenes.Stage([
  userInfoWizard,
  requestScene,
  murojaatniTekshirishScene,
]);
bot.use(session());
bot.use(stage.middleware());

// language tanlash fuksiyasi----------------------------------------------------------------------------------------------------------
const getLanguage = (ctx) => {
  const userId = ctx.from.id;
  return userLanguages[userId] || "uz"; // Default to Uzbek if no language is set
};

// Scene handlers----------------------------------------------------------------------------------------------------------------------
bot.hears([messagesUz.register, messagesRu.register], async (ctx) => {
  ctx.scene.enter("user_info_wizard");
});
bot.hears([messagesUz.sendQuestion, messagesRu.sendQuestion], (ctx) => {
  ctx.scene.enter("request_scene");
});
bot.hears([messagesUz.checkQuestion, messagesRu.checkQuestion], (ctx) => {
  ctx.scene.enter("murojaatni_tekshirish_scene");
});

// Tilni o'zgartirish uchun klaviatura--------------------------------------------------------------------------------------------------
const languageKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "O'zbekcha", callback_data: "uz" }],
      [{ text: "Русский", callback_data: "ru" }],
    ],
  },
};

// Botning boshlanishi-----------------------------------------------------------------------------------------------------------------
const startCommand = async (ctx) => {
  const userId = ctx.from.id;

  // Foydalanuvchi tilini olish
  const language = userLanguages[userId] || "uz"; // Default o'zbekcha

  // Tilni tanlash va saqlash
  ctx.reply(
    language === "uz" ? messagesUz.start : messagesRu.start,
    languageKeyboard
  );
  const args = ctx.message.text.split(" ");
  if (args[1] && args[1].startsWith("view_")) {
    const requestId = args[1].split("_")[1];
    await handleRequestView(ctx, requestId);
  } else {
    // Foydalanuvchining ro'yxatdan o'tganligini tekshirish
    const chatId = ctx.chat.id;
    const isRegistered = await checkUserRegistered(chatId);

    // Ro'yxatdan o'tgan foydalanuvchiga asosiy menyu
    await handleMainMenu(ctx, isRegistered, language);
  }
};

// request xolatini ko`rish -----------------------------------------------------------------------------------------------------------
const handleRequestView = async (ctx, requestId) => {
  try {
    const language = getLanguage(ctx); // Foydalanuvchi tilini olish
    const status_name_uz = statuses[0];
    const status_name_ru = statuses[1];
    // So'rovni yangilash uchun SQL so'rovini yozish
    const updateStatusQuery = `
      UPDATE requests 
      SET status_uz = $1, status_ru = $2 
      WHERE id = $3 
      RETURNING *;
    `;
    const updateValues = [status_name_uz, status_name_ru, requestId];
    const updateRes = await client.query(updateStatusQuery, updateValues);
    const updatedRequest = updateRes.rows[0];

    if (updatedRequest) {
      const usersQuery = `SELECT first_name, last_name, phone_number FROM users WHERE chat_id = $1;`;
      const userInfos = await client.query(usersQuery, [
        updatedRequest.user_chat_id,
      ]);
      const user = userInfos.rows[0];

      const reqStatus =
        language === "uz" ? updatedRequest.status_uz : updatedRequest.status_ru;

      // Tilga mos xabar matni
      const message =
        language === "uz"
          ? `
          ID: ${requestId}
          ${messagesUz[7]} ${updatedRequest.type}
          ${messagesUz[5]} ${user.first_name} ${user.last_name}
          ${messagesUz[6]} ${user.phone_number}
          ${messagesUz[0]} ${updatedRequest.request_text}
          ${messagesUz[8]} ${getFormattedDate(updatedRequest.date)}
          ${messagesUz[1]} ${reqStatus}
        `
          : `
          ID: ${requestId}
          ${messagesRu[7]} ${updatedRequest.type}
          ${messagesRu[5]} ${user.first_name} ${user.last_name}
          ${messagesRu[6]} ${user.phone_number}
          ${messagesRu[0]} ${updatedRequest.request_text}
          ${messagesRu[8]} ${getFormattedDate(updatedRequest.date)}
          ${messagesRu[1]} ${reqStatus}
        `;

      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: language === "uz" ? "Тугаллаш" : "Завершить",
                callback_data: `complete_${updatedRequest.id}`,
              },
              {
                text: language === "uz" ? "Жавоб ёзиш" : "Ответить",
                callback_data: `reply_${updatedRequest.id}`,
              },
            ],
          ],
        },
      });

      // Foydalanuvchiga murojaat haqida xabar yuborish
      await ctx.telegram.sendMessage(
        updatedRequest.user_chat_id,
        language === "uz"
          ? `Сизнинг қуйидаги мурожаатингиз кўриб чиқилмоқда:\nID: ${updatedRequest.id}\n${messagesUz[0]} ${updatedRequest.request_text}\n${messagesUz[1]} ${reqStatus}`
          : `Ваше обращение рассматривается:\nID: ${updatedRequest.id}\n${messagesRu[0]} ${updatedRequest.request_text}\n${messagesRu[1]} ${reqStatus}`
      );
    } else {
      await ctx.reply(
        language === "uz" ? "Мурожаат топилмади." : "Запрос не найден."
      );
    }
  } catch (err) {
    console.error("Murojaatni olishda xatolik:", err);
    await ctx.reply(language === "uz" ? messagesUz.error : messagesRu.error);
  }
};

// calbacklarni tinglash-------------------------------------------------------------------------------------------------------------
bot.on("callback_query", async (ctx) => {
  const callbackData = ctx.callbackQuery.data;

  if (callbackData === "uz" || callbackData === "ru") {
    await changeLanguageCommand(ctx); // Tilni tanlash
  } else if (callbackData.startsWith("reply_")) {
    const requestId = callbackData.split("_")[1];
    const language = getLanguage(ctx);
    await handleReplyRequest(ctx, requestId, language);
  } else if (callbackData.startsWith("complete_")) {
    const requestId = callbackData.split("_")[1];
    const language = getLanguage(ctx);
    await handleCompleteRequest(ctx, requestId, language);
  } else if (callbackData.startsWith("view_")) {
    // `view_` uchun ham tekshiruv qo'shildi
    const requestId = callbackData.split("_")[1];
    await handleRequestView(ctx, requestId);
  } else {
    await ctx.answerCbQuery(
      language === "uz"
        ? "Kechirasiz, bu savolga javob topilmadi."
        : "Извините, ответ на этот вопрос не найден."
    );
  }
});

// javob yozishni so`rash------------------------------------------------------------------------------------------------------------
const handleReplyRequest = async (ctx, requestId, language) => {
  await ctx.answerCbQuery(
    language === "uz" ? "Илтимос, жавоб ёзинг:" : "Пожалуйста, напишите ответ:"
  );
  ctx.session.replyToRequestId = requestId;
  await ctx.reply(language === "uz" ? "Жавоб ёзинг:" : "Напишите ответ:");
};

// requestni tugallash---------------------------------------------------------------------------------------------------------------
const handleCompleteRequest = async (ctx, requestId, language) => {
  try {
    // adminni aniqlash
    const query = `SELECT * FROM users WHERE chat_id = $1;`;
    const values = [ctx.chat.id];
    const res = await client.query(query, values);
    const admin = res.rows[0];

    // murojaatni topish
    const updateStatusQuery = `UPDATE requests SET status_uz = 'Xal qilindi', status_ru = 'Решено' WHERE id = $1 RETURNING *;`;
    const updateRes = await client.query(updateStatusQuery, [requestId]);
    const updatedRequest = updateRes.rows[0];

    if (updatedRequest) {
      // userni aniqlash
      const usersQuery = `SELECT first_name, last_name, phone_number FROM users WHERE chat_id = $1;`;
      const userInfos = await client.query(usersQuery, [
        updatedRequest.user_chat_id,
      ]);
      const user = userInfos.rows[0];
      const groupChatId = "-4541484236";

      await ctx.answerCbQuery(
        language === "uz" ? "Мурожаат тугалланди!" : "Запрос завершен!"
      );
      await ctx.editMessageText(
        language === "uz"
          ? `Мурожаат статуси: Хал қилинди`
          : `Статус обращения: Решено`
      );

      await ctx.telegram.sendMessage(
        updatedRequest.user_chat_id,
        language === "uz"
          ? `Сизнинг қуйидаги мурожаатингиз ҳолати ${admin.tg_name} томонидан хал қилинди:\nID: ${updatedRequest.id}\nМурожаат: ${updatedRequest.request_text}`
          : `Ваше следующее обращение было обработано ${admin.tg_name}:\nID: ${updatedRequest.id}\nОбращение: ${updatedRequest.request_text}`
      );

      // guruhga yuboriladigan matn
      const message = `
  ID: ${requestId}
  ${messagesUz[7]} ${updatedRequest.type}
  ${messagesUz[5]} ${user.first_name} ${user.last_name}
  ${messagesUz[6]} ${user.phone_number}
  ${messagesUz[0]} ${updatedRequest.request_text}
  Юборилган вақт: ${getFormattedDate(updatedRequest.date)}
  Хал қилинган вақт: ${getFormattedDate()}
  Админ:${admin.tg_name}
      `;

      // gruhga admin javobini yuborish
      await ctx.telegram.sendMessage(groupChatId, message);
    } else {
      await ctx.answerCbQuery(
        language === "uz" ? "Мурожаат топилмади." : "Запрос не найден."
      );
    }
  } catch (err) {
    console.error("Tugallashda xatolik:", err);
    await ctx.answerCbQuery(
      language === "uz" ? messagesUz.error : messagesRu.error
    );
  }
};

// admin javobi
const handleAdminReply = async (ctx, requestId, replyText, language) => {
  try {
    const query = `SELECT * FROM users WHERE chat_id = $1;`;
    const values = [ctx.chat.id];
    const res = await client.query(query, values);
    const admin = res.rows[0];
    const requestQuery = `SELECT * FROM requests WHERE id = $1`;
    const requestRes = await client.query(requestQuery, [requestId]);

    if (requestRes.rows.length > 0) {
      const request = requestRes.rows[0];
      const usersQuery = `SELECT first_name, last_name, phone_number FROM users WHERE chat_id = $1;`;
      const userInfos = await client.query(usersQuery, [request.user_chat_id]);
      const user = userInfos.rows[0];
      const groupChatId = "-4541484236";
      const message = `
  ID: ${requestId}
  ${messagesUz[7]} ${request.type}
  ${messagesUz[5]} ${user.first_name} ${user.last_name}
  ${messagesUz[6]} ${user.phone_number}
  ${messagesUz[0]} ${request.request_text}
  Юборилган вақт: ${getFormattedDate(request.date)}
  Жавоб берилган вақт: ${getFormattedDate()}
  Админ:${admin.tg_name}
  Админ жавоби: ${replyText}
      `;

      // gruhga admin javobini yuborish
      await ctx.telegram.sendMessage(groupChatId, message);

      // userga admin javobini yuborish
      await ctx.telegram.sendMessage(
        request.user_chat_id,
        language === "uz"
          ? `Админ жавоби: ${replyText} \nАдмин:${admin.tg_name}\n${
              messagesUz[8]
            } ${getFormattedDate()}`
          : `Ответ администратора: ${replyText} \nАдмин:${admin.tg_name}\n${
              messagesRu[8]
            } ${getFormattedDate()}`
      );
      // baseni update qilish
      await client.query(
        `UPDATE requests SET status_uz = 'Жавоб берилди', status_ru = 'Ответил' WHERE id = $1`,
        [requestId]
      );

      ctx.session.replyToRequestId = null;
      await ctx.reply(
        language === "uz" ? "Жавоб юборилди." : "Ответ отправлен.",
        mainMenu(language)
      );
    } else {
      await ctx.reply(
        language === "uz" ? "Мурожаат топилмади." : "Запрос не найден."
      );
    }
  } catch (err) {
    console.error("Xatolik javob yuborishda:", err);
    await ctx.reply(language === "uz" ? messagesUz.error : messagesRu.error);
  }
};

// main menu-----------------------------------------------------------------------------------------------
const handleMainMenu = async (ctx, isRegistered, language) => {
  let options;
  if (isRegistered) {
    options = {
      reply_markup: {
        keyboard: [
          [
            {
              text:
                language === "uz"
                  ? messagesUz.sendQuestion
                  : messagesRu.sendQuestion,
            },
            { text: language === "uz" ? messagesUz.faq : messagesRu.faq },
          ],
          [
            {
              text:
                language === "uz"
                  ? messagesUz.allQuestion
                  : messagesRu.allQuestion,
            },
            {
              text:
                language === "uz"
                  ? messagesUz.checkQuestion
                  : messagesRu.checkQuestion,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    ctx.reply(
      language === "uz" ? messagesUz.service : messagesRu.service,
      options
    );
  } else {
    options = {
      reply_markup: {
        keyboard: [
          [
            {
              text:
                language === "uz" ? messagesUz.register : messagesRu.register,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    ctx.reply(
      language === "uz" ? messagesUz.welcome : messagesRu.welcome,
      options
    );
  }
};

// languagega oid -----------------------------------------------------------------------------------------
// /lang komandasini qo'shish
const langCommand = (ctx) => {
  const userId = ctx.from.id;
  const language = userLanguages[userId] || "uz"; // Foydalanuvchining tilini olish (default o'zbek)
  ctx.reply(
    language === "uz" ? messagesUz.changeLanguage : messagesRu.changeLanguage,
    languageKeyboard
  );
};
// Tilni o'zgartirish uchun komanda
const changeLanguageCommand = async (ctx) => {
  const userId = ctx.from.id;
  const selectedLanguage = ctx.callbackQuery.data; // 'uz' yoki 'ru'

  // Tilni saqlash
  userLanguages[userId] = selectedLanguage;

  if (selectedLanguage === "uz") {
    ctx.reply(messagesUz.changeLanguage, languageKeyboard);
  } else {
    ctx.reply(messagesRu.changeLanguage, languageKeyboard);
  }

  // Til o'zgarganidan keyin asosiy menyuni ko'rsatish
  const isRegistered = await checkUserRegistered(ctx.chat.id);
  await handleMainMenu(ctx, isRegistered, selectedLanguage);
};

// tanlangan savolga javob topish--------------------------------------------------------------------------
const handleFAQ = async (ctx, selectedQuestion) => {
  const language = getLanguage(ctx); // Get the user's selected language

  if (
    selectedQuestion !==
    (language === "uz" ? messagesUz.allQuestion : messagesRu.allQuestion)
  ) {
    try {
      // Fetch the answer based on the selected question and language
      const res = await client.query(
        "SELECT answer FROM faq WHERE question = $1 AND lang = $2",
        [selectedQuestion, language]
      );
      const faq = res.rows[0];

      if (faq) {
        await ctx.reply(
          `${language === "uz" ? messagesUz.answer : messagesRu.answer} ${
            faq.answer
          }`,
          mainMenu(language)
        );
      } else if (
        selectedQuestion !==
        (language === "uz" ? messagesUz.back : messagesRu.back)
      ) {
        await ctx.reply(
          language === "uz" ? messagesUz.faqError : messagesRu.faqError,
          mainMenu(language)
        );
      } else {
        await ctx.reply(
          language === "uz" ? messagesUz.service : messagesRu.service,
          mainMenu(language)
        );
      }
    } catch (err) {
      await ctx.reply(
        language === "uz" ? messagesUz.error : messagesRu.error,
        mainMenu(language)
      );
    }
  } else {
    await murojaatlarniKorish(ctx, language);
  }
};

// --------------------------------------------------------------------------------------------------------
bot.on("text", async (ctx) => {
  const language = getLanguage(ctx);
  var textfaq = ctx.message.text;
  if (textfaq == "/lang") {
    return langCommand(ctx);
  }
  if (textfaq == "/start") {
    return startCommand(ctx);
  }
  const args = ctx.message.text.split(" ");
  if (args[1] && args[1].startsWith("view_")) {
    const requestId = args[1].split("_")[1];
    return await handleRequestView(ctx, requestId);
  }
  if (ctx.session.replyToRequestId) {
    const replyText = ctx.message.text;
    const requestId = ctx.session.replyToRequestId;

    await handleAdminReply(ctx, requestId, replyText, language);
  } else if (
    textfaq === (language === "uz" ? messagesUz.faq : messagesRu.faq)
  ) {
    await faqMenu(ctx, language);
  } else {
    const selectedQuestion = ctx.message.text;
    await handleFAQ(ctx, selectedQuestion, language);
  }
});

// --------------------------------------------------------------------------------------------------------
// "Orqaga" tugmasi bosilganda asosiy menyuga qaytish
bot.hears([messagesUz.back, messagesRu.back], (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(
    language === "uz" ? messagesUz.service : messagesRu.service,
    mainMenu(language)
  );
});

export const userLanguages = {}; // Foydalanuvchining tillari

// Botni eksport qilish
export { bot, startCommand, changeLanguageCommand, langCommand };
