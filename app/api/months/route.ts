import { NextResponse } from "next/server";
import { getMonths, createMonthSheet, explainSheetsError } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const months = await getMonths();
    return NextResponse.json({ months });
  } catch (err) {
    return NextResponse.json({ error: explainSheetsError(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { month } = await req.json();
    if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });
    await createMonthSheet(month);
    const months = await getMonths();
    return NextResponse.json({ months });
  } catch (err) {
    return NextResponse.json({ error: explainSheetsError(err) }, { status: 500 });
  }
}
