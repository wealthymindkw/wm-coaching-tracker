import { google } from "googleapis";
import type { StepRow } from "./types";

const SPREADSHEET_ID = process.env.GS_SPREADSHEET_ID!;
const EXCLUDED_SHEETS = ["Weekly_Reports"];

export const HEADER_ROW = ["Date", "Time", "User ID", "Username", "First Name", "Last Name", "Step", "Results"];

const REQUIRED_ENV = ["GS_SPREADSHEET_ID", "GS_CLIENT_ID", "GS_CLIENT_SECRET", "GS_REFRESH_TOKEN"] as const;

function getAuth() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")} — ` +
      `أضف المتغيرات الناقصة في إعدادات الاستضافة (Vercel → Settings → Environment Variables) ثم أعد النشر.`,
    );
  }
  const auth = new google.auth.OAuth2(
    process.env.GS_CLIENT_ID!,
    process.env.GS_CLIENT_SECRET!,
  );
  auth.setCredentials({ refresh_token: process.env.GS_REFRESH_TOKEN! });
  return auth;
}

// Turn cryptic Google API failures into actionable messages for the dashboard.
export function explainSheetsError(err: unknown): string {
  const e = err as { message?: string; response?: { data?: { error?: string; error_description?: string } } };
  const raw = [e?.message, e?.response?.data?.error, e?.response?.data?.error_description]
    .filter(Boolean)
    .join(" | ") || String(err);

  if (/invalid_grant/i.test(raw)) {
    return "انتهى ربط حساب Google (invalid_grant): الـ GS_REFRESH_TOKEN منتهي الصلاحية أو ملغي. " +
      "إذا كان تطبيق OAuth في وضع Testing فالتوكن ينتهي كل 7 أيام — انقل التطبيق إلى In production أو أعد توليد Refresh Token وحدّثه في إعدادات الاستضافة ثم أعد النشر.";
  }
  if (/invalid_client/i.test(raw)) {
    return "بيانات OAuth غير صحيحة (invalid_client): تأكد من GS_CLIENT_ID و GS_CLIENT_SECRET في إعدادات الاستضافة.";
  }
  if (/Unable to parse range/i.test(raw)) {
    return `الشيت المطلوب غير موجود في ملف Google Sheets. (${raw})`;
  }
  if (/PERMISSION_DENIED|The caller does not have permission/i.test(raw)) {
    return "لا توجد صلاحية على ملف Google Sheets: تأكد أن الحساب المربوط يملك صلاحية تعديل على الملف وأن Google Sheets API مفعّلة في المشروع.";
  }
  if (/RESOURCE_EXHAUSTED|Quota exceeded|429/i.test(raw)) {
    return "تم تجاوز حد طلبات Google Sheets API مؤقتًا — انتظر دقيقة ثم حدّث الصفحة.";
  }
  if (/Requested entity was not found/i.test(raw)) {
    return "ملف Google Sheets غير موجود: تأكد من قيمة GS_SPREADSHEET_ID.";
  }
  return raw;
}

export async function getMonths(): Promise<string[]> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return (
    res.data.sheets
      ?.map((s) => s.properties?.title ?? "")
      .filter((n) => n && !EXCLUDED_SHEETS.includes(n))
      .reverse() ?? []
  );
}

export async function getSheetData(sheetName: string): Promise<StepRow[]> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:H`,
  });

  const rows = res.data.values ?? [];
  const result: StepRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[6]) continue; // skip rows with no step text
    result.push({
      rowIndex: i + 1,
      date:      row[0] ?? "",
      time:      row[1] ?? "",
      userId:    row[2] ?? "",
      username:  row[3] ?? "",
      firstName: row[4] ?? "",
      lastName:  row[5] ?? "",
      step:      row[6] ?? "",
      results:   row[7] ?? "",
    });
  }
  return result;
}

export async function updateStep(
  sheetName: string,
  rowIndex: number,
  step: string,
  results: string,
): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!G${rowIndex}:H${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[step, results]] },
  });
}

export async function deleteStep(sheetName: string, rowIndex: number): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === sheetName,
  );
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined) throw new Error("Sheet not found");

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}

export async function createMonthSheet(sheetName: string): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  let created = false;
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
    created = true;
  } catch (err) {
    // Only "already exists" is expected here — anything else (auth expired,
    // no permission, quota) must surface instead of being swallowed silently.
    if (!/already exists/i.test(String((err as Error)?.message ?? err))) throw err;
  }

  if (created) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A1:H1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [HEADER_ROW] },
    });
    return;
  }

  // Sheet already exists: repair the header row without touching data.
  // The dashboard and the Telegram bot both assume row 1 is a header, so a
  // sheet whose first row is data would hide/misread entries.
  const firstRowRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A1:H1`,
  });
  const firstRow = firstRowRes.data.values?.[0] ?? [];

  if (firstRow.length === 0) {
    // Completely empty sheet — just write the header.
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A1:H1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [HEADER_ROW] },
    });
  } else if ((firstRow[0] ?? "").toString().trim().toLowerCase() !== "date") {
    // Row 1 holds data (sheet was created without a header) — insert a new
    // row on top and write the header there so no data is overwritten.
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetId = meta.data.sheets?.find((s) => s.properties?.title === sheetName)?.properties?.sheetId;
    if (sheetId === undefined || sheetId === null) throw new Error(`Sheet not found: ${sheetName}`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          insertDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
            inheritFromBefore: false,
          },
        }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A1:H1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [HEADER_ROW] },
    });
  }
}

export async function addStep(
  sheetName: string,
  data: Omit<StepRow, "rowIndex">,
): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  // Make sure the month sheet exists (with a header row) before appending,
  // so recording never fails just because the month rolled over.
  await createMonthSheet(sheetName);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:H`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[
        data.date, data.time, data.userId, data.username,
        data.firstName, data.lastName, data.step, data.results,
      ]],
    },
  });
}
