export interface QueryParams {
  days?: number;
  hours?: number;
  date?: string; // ISO 8601 UTC con sufijo Z
}

export interface OkResponse {
  date: string; // UTC ISO 8601 con Z
}

export interface ErrorResponse {
  error: "InvalidParameters" | "UpstreamUnavailable" | "InternalError";
  message: string;
}

export type HolidaySet = Set<string>; // YYYY-MM-DD en Colombia (America/Bogota)

export interface WorkingConfig {
  tz: string;                // "America/Bogota"
  morningStart: string;      // "08:00"
  morningEnd: string;        // "12:00"
  afternoonStart: string;    // "13:00"
  afternoonEnd: string;      // "17:00"
  holidaysUrl: string;       // fuente JSON de festivos
  holidaysTtlMs: number;     // TTL de caché en ms
}