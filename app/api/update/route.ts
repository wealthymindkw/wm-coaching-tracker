import { NextRequest, NextResponse } from "next/server";
import { updateStep, explainSheetsError } from "@/lib/sheets";

export async function PUT(req: NextRequest) {
  try {
    const { sheet, rowIndex, step, results } = await req.json();
    if (!sheet || !rowIndex) return NextResponse.json({ error: "Missing params" }, { status: 400 });
    await updateStep(sheet, rowIndex, step ?? "", results ?? "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: explainSheetsError(err) }, { status: 500 });
  }
}
