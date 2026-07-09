import { NextRequest, NextResponse } from "next/server";
import { deleteStep, explainSheetsError } from "@/lib/sheets";

export async function DELETE(req: NextRequest) {
  try {
    const { sheet, rowIndex } = await req.json();
    if (!sheet || !rowIndex) return NextResponse.json({ error: "Missing params" }, { status: 400 });
    await deleteStep(sheet, rowIndex);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: explainSheetsError(err) }, { status: 500 });
  }
}
