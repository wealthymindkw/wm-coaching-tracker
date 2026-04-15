import { NextRequest, NextResponse } from "next/server";
import { getSheetData } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  const sheet = req.nextUrl.searchParams.get("sheet");
  if (!sheet) return NextResponse.json({ error: "Missing sheet param" }, { status: 400 });

  try {
    const rows = await getSheetData(sheet);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
