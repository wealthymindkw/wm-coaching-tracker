import { google } from "googleapis";
import type { StepRow } from "./types";

const SPREADSHEET_ID = process.env.GS_SPREADSHEET_ID!;
const EXCLUDED_SHEETS = ["Weekly_Reports"];

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GS_CLIENT_ID!,
    process.env.GS_CLIENT_SECRET!,
  );
  auth.setCredentials({ refresh_token: process.env.GS_REFRESH_TOKEN! });
  return auth;
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
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
    // Sheet is newly created — write headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A1:H1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["Date", "Time", "UserID", "Username", "FirstName", "LastName", "Step", "Results"]],
      },
    });
  } catch {
    // Sheet already exists — do nothing, preserve existing data
  }
}

export async function addStep(
  sheetName: string,
  data: Omit<StepRow, "rowIndex">,
): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
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
