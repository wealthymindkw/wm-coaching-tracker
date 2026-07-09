import { NextRequest, NextResponse } from "next/server";
import { getSheetData, explainSheetsError } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sheet = req.nextUrl.searchParams.get("sheet");
  if (!sheet) return NextResponse.json({ error: "Missing sheet param" }, { status: 400 });

  try {
    const rows = await getSheetData(sheet);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: explainSheetsError(err) }, { status: 500 });
  }
}
