"use client";

import { useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import type { StepRow } from "@/lib/types";

interface Props {
  sheetName: string;
  defaultFirstName?: string;
  defaultLastName?: string;
  defaultUserId?: string;
  defaultUsername?: string;
  onClose: () => void;
  onAdded: (row: Omit<StepRow, "rowIndex">) => void;
}

function todayKuwait(): string {
  const now = new Date();
  const kw = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kuwait" }));
  const d = String(kw.getDate()).padStart(2, "0");
  const m = String(kw.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${kw.getFullYear()}`;
}

function timeKuwait(): string {
  const now = new Date();
  const kw = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kuwait" }));
  return `${String(kw.getHours()).padStart(2, "0")}:${String(kw.getMinutes()).padStart(2, "0")}`;
}

export function AddStepModal({ sheetName, defaultFirstName, defaultLastName, defaultUserId, defaultUsername, onClose, onAdded }: Props) {
  const [form, setForm] = useState({
    date: todayKuwait(),
    time: timeKuwait(),
    userId: defaultUserId ?? "",
    username: defaultUsername ?? "",
    firstName: defaultFirstName ?? "",
    lastName: defaultLastName ?? "",
    step: "",
    results: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleAdd() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet: sheetName, ...form }),
      });
      if (!res.ok) throw new Error(await res.text());
      onAdded(form);
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const inp = "w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">إضافة خطوة</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">الاسم الأول</label>
            <input className={inp} value={form.firstName} onChange={set("firstName")} placeholder="Hamad" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">الاسم الأخير</label>
            <input className={inp} value={form.lastName} onChange={set("lastName")} placeholder="Al..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">التاريخ</label>
            <input className={inp} value={form.date} onChange={set("date")} placeholder="dd/mm/yyyy" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">الوقت</label>
            <input className={inp} value={form.time} onChange={set("time")} placeholder="HH:MM" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">الخطوة *</label>
          <textarea
            className={`${inp} resize-none`}
            rows={4}
            value={form.step}
            onChange={set("step")}
            placeholder="اكتب الخطوة هنا..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">النتائج / ملاحظات</label>
          <textarea
            className={`${inp} resize-none`}
            rows={2}
            value={form.results}
            onChange={set("results")}
            placeholder="اختياري..."
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-lg border border-[hsl(var(--border))] text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition disabled:opacity-60">
            إلغاء
          </button>
          <button onClick={handleAdd} disabled={loading || !form.step.trim()} className="flex-1 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? "جاري الإضافة..." : "إضافة"}
          </button>
        </div>
      </div>
    </div>
  );
}
