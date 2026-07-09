import { NextResponse } from "next/server";
import { google } from "googleapis";
import { explainSheetsError } from "@/lib/sheets";

export const dynamic = "force-dynamic";

// Step-by-step diagnostic for the Google Sheets connection.
// Visit /api/health to see exactly which part of the pipeline is broken.
export async function GET() {
  const checks: { name: string; ok: boolean; detail: string }[] = [];

  const REQUIRED = ["GS_SPREADSHEET_ID", "GS_CLIENT_ID", "GS_CLIENT_SECRET", "GS_REFRESH_TOKEN"];
  const missing = REQUIRED.filter((k) => !process.env[k]);
  checks.push({
    name: "env",
    ok: missing.length === 0,
    detail: missing.length === 0 ? "كل المتغيرات موجودة" : `متغيرات ناقصة: ${missing.join(", ")}`,
  });

  if (missing.length === 0) {
    const auth = new google.auth.OAuth2(process.env.GS_CLIENT_ID!, process.env.GS_CLIENT_SECRET!);
    auth.setCredentials({ refresh_token: process.env.GS_REFRESH_TOKEN! });

    try {
      const token = await auth.getAccessToken();
      checks.push({
        name: "google-auth",
        ok: !!token.token,
        detail: token.token ? "تسجيل الدخول إلى Google يعمل (تم تجديد الـ Access Token)" : "لم يتم الحصول على Access Token",
      });
    } catch (err) {
      checks.push({ name: "google-auth", ok: false, detail: explainSheetsError(err) });
    }

    try {
      const sheets = google.sheets({ version: "v4", auth });
      const meta = await sheets.spreadsheets.get({ spreadsheetId: process.env.GS_SPREADSHEET_ID! });
      const titles = meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) ?? [];
      checks.push({
        name: "spreadsheet",
        ok: true,
        detail: `الوصول للملف "${meta.data.properties?.title}" يعمل — الشيتات: ${titles.join(", ")}`,
      });
    } catch (err) {
      checks.push({ name: "spreadsheet", ok: false, detail: explainSheetsError(err) });
    }
  }

  const ok = checks.every((c) => c.ok);
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 500 });
}
