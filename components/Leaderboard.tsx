"use client";

import { Medal, ChevronRight, Flame, Star } from "lucide-react";
import { clsx } from "clsx";
import type { MemberStats } from "@/lib/types";

interface Props {
  members: MemberStats[];
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
}

const rankStyles = ["text-amber-400", "text-slate-400", "text-orange-500"];
const rankIcons = ["🥇", "🥈", "🥉"];

export function Leaderboard({ members, selectedUserId, onSelect }: Props) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
        <Medal className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold text-sm text-[hsl(var(--foreground))]">Leaderboard — الخطوات</h3>
        <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">مرتّب حسب عدد الخطوات</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40">
              <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide w-16">Rank</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">الاسم</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">الخطوات</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Streak</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Score</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">آخر نشاط</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {members.map((member, i) => {
              const isSelected = selectedUserId === (member.userId || member.username || member.firstName);
              return (
                <tr
                  key={member.userId || member.username || i}
                  onClick={() => onSelect(member.userId || member.username || member.firstName)}
                  className={clsx(
                    "cursor-pointer transition-colors",
                    isSelected
                      ? "bg-brand-500/10 border-l-2 border-l-brand-500"
                      : i === 0
                      ? "bg-amber-500/5 hover:bg-amber-500/10"
                      : "hover:bg-[hsl(var(--muted))]/30"
                  )}
                >
                  <td className="px-4 py-4 text-center">
                    <span className={clsx("text-base font-bold", i < 3 ? rankStyles[i] : "text-[hsl(var(--muted-foreground))]")}>
                      {i < 3 ? rankIcons[i] : `#${i + 1}`}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                        isSelected ? "bg-brand-500 text-white" : "bg-brand-500/20 text-brand-400"
                      )}>
                        {member.initials || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-[hsl(var(--foreground))]">{member.fullName}</p>
                        {member.username && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">@{member.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 text-sm font-bold">
                      {member.stepCount}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {member.streak > 0 && <Flame className={clsx("w-3.5 h-3.5", member.streak >= 3 ? "text-orange-400" : "text-slate-500")} />}
                      <span className={clsx("text-sm font-semibold", member.streak >= 3 ? "text-orange-400" : "text-[hsl(var(--muted-foreground))]")}>
                        {member.streak}d
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">{member.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
                    {member.lastActive}
                  </td>
                  <td className="px-2 py-4">
                    <ChevronRight className={clsx("w-4 h-4 transition-colors", isSelected ? "text-brand-400" : "text-[hsl(var(--muted-foreground))]")} />
                  </td>
                </tr>
              );
            })}
            {members.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  لا توجد بيانات لهذا الشهر
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
