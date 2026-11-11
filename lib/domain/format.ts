/** 分数を「1 時間 30 分」のような読みやすい表記にする */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} 分`;
  return rest === 0 ? `${hours} 時間` : `${hours} 時間 ${rest} 分`;
}
