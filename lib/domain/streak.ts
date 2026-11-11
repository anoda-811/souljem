import { addDays } from "./date";
import type { HabitMark, ISODate } from "./types";

/**
 * 今日時点の連続日数（○が途切れず続いている日数）。
 * - 今日がまだ未記入なら、昨日までの連続を数える
 * - 今日が × なら 0
 * - 開始日より前は数えない
 */
export function calculateStreak(
  marks: Partial<Record<ISODate, HabitMark>>,
  today: ISODate,
  startDate: ISODate,
): number {
  let cursor = marks[today] === undefined ? addDays(today, -1) : today;
  let streak = 0;

  while (cursor >= startDate && marks[cursor] === "done") {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}
