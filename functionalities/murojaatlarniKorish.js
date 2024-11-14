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
              ? `Murojaat: ${murojaat.request_text}\nStatus: ${murojaat.status_uz}`
              : `Запрос: ${murojaat.request_text}\nСтатус: ${murojaat.status_ru}`
          }\n---`
        )
        .join("\n\n");

      await ctx.reply(
        language === "uz"
          ? `Sizning barcha murojaatlaringiz:\n\n${messages}`
          : `Ваши все запросы:\n\n${messages}`,
        mainMenu(language)
      );
    } else {
      // Agar foydalanuvchi hech qanday murojaat qilmagan bo'lsa
      await ctx.reply(
        language === "uz" ? "Sizda hech qanday murojaat yo'q." : "У вас нет запросов.",
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
