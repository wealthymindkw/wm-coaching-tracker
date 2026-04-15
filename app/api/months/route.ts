import { NextResponse } from "next/server";
import { getMonths } from "@/lib/sheets";

export async function GET() {
  try {
    const months = await getMonths();
    return NextResponse.json({ months });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
