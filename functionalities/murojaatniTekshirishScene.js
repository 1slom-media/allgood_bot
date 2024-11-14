import { Scenes } from "telegraf";
import client from "../db/db.js";
import mainMenu from "./mainMenu.js";
import { messagesRu, messagesUz } from "../utils/language.js";
import { userLanguages } from "../bot.js";
const { WizardScene } = Scenes;

const getLanguage = (ctx) => {
  const userId = ctx.from.id;
  return userLanguages[userId] || "uz";
};

// 1. Foydalanuvchidan murojaat ID raqamini so'rash
const askMurojaatId = (ctx) => {
  const language = getLanguage(ctx);
  ctx.reply(language === "uz" ? messagesUz.askId : messagesRu.askId);
  return ctx.wizard.next();
};

// 2. ID bo‘yicha murojaatni qidirish va natijani ko‘rsatish
const showMurojaatById = async (ctx) => {
  const murojaatId = ctx.message.text;
  const userId = ctx.from.id;
  const language = getLanguage(ctx);

  try {
    // Bazadan murojaatni qidirish
    const res = await client.query(
      "SELECT * FROM requests WHERE id = $1 AND user_chat_id = $2",
      [murojaatId, userId]
    );

    // Murojaatni ko'rsatish yoki xatolikni bildirish
    if (res.rows.length > 0) {
      const murojaat = res.rows[0];
      const statusText =
        language === "uz" ? murojaat.status_uz : murojaat.status_ru;
      await ctx.reply(
        `ID: ${murojaat.id}\nMurojaat: ${murojaat.request_text}\nStatus: ${statusText}`,
        mainMenu(language)
      );
    } else {
      await ctx.reply(
        language === "uz" ? messagesUz.notFound : messagesRu.notFound,
        mainMenu(language)
      );
    }
  } catch (err) {
    console.error("Murojaatni olishda xatolik:", err);
    ctx.reply(
      language === "uz" ? messagesUz.error : messagesRu.error,
      mainMenu(language)
    );
  }

  return ctx.scene.leave(); // Sahnadan chiqish
};

// WizardScene yaratish
const murojaatniTekshirishScene = new WizardScene(
  "murojaatni_tekshirish_scene",
  askMurojaatId,
  showMurojaatById
);

export default murojaatniTekshirishScene;
