import { GoogleSpreadsheet } from "google-spreadsheet";
import dotenv from "dotenv";
import getFormattedDate from "../utils/formatedDate.js";
dotenv.config();

const doc = new GoogleSpreadsheet(
  "11zRbvCTbnxQ1iyDOWO1sgXkjP8nCdDqKoE11XQvL-pM"
);

async function accessGoogleSheet() {
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
  await doc.loadInfo(); // Yozuv va sahifa ma'lumotlarini yuklaydi
}

// Function to update Google Sheets with new status
async function updateGoogleSheet(requestId, status_uz,status_ru, userInfo, requestText,type) {
  await accessGoogleSheet();
  const sheet = doc.sheetsByIndex[0];

  const rows = await sheet.getRows();
  const existingRow = rows.find((row) => row.ID === requestId.toString());

  if (existingRow) {
    // Update row if requestId exists
    existingRow.Timestamp = new Date().toISOString();
    await existingRow.save();
  } else {
    // Add new row if requestId is new
    await sheet.addRow({
      ID: requestId,
      Name: `${userInfo.first_name} ${userInfo.last_name}`,
      Phone: userInfo.phone_number,
      Request: requestText,
      Status_Uz: status_uz,
      Status_Ru: status_ru,
      Type:type,
      Timestamp: getFormattedDate(),
    });
  }
}

export default updateGoogleSheet;
