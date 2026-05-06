import { NextResponse } from "next/server";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GS_SPREADSHEET_ID!;
const EXCLUDED = ["Weekly_Reports"];

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GS_CLIENT_ID!,
    process.env.GS_CLIENT_SECRET!,
  );
  auth.setCredentials({ refresh_token: process.env.GS_REFRESH_TOKEN! });
  return auth;
}

interface Person {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
}

export async function POST(req: Request) {
  const { sheet } = await req.json();
  if (!sheet) return NextResponse.json({ error: "sheet required" }, { status: 400 });

  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  // Fix headers first (ensure spaces match what Telegram bot expects)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheet}'!A1:H1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Date", "Time", "User ID", "Username", "First Name", "Last Name", "Step", "Results"]],
    },
  });

  // Build name lookup from all other sheets
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const otherSheets = meta.data.sheets
    ?.map((s) => s.properties?.title ?? "")
    .filter((n) => n && !EXCLUDED.includes(n) && n !== sheet) ?? [];

  const byUsername = new Map<string, Person>();
  const byFirstName = new Map<string, Person>();

  for (const name of otherSheets) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${name}'!A:H`,
    });
    for (let i = 1; i < (res.data.values ?? []).length; i++) {
      const row = res.data.values![i];
      if (!row) continue;
      const p: Person = { userId: row[2] ?? "", username: row[3] ?? "", firstName: row[4] ?? "", lastName: row[5] ?? "" };
      if (p.username && p.firstName) byUsername.set(p.username.toLowerCase(), p);
      if (p.firstName && p.userId) byFirstName.set(p.firstName.toLowerCase(), p);
    }
  }

  // Read target sheet rows
  const targetRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheet}'!A:H`,
  });
  const rows = targetRes.data.values ?? [];

  // Also supplement lookup from rows in target sheet that already have complete data
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const p: Person = { userId: row[2] ?? "", username: row[3] ?? "", firstName: row[4] ?? "", lastName: row[5] ?? "" };
    if (p.username && p.firstName && !byUsername.has(p.username.toLowerCase())) {
      byUsername.set(p.username.toLowerCase(), p);
    }
    if (p.firstName && p.userId && !byFirstName.has(p.firstName.toLowerCase())) {
      byFirstName.set(p.firstName.toLowerCase(), p);
    }
  }

  // Build batch updates for rows with missing identity fields
  const updates: { range: string; values: string[][] }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const userId = row[2] ?? "";
    const username = row[3] ?? "";
    const firstName = row[4] ?? "";
    const rowNum = i + 1;

    // Bot entry: has username but no firstName (headers were wrong when written)
    if (!firstName && username) {
      const p = byUsername.get(username.toLowerCase());
      if (p) {
        updates.push({
          range: `'${sheet}'!C${rowNum}:F${rowNum}`,
          values: [[p.userId, p.username, p.firstName, p.lastName]],
        });
        continue;
      }
    }

    // Manual restore entry: has firstName but no userId
    if (!userId && firstName) {
      const p = byFirstName.get(firstName.toLowerCase());
      if (p) {
        updates.push({
          range: `'${sheet}'!C${rowNum}:F${rowNum}`,
          values: [[p.userId, p.username, p.firstName, p.lastName]],
        });
      }
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates,
      },
    });
  }

  return NextResponse.json({ ok: true, fixed: updates.length, headersFixed: true });
}
