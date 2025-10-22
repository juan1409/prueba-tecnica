import { DateTime, Duration } from "luxon";
import { CONFIG } from "./config";
import type { HolidaySet } from "./types";

/** Helpers de horarios */
function parseLocalTime(base: DateTime, hhmm: string): DateTime {
  const [h, m] = hhmm.split(":").map((t) => parseInt(t, 10));
  return base.set({ hour: h, minute: m, second: 0, millisecond: 0 });
}

function isWeekend(dt: DateTime): boolean {
  const w = dt.weekday; // 1=Lunes ... 7=Domingo
  return w === 6 || w === 7;
}

function isHolidayLocal(dt: DateTime, holidays: HolidaySet): boolean {
  return holidays.has(dt.toFormat("yyyy-LL-dd"));
}

function isBusinessDay(dt: DateTime, holidays: HolidaySet): boolean {
  return !isWeekend(dt) && !isHolidayLocal(dt, holidays);
}

function inMorning(dt: DateTime): boolean {
  const start = parseLocalTime(dt, CONFIG.morningStart);
  const end = parseLocalTime(dt, CONFIG.morningEnd);
  return dt >= start && dt < end;
}

function inAfternoon(dt: DateTime): boolean {
  const start = parseLocalTime(dt, CONFIG.afternoonStart);
  const end = parseLocalTime(dt, CONFIG.afternoonEnd);
  return dt >= start && dt < end;
}

function inLunch(dt: DateTime): boolean {
  const lunchStart = parseLocalTime(dt, CONFIG.morningEnd);     // 12:00
  const lunchEnd = parseLocalTime(dt, CONFIG.afternoonStart);   // 13:00
  return dt >= lunchStart && dt < lunchEnd;
}

function beforeWork(dt: DateTime): boolean {
  const dayStart = parseLocalTime(dt, CONFIG.morningStart); // 08:00
  return dt < dayStart;
}

function afterWork(dt: DateTime): boolean {
  const dayEnd = parseLocalTime(dt, CONFIG.afternoonEnd); // 17:00
  return dt >= dayEnd;
}

function endOfWork(dt: DateTime): DateTime {
  return parseLocalTime(dt, CONFIG.afternoonEnd);
}

function startOfWork(dt: DateTime): DateTime {
  return parseLocalTime(dt, CONFIG.morningStart);
}

function sameClockNextBusinessDay(dt: DateTime, holidays: HolidaySet): DateTime {
  let d = dt.plus({ days: 1 }).startOf("day").setZone(CONFIG.tz, { keepLocalTime: true });
  while (!isBusinessDay(d, holidays)) {
    d = d.plus({ days: 1 });
  }
  return d.set({
    hour: dt.hour,
    minute: dt.minute,
    second: dt.second,
    millisecond: dt.millisecond
  });
}

/**
 * Ajuste inicial: si está fuera de horario hábil o no es día hábil,
 * aproximar **hacia atrás** al instante hábil más cercano.
 */
export function normalizeBackwardToWorkingInstant(dt: DateTime, holidays: HolidaySet): DateTime {
  let d = dt.setZone(CONFIG.tz, { keepLocalTime: true });

  if (!isBusinessDay(d, holidays)) {
    do {
      d = d.minus({ days: 1 }).set({ hour: 17, minute: 0, second: 0, millisecond: 0 });
    } while (!isBusinessDay(d, holidays));
    return d;
  }

  if (inLunch(d)) {
    return parseLocalTime(d, CONFIG.morningEnd); // 12:00
  }

  if (beforeWork(d)) {
    let prev = d.minus({ days: 1 });
    while (!isBusinessDay(prev, holidays)) prev = prev.minus({ days: 1 });
    return parseLocalTime(prev, CONFIG.afternoonEnd); // 17:00 del hábil previo
  }

  if (afterWork(d)) {
    return endOfWork(d);
  }

  return d.set({ second: 0, millisecond: 0 });
}

/**
 * Mover hacia delante al próximo instante hábil (para sumas hacia el futuro).
 */
export function normalizeForwardToWorkingInstant(dt: DateTime, holidays: HolidaySet): DateTime {
  let d = dt.setZone(CONFIG.tz, { keepLocalTime: true });

  const goToNextBusinessMorning = (): DateTime => {
    do {
      d = d.plus({ days: 1 }).startOf("day");
    } while (!isBusinessDay(d, holidays));
    return startOfWork(d);
  };

  if (!isBusinessDay(d, holidays)) {
    return goToNextBusinessMorning();
  }

  if (inLunch(d)) {
    return parseLocalTime(d, CONFIG.afternoonStart); // 13:00
  }

  if (afterWork(d)) {
    return goToNextBusinessMorning();
  }

  if (beforeWork(d)) {
    return startOfWork(d);
  }

  // Está dentro de franja hábil
  return d.set({ second: 0, millisecond: 0 });
}

/** Suma de días hábiles: conserva la hora local (ya normalizada hacia atrás) */
export function addBusinessDays(start: DateTime, days: number, holidays: HolidaySet): DateTime {
  let d = start.setZone(CONFIG.tz, { keepLocalTime: true });
  for (let i = 0; i < days; i++) {
    d = sameClockNextBusinessDay(d, holidays);
  }
  return d;
}

/** Suma de horas hábiles, saltando almuerzo y fuera de horario. */
export function addBusinessHours(start: DateTime, hours: number, holidays: HolidaySet): DateTime {
  let d = normalizeForwardToWorkingInstant(start, holidays);
  let remaining = hours;

  while (remaining > 0) {
    const inMorningNow = inMorning(d);
    const inAfternoonNow = inAfternoon(d);

    // Determinar fin del bloque actual
    let blockEnd: DateTime;
    if (inMorningNow) {
      blockEnd = parseLocalTime(d, CONFIG.morningEnd); // 12:00
    } else if (inAfternoonNow) {
      blockEnd = parseLocalTime(d, CONFIG.afternoonEnd); // 17:00
    } else {
      // No está en bloque hábil → normalizar
      d = normalizeForwardToWorkingInstant(d, holidays);
      continue;
    }

    const diffHours = Math.max(0, blockEnd.diff(d, "hours").hours);
    if (remaining <= diffHours + 1e-9) {
      // Cabe en este bloque
      d = d.plus(Duration.fromObject({ hours: remaining })).set({ second: 0, millisecond: 0 });
      remaining = 0;
    } else {
      // Consumir el bloque y saltar al siguiente bloque hábil
      remaining -= diffHours;
      if (inMorningNow) {
        // Saltar almuerzo a 13:00
        d = parseLocalTime(d, CONFIG.afternoonStart);
      } else {
        // Final del día → próximo día hábil 08:00
        let next = d.plus({ days: 1 }).startOf("day");
        while (!isBusinessDay(next, holidays)) {
          next = next.plus({ days: 1 });
        }
        d = startOfWork(next);
      }
    }
  }

  return d;
}

/** Conversión de ISO UTC (con Z) a DateTime local Colombia */
export function parseUtcIsoToLocal(isoZ: string): DateTime | null {
  const utc = DateTime.fromISO(isoZ, { zone: "utc" });
  if (!utc.isValid || !isoZ.endsWith("Z")) return null;
  return utc.setZone(CONFIG.tz);
}

/** Formato de salida UTC sin milisegundos */
export function toUtcIsoZ(dt: DateTime): string {
  return dt.toUTC().toISO({ suppressMilliseconds: true });
}