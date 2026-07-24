const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

export function formatTripDate(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);

  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function getTripDayCount(
  startDate: Date | string | number,
  endDate: Date | string | number
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const difference = end.getTime() - start.getTime();

  return Math.max(1, Math.floor(difference / MILLISECONDS_PER_DAY) + 1);
}

export function getTripDayDate(
  startDate: Date | string | number,
  dayIndex: number
) {
  const date = new Date(startDate);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  return date;
}

export function formatTripDayDate(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);

  return `${WEEKDAYS[date.getUTCDay()]}, ${formatTripDate(date)}`;
}
