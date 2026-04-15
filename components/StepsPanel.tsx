"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, X, Clock, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type { MemberStats, StepRow } from "@/lib/types";
import { EditStepModal } from "./EditStepModal";
import { AddStepModal } from "./AddStepModal";

interface Props {
  member: MemberStats;
  sheetName: string;
  onClose: () => void;
  onStepUpdated: (updated: StepRow) => void;
  onStepDeleted: (rowIndex: number) => void;
  onStepAdded: (row: Omit<StepRow, "rowIndex">) => void;
}

export function StepsPanel({ member, sheetName, onClose, onStepUpdated, onStepDeleted, onStepAdded }: Props) {
  const [editingStep, setEditingStep] = useState<StepRow | null>(null);
  const [addingStep, setAddingStep] = useState(false);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete(step: StepRow) {
    if (!confirm(`حذف الخطوة؟\n"${step.step.substring(0, 80)}..."`)) return;
    setDeletingIdx(step.rowIndex);
    setDeleteError("");
    try {
      const res = await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet: sheetName, rowIndex: step.rowIndex }),
      });
      if (!res.ok) throw new Error(await res.text());
      onStepDeleted(step.rowIndex);
    } catch (e) {
      setDeleteError(String(e));
    } finally {
      setDeletingIdx(null);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-brand-500/30 bg-[hsl(var(--card))] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center gap-3 bg-brand-500/5">
          <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold shrink-0">
            {member.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[hsl(var(--foreground))] truncate">{member.fullName}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {member.stepCount} خطوة · Streak: {member.streak} أيام · Score: {member.score}
            </p>
          </div>
          <button
            onClick={() => setAddingStep(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition shadow-lg shadow-brand-500/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة خطوة
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps List */}
        {deleteError && (
          <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">{deleteError}</div>
        )}

        <div className="divide-y divide-[hsl(var(--border))]">
          {member.steps.length === 0 && (
            <div className="px-6 py-10 text-center text-[hsl(var(--muted-foreground))] text-sm">
              لا توجد خطوات لهذا الشهر
            </div>
          )}
          {member.steps.map((step, idx) => (
            <div key={step.rowIndex} className={clsx(
              "px-5 py-4 flex gap-4 hover:bg-[hsl(var(--muted))]/10 transition-colors group",
              deletingIdx === step.rowIndex && "opacity-50"
            )}>
              {/* Day number / index */}
              <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center text-xs font-bold text-brand-400">
                  {member.steps.length - idx}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="w-3 h-3 text-[hsl(var(--muted-foreground))] shrink-0" />
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{step.date} — {step.time}</span>
                </div>
                <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-wrap">{step.step}</p>
                {step.results && (
                  <div className="mt-2 flex items-start gap-1.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-400 leading-relaxed">{step.results}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-start gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingStep(step)}
                  disabled={deletingIdx === step.rowIndex}
                  className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-brand-500/10 hover:text-brand-400 transition-colors"
                  title="تعديل"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(step)}
                  disabled={deletingIdx === step.rowIndex}
                  className="p-1.5 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title="حذف"
                >
                  {deletingIdx === step.rowIndex
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingStep && (
        <EditStepModal
          step={editingStep}
          sheetName={sheetName}
          onClose={() => setEditingStep(null)}
          onSaved={(updated) => {
            onStepUpdated(updated);
            setEditingStep(null);
          }}
        />
      )}

      {addingStep && (
        <AddStepModal
          sheetName={sheetName}
          defaultFirstName={member.firstName}
          defaultLastName={member.lastName}
          defaultUserId={member.userId}
          defaultUsername={member.username}
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
