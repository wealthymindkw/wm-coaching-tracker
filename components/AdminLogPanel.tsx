"use client";

import { useState } from "react";
import { Trash2, Plus, Loader2, AlertTriangle, ClipboardList, RotateCcw, CheckCircle2 } from "lucide-react";
import type { StepRow } from "@/lib/types";
import { AddStepModal } from "./AddStepModal";

interface Props {
  rows: StepRow[];
  sheetName: string;
  adminPassword: string;
  onStepDeleted: (rowIndex: number) => void;
  onStepAdded: (row: Omit<StepRow, "rowIndex">) => void;
  onRefresh: () => void;
}

export function AdminLogPanel({ rows, sheetName, adminPassword, onStepDeleted, onStepAdded, onRefresh }: Props) {
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [addingStep, setAddingStep] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ success: number; total: number } | null>(null);
  const [restoreError, setRestoreError] = useState("");

  async function handleRestore() {
    if (!confirm("سيتم استعادة البيانات المفقودة من مايو (١-٣ مايو ٢٠٢٦). متأكد؟")) return;
    setRestoring(true);
    setRestoreError("");
    setRestoreResult(null);
    try {
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setRestoreResult({ success: data.success, total: data.total });
      onRefresh();
    } catch (e) {
      setRestoreError(String(e));
    } finally {
      setRestoring(false);
    }
  }

  async function handleDelete(row: StepRow) {
    if (!confirm(`حذف الدفعة؟\n${row.firstName} ${row.lastName} — ${row.date}\n"${row.step.substring(0, 60)}..."`)) return;
    setDeletingIdx(row.rowIndex);
    setDeleteError("");
    try {
      const res = await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet: sheetName, rowIndex: row.rowIndex }),
      });
      if (!res.ok) throw new Error(await res.text());
      onStepDeleted(row.rowIndex);
    } catch (e) {
      setDeleteError(String(e));
    } finally {
      setDeletingIdx(null);
    }
  }

  const sorted = [...rows].sort((a, b) => b.rowIndex - a.rowIndex);

  return (
    <>
      <div className="rounded-xl border border-amber-500/30 bg-[hsl(var(--card))] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[hsl(var(--foreground))]">سجل الدفعات</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{rows.length} دفعة — {sheetName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sheetName === "May 2026" && !restoreResult && (
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold border border-amber-500/30 transition disabled:opacity-60"
              >
                {restoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                {restoring ? "جاري الاستعادة..." : "استعادة البيانات المفقودة"}
              </button>
            )}
            {restoreResult && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                تمت الاستعادة ({restoreResult.success}/{restoreResult.total})
              </span>
            )}
            <button
              onClick={() => setAddingStep(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة دفعة
            </button>
          </div>
        </div>

        {(deleteError || restoreError) && (
          <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {deleteError || restoreError}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="px-6 py-10 text-center text-[hsl(var(--muted-foreground))] text-sm">
            لا توجد دفعات لهذا الشهر
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20">
                  <th className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--muted-foreground))]">#</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--muted-foreground))]">التاريخ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--muted-foreground))]">العضو</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[hsl(var(--muted-foreground))]">الخطوة</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {sorted.map((row, idx) => (
                  <tr
                    key={row.rowIndex}
                    className="hover:bg-[hsl(var(--muted))]/10 transition-colors group"
                  >
                    <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
                      {rows.length - idx}
                    </td>
                    <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                      <div>{row.date}</div>
                      <div className="opacity-60">{row.time}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[hsl(var(--foreground))] whitespace-nowrap">
                      {row.firstName} {row.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))] max-w-sm">
                      <p className="line-clamp-2 leading-relaxed">{row.step}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(row)}
                        disabled={deletingIdx === row.rowIndex}
                        className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="حذف"
                      >
                        {deletingIdx === row.rowIndex
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addingStep && (
        <AddStepModal
          sheetName={sheetName}
          onClose={() => setAddingStep(false)}
          onAdded={(row) => {
            onStepAdded(row);
            setAddingStep(false);
          }}
        />
      )}
    </>
  );
}
