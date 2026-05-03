import { NextResponse } from "next/server";
import { addStep, getSheetData } from "@/lib/sheets";

const SHEET = "May 2026";

const LOST_ENTRIES = [
  // ── May 1 ──────────────────────────────────────────────────────────
  { date: "01/05/2026", time: "21:32", firstName: "Aysha",    lastName: "",         step: "شاركت في تحدي الل٤ فجرا مع العجيبة زينب 😅\nالتدريب على مهارة البيع + التركيز على جذب عملاء أكثر بتطبيق أفكار جديدة وسهلة ✨" },
  { date: "01/05/2026", time: "12:00", firstName: "عبير",     lastName: "",         step: "مكالمة" },

  // ── May 2 ──────────────────────────────────────────────────────────
  { date: "02/05/2026", time: "00:45", firstName: "Fatma",    lastName: "",         step: "سويت فلو اب" },
  { date: "02/05/2026", time: "00:45", firstName: "Fatma",    lastName: "",         step: "عزمت بروسبكت على اللقاء الحضوري" },
  { date: "02/05/2026", time: "00:45", firstName: "Fatma",    lastName: "",         step: "سويت جلسه متابعه كن منتجا للمنتج" },
  { date: "02/05/2026", time: "17:56", firstName: "جهينة",    lastName: "الشواف",   step: "تواصلت اليوم مع عميلة حضرت معاي جلسة التأمل امس 🙏😍" },
  { date: "02/05/2026", time: "17:56", firstName: "جهينة",    lastName: "الشواف",   step: "بنزل ريلز اليوم" },
  { date: "02/05/2026", time: "18:19", firstName: "جهينة",    lastName: "الشواف",   step: "تواصلت الان مع عدد كبير من ليد السعودية وقاعدة اعزمهم على ورشة جدة والرياض" },
  { date: "02/05/2026", time: "18:03", firstName: "Mohammed", lastName: "Al kaabi", step: "تواصلت مع عملاء" },
  { date: "02/05/2026", time: "18:04", firstName: "Mohammed", lastName: "Al kaabi", step: "نزلت إعلان راحلة فكر وازدد ثراء" },
  { date: "02/05/2026", time: "18:05", firstName: "Mohammed", lastName: "Al kaabi", step: "دخلت عميلين لرحله الكتاب" },
  { date: "02/05/2026", time: "18:04", firstName: "Ghaliah",  lastName: "Saleh",    step: "دعيت عميلين محتملين من السعودية وتم التسجيل الحمد لله نيالهم فينا والله" },
  { date: "02/05/2026", time: "18:27", firstName: "Jenan",    lastName: "Alaswad",  step: "سويت ٢ فلو آب" },
  { date: "02/05/2026", time: "18:53", firstName: "Maryam",   lastName: "Zayed",    step: "صباح الورد نزلت محتوى بالإنستغرام\nوبنزل وبينار اصنع واقعك الجمعه هاذي واعمل هديه خمس مكالمات\nواسوي قناه تلقرام لعملائي" },
  { date: "02/05/2026", time: "19:46", firstName: "Aysha",    lastName: "",         step: "نزلت بوست وسويت أول رول بلاي 🥳😘" },
  { date: "02/05/2026", time: "20:24", firstName: "Mohammed", lastName: "Al kaabi", step: "سويت جلسة اخلع نعليك" },
  { date: "02/05/2026", time: "20:25", firstName: "Mohammed", lastName: "Al kaabi", step: "دخلت عميل لرحله فكر وازدد ثراء" },
  { date: "02/05/2026", time: "20:25", firstName: "Mohammed", lastName: "Al kaabi", step: "اليوم بصور فيديو تشويقي لأول جلسه" },
  { date: "02/05/2026", time: "22:55", firstName: "Maryam",   lastName: "Zayed",    step: "نشرت اصنع واقعك ستوري وسويت بوست بعد" },
  { date: "02/05/2026", time: "18:00", firstName: "عبير",     lastName: "",         step: "مكالمة" },

  // ── May 3 ──────────────────────────────────────────────────────────
  { date: "03/05/2026", time: "12:00", firstName: "عبير",     lastName: "",         step: "فلو اب" },
];

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const correct = process.env.ADMIN_PASSWORD ?? "admin";
    if (password !== correct) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Refuse to run if sheet already has data (prevent duplicate restore)
    const existing = await getSheetData(SHEET);
    if (existing.length > 0) {
      return NextResponse.json({
        ok: false,
        error: `الشيت فيه بالفعل ${existing.length} إدخال - لا تُشغّل الاستعادة مرتين`,
      }, { status: 409 });
    }

    const results: { name: string; step: string; ok: boolean; error?: string }[] = [];
    for (const entry of LOST_ENTRIES) {
      try {
        await addStep(SHEET, {
          date: entry.date,
          time: entry.time,
          userId: "",
          username: "",
          firstName: entry.firstName,
          lastName: entry.lastName,
          step: entry.step,
          results: "",
        });
        results.push({ name: `${entry.firstName} ${entry.lastName}`.trim(), step: entry.step.substring(0, 40), ok: true });
      } catch (e) {
        results.push({ name: `${entry.firstName} ${entry.lastName}`.trim(), step: entry.step.substring(0, 40), ok: false, error: String(e) });
      }
    }

    const success = results.filter((r) => r.ok).length;
    return NextResponse.json({ ok: true, total: LOST_ENTRIES.length, success, results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
