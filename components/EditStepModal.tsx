"use client";

import { useState } from "react";
import { X, Loader2, Check } from "lucide-react";
import type { StepRow } from "@/lib/types";

interface Props {
  step: StepRow;
  sheetName: string;
  onClose: () => void;
  onSaved: (updated: StepRow) => void;
}

export function EditStepModal({ step, sheetName, onClose, onSaved }: Props) {
  const [stepText, setStepText] = useState(step.step);
  const [results, setResults] = useState(step.results);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet: sheetName, rowIndex: step.rowIndex, step: stepText, results }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved({ ...step, step: stepText, results });
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const cls = "w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">تعديل الخطوة</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/30 rounded-lg p-3">
          <div><span className="block font-medium text-[hsl(var(--foreground))]">{step.date}</span>التاريخ</div>
          <div><span className="block font-medium text-[hsl(var(--foreground))]">{step.time}</span>الوقت</div>
          <div><span className="block font-medium text-[hsl(var(--foreground))]">{step.firstName} {step.lastName}</span>المشارك</div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">الخطوة</label>
          <textarea
            className={cls}
            rows={4}
            value={stepText}
            onChange={(e) => setStepText(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">النتائج / ملاحظات الكوتش</label>
          <textarea
            className={cls}
            rows={3}
            value={results}
            placeholder="أضف ملاحظات أو نتائج..."
            onChange={(e) => setResults(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-lg border border-[hsl(var(--border))] text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition disabled:opacity-60">
            إلغاء
          </button>
          <button onClick={handleSave} disabled={loading || !stepText.trim()} className="flex-1 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {loading ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}
