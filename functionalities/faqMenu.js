import client from "../db/db.js";
import { messagesRu, messagesUz } from "../utils/language.js";
import mainMenu from "./mainMenu.js";

const faqMenu = async (ctx, language) => {
  try {
    // Fetch FAQ questions based on the selected language
    const res = await client.query(
      "SELECT id, question FROM faq WHERE lang = $1",
      [language]
    );

    // Generate buttons for each question and add the "Back" button
    const buttons = res.rows.map((faq) => [{ text: faq.question }]);
    buttons.push([{ text: language === "uz" ? messagesUz.back : messagesRu.back }]); // "Back" button

    await ctx.reply(
      language === "uz" ? messagesUz.selectQuestion : messagesRu.selectQuestion,
      {
        reply_markup: {
          keyboard: buttons,
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  } catch (err) {
    console.error("FAQ ni olishda xatolik:", err);
    ctx.reply(
      language === "uz"
        ? messagesUz.error
        : messagesRu.error,
      mainMenu(language)
    );
  }
};

export default faqMenu;
