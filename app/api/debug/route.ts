import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getMonths, explainSheetsError } from "@/lib/sheets";

export const dynamic = "force-dynamic";

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

// Inspect the first rows of the two most recent month sheets (or ?sheet=...).
export async function GET(req: NextRequest) {
  try {
    const requested = req.nextUrl.searchParams.get("sheet");
    const targets = requested ? [requested] : (await getMonths()).slice(0, 2);

    const results = await Promise.allSettled(targets.map(getRawRows));
    const out: Record<string, unknown> = {};
    targets.forEach((name, i) => {
      const r = results[i];
      out[name] = r.status === "fulfilled"
        ? r.value.map((row, j) => ({ row: j + 1, data: row }))
        : { error: explainSheetsError(r.reason) };
    });

    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: explainSheetsError(err) }, { status: 500 });
  }
}
