import { messagesRu, messagesUz } from "../utils/language.js";

const requestType = (language) => {
  const buttons = [
    [
      {
        text:
          language === "uz" ? messagesUz.technical : messagesRu.technical,
      },
      { text: language === "uz" ? messagesUz.business : messagesRu.business },
    ],
    [
      {
        text:
          language === "uz" ? messagesUz.other : messagesRu.other,
      }
    ],
  ];

  return {
    reply_markup: {
      keyboard: buttons,
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
};

export default requestType;
