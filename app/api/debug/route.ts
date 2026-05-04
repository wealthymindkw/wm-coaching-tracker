import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GS_CLIENT_ID!,
    process.env.GS_CLIENT_SECRET!,
  );
  auth.setCredentials({ refresh_token: process.env.GS_REFRESH_TOKEN! });
  return auth;
}

export async function GET(req: NextRequest) {
  const sheet = req.nextUrl.searchParams.get("sheet") ?? "April 2026";
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuth() });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GS_SPREADSHEET_ID!,
      range: `'${sheet}'!A:J`,
    });
    const rows = res.data.values ?? [];
    return NextResponse.json({
      sheet,
      totalRows: rows.length,
      rows: rows.slice(0, 10).map((row, i) => ({ rowNum: i + 1, cols: row })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
