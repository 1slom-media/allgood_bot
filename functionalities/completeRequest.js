import client from "../db/db.js";

let completeRequest = async (ctx) => {
  const groupId = "-4541484236";

  const callbackData = ctx.callbackQuery.data;

  if (callbackData.startsWith("complete_")) {
    const requestId = callbackData.split("_")[1];

    try {
      const updateStatusQuery = `UPDATE requests SET status = $1 WHERE id = $2 RETURNING *;`;
      const updateValues = ["solved", requestId];

      const updateRes = await client.query(updateStatusQuery, updateValues);
      const updatedRequest = updateRes.rows[0];

      if (updatedRequest) {
        await ctx.answerCbQuery("Murojaat tugallandi!");
        await ctx.editMessageText(`Murojaat statusi: Xal qilindi`);

        // Foydalanuvchiga xabar yuborish
        await ctx.telegram.sendMessage(
          [updatedRequest.user_chat_id, groupId],
          `Sizning quyidagi murojaatingiz yechildi:
              
              ID: ${updatedRequest.id}
              Murojaat: ${updatedRequest.request_text}
              Status: Xal qilindi`
        );
      } else {
        await ctx.answerCbQuery("Murojaat topilmadi.");
      }
    } catch (err) {
      console.error("Tugallashda xatolik:", err);
      await ctx.answerCbQuery("Xatolik yuz berdi, qayta urinib ko'ring.");
    }
  }
}; 

export default completeRequest;
