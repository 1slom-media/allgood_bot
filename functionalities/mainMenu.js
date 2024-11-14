import { messagesRu, messagesUz } from "../utils/language.js";

const mainMenu = (language) => {
  const buttons = [
    [
      {
        text:
          language === "uz" ? messagesUz.sendQuestion : messagesRu.sendQuestion,
      },
      { text: language === "uz" ? messagesUz.faq : messagesRu.faq },
    ],
    [
      {
        text:
          language === "uz" ? messagesUz.allQuestion : messagesRu.allQuestion,
      },
      {
        text:
          language === "uz"
            ? messagesUz.checkQuestion
            : messagesRu.checkQuestion,
      },
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

export default mainMenu;
