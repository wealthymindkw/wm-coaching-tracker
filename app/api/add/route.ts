import { NextRequest, NextResponse } from "next/server";
import { addStep } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sheet, date, time, userId, username, firstName, lastName, step, results } = body;
    if (!sheet || !step) return NextResponse.json({ error: "Missing params" }, { status: 400 });
    await addStep(sheet, { date, time, userId: userId ?? "", username: username ?? "", firstName: firstName ?? "", lastName: lastName ?? "", step, results: results ?? "" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
