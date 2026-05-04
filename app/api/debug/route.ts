import { NextResponse } from "next/server";
import { google } from "googleapis";

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GS_CLIENT_ID!,
    process.env.GS_CLIENT_SECRET!,
  );
  auth.setCredentials({ refresh_token: process.env.GS_REFRESH_TOKEN! });
  return auth;
}

async function getRawRows(sheetName: string) {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GS_SPREADSHEET_ID!,
    range: `'${sheetName}'!A1:J10`,
  });
  return res.data.values ?? [];
}

export async function GET() {
  try {
    const [april, may] = await Promise.allSettled([
      getRawRows("April 2026"),
      getRawRows("May 2026"),
    ]);

    return NextResponse.json({
      "April 2026": april.status === "fulfilled"
        ? april.value.map((row, i) => ({ row: i + 1, data: row }))
        : { error: (april as PromiseRejectedResult).reason?.message },
      "May 2026": may.status === "fulfilled"
        ? may.value.map((row, i) => ({ row: i + 1, data: row }))
        : { error: (may as PromiseRejectedResult).reason?.message },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
