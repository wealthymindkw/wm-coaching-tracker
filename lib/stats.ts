import type { StepRow, MemberStats } from "./types";

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

export function buildMemberStats(rows: StepRow[]): MemberStats[] {
  const map = new Map<string, MemberStats>();

  for (const row of rows) {
    const key = row.userId || row.username || row.firstName;
    if (!key) continue;

    if (!map.has(key)) {
      const firstName = row.firstName || row.username || "Unknown";
      const lastName = row.lastName || "";
      const fullName = (firstName + " " + lastName).trim();
      const initials = (firstName[0] ?? "") + (lastName[0] ?? "");
      map.set(key, {
        userId: row.userId,
        username: row.username,
        firstName: row.firstName,
        lastName: row.lastName,
        fullName,
        initials: initials.toUpperCase(),
        steps: [],
        stepCount: 0,
        streak: 0,
        score: 0,
        lastActive: "",
      });
    }

    const member = map.get(key)!;
    member.steps.push(row);
  }

  const result: MemberStats[] = [];
  for (const member of map.values()) {
    member.stepCount = member.steps.length;
    member.steps.sort((a, b) => {
      const da = parseDate(a.date)?.getTime() ?? 0;
      const db = parseDate(b.date)?.getTime() ?? 0;
      return db - da;
    });
    member.lastActive = member.steps[0]?.date ?? "";
    member.streak = calcStreak(member.steps.map((s) => s.date));
    member.score = member.stepCount * 10 + member.streak * 5;
    result.push(member);
  }

  return result.sort((a, b) => b.stepCount - a.stepCount);
}
