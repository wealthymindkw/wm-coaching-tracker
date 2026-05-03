"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, Users, TrendingUp, Calendar,
  RefreshCw, ChevronDown, Star, Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { KpiCard } from "@/components/KpiCard";
import { Leaderboard } from "@/components/Leaderboard";
import { StepsPanel } from "@/components/StepsPanel";
import type { StepRow, MemberStats } from "@/lib/types";

// ─── Stats ───────────────────────────────────────────────────────────────────
function parseDate(str: string): Date | null {
  if (!str) return null;
  const [d, m, y] = str.split("/");
  if (!d || !m || !y) return null;
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates)].sort().reverse();
  const parsed = unique.map(parseDate).filter(Boolean) as Date[];
  if (parsed.length === 0) return 0;
  let streak = 1;
  for (let i = 0; i < parsed.length - 1; i++) {
    const diff = (parsed[i].getTime() - parsed[i + 1].getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function buildStats(rows: StepRow[]): MemberStats[] {
  const map = new Map<string, MemberStats>();
  for (const row of rows) {
    const key = row.userId || row.username || row.firstName;
    if (!key) continue;
    if (!map.has(key)) {
      const fn = row.firstName || row.username || "Unknown";
      const ln = row.lastName || "";
      const fullName = (fn + " " + ln).trim();
      const initials = ((fn[0] ?? "") + (ln[0] ?? "")).toUpperCase();
      map.set(key, { userId: row.userId, username: row.username, firstName: row.firstName, lastName: row.lastName, fullName, initials, steps: [], stepCount: 0, streak: 0, score: 0, lastActive: "" });
    }
    map.get(key)!.steps.push(row);
  }
  const result: MemberStats[] = [];
  for (const m of map.values()) {
    m.stepCount = m.steps.length;
    m.steps.sort((a, b) => {
      const da = parseDate(a.date)?.getTime() ?? 0;
      const db = parseDate(b.date)?.getTime() ?? 0;
      return db - da;
    });
    m.lastActive = m.steps[0]?.date ?? "";
    m.streak = calcStreak(m.steps.map((s) => s.date));
    m.score = m.stepCount * 10 + m.streak * 5;
    result.push(m);
  }
  return result.sort((a, b) => b.stepCount - a.stepCount);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [rows, setRows] = useState<StepRow[]>([]);
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [selectedMemberKey, setSelectedMemberKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Fetch available months on mount, auto-create current month if missing
  useEffect(() => {
    const now = new Date();
    const currentMonthName = now.toLocaleString("en-US", { month: "long" }) + " " + now.getFullYear();

    fetch("/api/months")
      .then((r) => r.json())
      .then(async (data) => {
        const existingMonths: string[] = data.months ?? [];
        if (!existingMonths.includes(currentMonthName)) {
          const res = await fetch("/api/months", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month: currentMonthName }),
          });
          const created = await res.json();
          const updated: string[] = created.months ?? existingMonths;
          setMonths(updated);
          setSelectedMonth(currentMonthName);
        } else {
          setMonths(existingMonths);
          setSelectedMonth(currentMonthName);
        }
      })
      .catch((e) => setError(String(e)));
  }, []);

  // Fetch data when month changes
  const loadData = useCallback(async (month: string) => {
    if (!month) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/data?sheet=${encodeURIComponent(month)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows(data.rows ?? []);
      setMembers(buildStats(data.rows ?? []));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (selectedMonth) loadData(selectedMonth); }, [selectedMonth, loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData(selectedMonth);
    setRefreshing(false);
  }

  // Step CRUD handlers
  function handleStepUpdated(updated: StepRow) {
    setRows((prev) => prev.map((r) => r.rowIndex === updated.rowIndex ? updated : r));
    setMembers(buildStats(rows.map((r) => r.rowIndex === updated.rowIndex ? updated : r)));
  }

  function handleStepDeleted(rowIndex: number) {
    const newRows = rows.filter((r) => r.rowIndex !== rowIndex);
    setRows(newRows);
    setMembers(buildStats(newRows));
  }

  function handleStepAdded(row: Omit<StepRow, "rowIndex">) {
    // Reload to get correct row index from sheets
    loadData(selectedMonth);
  }

  const selectedMember = selectedMemberKey
    ? members.find((m) => (m.userId || m.username || m.firstName) === selectedMemberKey) ?? null
    : null;

  // KPI values
  const totalSteps = rows.length;
  const totalMembers = members.length;
  const topMember = members[0];
  const avgSteps = totalMembers > 0 ? (totalSteps / totalMembers).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[hsl(var(--foreground))] leading-none">WM Coaching Tracker</h1>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-none mt-0.5">Wealthy Mind</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Month selector */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(e.target.value); setSelectedMemberKey(null); }}
                className="appearance-none pl-4 pr-9 py-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] pointer-events-none" />
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 transition disabled:opacity-50"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5", (loading || refreshing) && "animate-spin")} />
              تحديث
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Month header */}
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
            {selectedMonth || "Loading..."}
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1 flex items-center gap-1.5 text-sm">
            <Calendar className="w-4 h-4" />
            تتبع خطوات المشاركين في قروب Wealthy Mind
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">جاري تحميل البيانات...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard
                title="إجمالي الخطوات"
                value={String(totalSteps)}
                subtitle={selectedMonth}
                icon={TrendingUp}
                accent="blue"
              />
              <KpiCard
                title="المشاركون"
                value={String(totalMembers)}
                subtitle="عدد الأعضاء النشطين"
                icon={Users}
                accent="green"
              />
              <KpiCard
                title="المتصدر"
                value={topMember ? topMember.fullName.split(" ")[0] : "—"}
                subtitle={topMember ? `${topMember.stepCount} خطوات` : "لا يوجد"}
                icon={Star}
                accent="amber"
              />
              <KpiCard
                title="المعدل / شخص"
                value={avgSteps}
                subtitle="متوسط الخطوات"
                icon={Activity}
                accent="purple"
              />
            </div>

            {/* Leaderboard */}
            <Leaderboard
              members={members}
              selectedUserId={selectedMemberKey}
              onSelect={(key) => setSelectedMemberKey(prev => prev === key ? null : key)}
            />

            {/* Steps Panel for selected member */}
            {selectedMember && (
              <StepsPanel
                member={selectedMember}
                sheetName={selectedMonth}
                onClose={() => setSelectedMemberKey(null)}
                onStepUpdated={handleStepUpdated}
                onStepDeleted={handleStepDeleted}
                onStepAdded={handleStepAdded}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
