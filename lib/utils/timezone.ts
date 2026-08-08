// Colombia no observa horario de verano — UTC-5 fijo todo el año, así que
// un offset constante es seguro (no hace falta una librería de tz completa).
// Sin esto, "hoy"/"este mes" se calculaban con la hora del servidor (UTC en
// Vercel), mostrando datos del día o mes siguiente entre las 7pm y la
// medianoche hora Bogotá.
const BOGOTA_TZ = "America/Bogota";

function bogotaParts(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOGOTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function bogotaStartOfDay(date: Date = new Date()): Date {
  const { year, month, day } = bogotaParts(date);
  return new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
}

export function bogotaStartOfMonth(date: Date = new Date()): Date {
  const { year, month } = bogotaParts(date);
  return new Date(Date.UTC(year, month - 1, 1, 5, 0, 0, 0));
}

export function bogotaDateInputValue(date: Date = new Date()): string {
  const { year, month, day } = bogotaParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Instante UTC correspondiente a la medianoche Bogotá de un "YYYY-MM-DD" dado. */
export function bogotaMidnightFromDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
}
