export interface TimeMetadata {
  localDateTime: Date;
  utcDateTime: Date;
  offset: string;
  timezone: string;
}

const formatOffset = (minutesOffset: number): string => {
  const sign = minutesOffset >= 0 ? "+" : "-";
  const absMinutes = Math.abs(minutesOffset);
  const hh = String(Math.floor(absMinutes / 60)).padStart(2, "0");
  const mm = String(absMinutes % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
};

export const getTimeMetadata = (): TimeMetadata => {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const offset = formatOffset(-now.getTimezoneOffset());

  return {
    localDateTime: now,
    utcDateTime: new Date(now.toISOString()),
    offset,
    timezone
  };
};
