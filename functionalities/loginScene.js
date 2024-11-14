import { Scenes } from "telegraf";
import mainMenu from "./mainMenu.js";
import { userLanguages } from "../bot.js";
import client from "../db/db.js";
import { messagesRu, messagesUz } from "../utils/language.js";
const { WizardScene } = Scenes;

const getLanguage = (ctx) => {
  const userId = ctx.from.id;
  return userLanguages[userId] || "uz";
};

// 1. Foydalanuvchidan ismni olish
const askFirstName = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz.username : messagesRu.username);
  return ctx.wizard.next();
};

// 2. Foydalanuvchidan familiyani olish
const askLastName = (ctx) => {
  ctx.wizard.state.first_name = ctx.message.text;
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz.surname : messagesRu.surname);
  return ctx.wizard.next();
};

// 3. Foydalanuvchidan telefon raqamni olish
const askPhoneNumber = (ctx) => {
  ctx.wizard.state.last_name = ctx.message.text;
  const language = getLanguage(ctx);
  const options = {
    reply_markup: {
      keyboard: [
        [
          {
            text: language === "uz" ? messagesUz.phone : messagesRu.phone,
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
  ctx.reply(
    language === "uz" ? messagesUz.phoneApprove : messagesRu.phoneApprove,
    options
  );

  return ctx.wizard.next();
};

// 4. Ma'lumotlarni saqlash
const saveUserInfo = async (ctx) => {
  const phone_number = ctx.message.contact.phone_number;
  const { first_name, last_name } = ctx.wizard.state;
  const chat_id = ctx.chat.id; // chat_id ni olish

  // Get the language from the context
  const language = getLanguage(ctx);

  // Ma'lumotlarni bazaga yozish
  const query = `
        INSERT INTO users (first_name, last_name, phone_number, chat_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
  const values = [first_name, last_name, phone_number, chat_id]; // chat_id ni qo'shish

  try {
    const res = await client.query(query, values);
    ctx.reply(
      language === "uz"
        ? messagesUz.saveUser
        : messagesRu.saveUser,
      mainMenu(language)
    );
  } catch (err) {
    console.error("Bazaga yozishda xatolik:", err);
    ctx.reply(
      language === "uz"
        ? messagesUz.error
        : messagesRu.error
    );
  }

  return ctx.scene.leave();
};


const userInfoWizard = new WizardScene(
  "user_info_wizard",
  askFirstName,
  askLastName,
  askPhoneNumber,
  saveUserInfo
);

export default userInfoWizard;
