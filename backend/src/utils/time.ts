export interface TimeMetadata {
  localDateTime: Date;
  utcDateTime: Date;
  offset: string;
  timezone: string;
}

export const getTimeMetadata = (): TimeMetadata => {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");

  return {
    localDateTime: new Date(now.getTime() - now.getTimezoneOffset() * 60000),
    utcDateTime: now,
    offset: `${sign}${hours}:${minutes}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  };
};
