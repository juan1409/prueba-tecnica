import type { HolidaySet } from "./types";
import { CONFIG } from "./config";

/**
 * Acepta varios formatos posibles desde el recurso remoto:
 * - { "holidays": ["YYYY-MM-DD", ...] }
 * - { "WorkingDays": ["YYYY-MM-DD", ...] }
 * - { "dates": ["YYYY-MM-DD", ...] }
 * - { "holidays": [{ "date": "YYYY-MM-DD" }, ...] }
 * - O directamente un array: ["YYYY-MM-DD", ...] o [{ date: "..." }, ...]
 */
type AnyJson = unknown;

interface HasArray {
  [k: string]: unknown;
}

function isStringArray(a: unknown): a is string[] {
  return Array.isArray(a) && a.every((x) => typeof x === "string");
}

function isObjArrayWithDate(a: unknown): a is Array<{ [k: string]: unknown }> {
  return Array.isArray(a) && a.every((x) => typeof x === "object" && x !== null);
}

function normalizeDates(raw: AnyJson): string[] | null {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  // Caso 1: array directo
  if (isStringArray(raw)) {
    return raw.filter((s) => dateRegex.test(s.trim())).map((s) => s.trim());
  }
  if (isObjArrayWithDate(raw)) {
    const out: string[] = [];
    for (const item of raw) {
      const obj = item as Record<string, unknown>;
      const candidate =
        (obj.date as string) ||
        (obj.Date as string) ||
        (obj.fecha as string) ||
        (obj.Fecha as string);
      if (typeof candidate === "string" && dateRegex.test(candidate.trim())) {
        out.push(candidate.trim());
      }
    }
    return out.length ? out : null;
  }

  // Caso 2: objeto con propiedades conocidas
  if (typeof raw === "object" && raw !== null) {
    const o = raw as HasArray;
    const keys = Object.keys(o);
    // prioridad a "holidays"
    const prefer = ["holidays", "Holidays", "workingDays", "WorkingDays", "dates", "Dates"];
    for (const k of prefer) {
      const v = (o as Record<string, unknown>)[k];
      const norm = normalizeDates(v as AnyJson);
      if (norm && norm.length) return norm;
    }
    // buscar cualquier arreglo aprovechable
    for (const k of keys) {
      const v = (o as Record<string, unknown>)[k];
      const norm = normalizeDates(v as AnyJson);
      if (norm && norm.length) return norm;
    }
  }

  return null;
}

let cachedHolidays: HolidaySet | null = null;
let cacheExpiresAt = 0;
const nowUnix = (): number => Date.now();

export async function getHolidays(): Promise<HolidaySet> {
  if (cachedHolidays && nowUnix() < cacheExpiresAt) return cachedHolidays;

  let body: AnyJson;
  try {
    const res = await fetch(CONFIG.holidaysUrl, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body = await res.json();
  } catch (err) {
    throw new Error(`No se pudo cargar el arreglo de festivos: ${(err as Error).message}`);
  }

  const dates = normalizeDates(body);
  if (!dates || !dates.length) {
    throw new Error("Formato inválido de festivos");
  }

  const set: HolidaySet = new Set(dates);
  cachedHolidays = set;
  cacheExpiresAt = nowUnix() + CONFIG.holidaysTtlMs;
  return set;
}