import client from "../db/db.js";
import { messagesRu, messagesUz } from "../utils/language.js";
import mainMenu from "./mainMenu.js";

let murojaatlarniKorish = async (ctx, language) => {
  try {
    const userId = ctx.from.id;

    // Foydalanuvchining barcha murojaatlarini olish
    const res = await client.query(
      "SELECT id, request_text, status_uz, status_ru FROM requests WHERE user_chat_id = $1",
      [userId]
    );

    // Agar murojaatlar bo'lsa, foydalanuvchiga ko'rsatish
    if (res.rows.length > 0) {
      const messages = res.rows
        .map((murojaat) =>
          `ID: ${murojaat.id}\n${
            language === "uz"
              ? `${messagesUz[0]} ${murojaat.request_text}\n${messagesUz[1]} ${murojaat.status_uz}`
              : `${messagesRu[0]} ${murojaat.request_text}\n${messagesRu[1]} ${murojaat.status_ru}`
          }\n---`
        )
        .join("\n\n");

      await ctx.reply(
        language === "uz"
          ? `${messagesUz[2]}:\n\n${messages}`
          : `${messagesRu[2]}:\n\n${messages}`,
        mainMenu(language)
      );
    } else {
      // Agar foydalanuvchi hech qanday murojaat qilmagan bo'lsa
      await ctx.reply(
        language === "uz" ? `${messagesUz[3]}` : `${messagesRu[3]}`,
        mainMenu(language)
      );
    }
  } catch (err) {
    console.error("Murojaatlarni olishda xatolik:", err);
    ctx.reply(
      language === "uz" ? messagesUz.error : messagesRu.error,
      mainMenu(language)
    );
  }
};


export default murojaatlarniKorish;
