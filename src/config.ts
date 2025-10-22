import { WorkingConfig } from "./types";

export const CONFIG: WorkingConfig = {
  tz: "America/Bogota",
  morningStart: "08:00",
  morningEnd: "12:00",
  afternoonStart: "13:00",
  afternoonEnd: "17:00",
  holidaysUrl: "https://content.capta.co/Recruitment/WorkingDays.json",
  holidaysTtlMs: 1000 * 60 * 60 // 1 hora de caché
};