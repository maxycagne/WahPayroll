import { isInRange, isNonWorkingDay } from "./date.utils";
import { getLeaveDateStatus, pad } from "./leave.utils";
import { calendarStatusOrder } from "../leaveConstants";

export function getLeavesForDate(
  dateStr: string,
  leaves: any[],
  workweekConfigs: any[] = [],
): any[] {
  if (isNonWorkingDay(dateStr, workweekConfigs)) {
    return [];
  }

  return leaves
    .filter((l) =>
      isInRange({ date: dateStr, from: l.date_from, to: l.date_to }),
    )
    .map((leave) => ({
      ...leave,
      calendar_status: getLeaveDateStatus(leave, dateStr),
    }))
    .sort((a, b) => {
      const aRank = calendarStatusOrder[a.calendar_status] ?? 99;
      const bRank = calendarStatusOrder[b.calendar_status] ?? 99;

      if (aRank !== bRank) return aRank - bRank;

      const aName = `${a.first_name || ""} ${a.last_name || ""}`.trim();
      const bName = `${b.first_name || ""} ${b.last_name || ""}`.trim();
      return aName.localeCompare(bName);
    });
}

export function getAttendanceForDate(dateStr: string, attendance: any[]): any {
  return attendance.find((a) => {
    const d = new Date(a.date);
    const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return formattedDate === dateStr;
  });
}
