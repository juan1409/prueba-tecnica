import express, { Request, Response } from "express";
import { DateTime } from "luxon";
import { CONFIG } from "./config";
import { getHolidays } from "./holidays";
import {
  addBusinessDays,
  addBusinessHours,
  normalizeBackwardToWorkingInstant,
  parseUtcIsoToLocal,
  toUtcIsoZ
} from "./businessTime";
import type { ErrorResponse, OkResponse } from "./types";

const app = express();

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, tz: CONFIG.tz });
});

app.get("/api/working-date", async (req: Request, res: Response) => {
  try {
    const rawDays = req.query.days as string | undefined;
    const rawHours = req.query.hours as string | undefined;
    const rawDate = req.query.date as string | undefined;

    if (rawDays === undefined && rawHours === undefined) {
      const e: ErrorResponse = {
        error: "InvalidParameters",
        message: "Debe enviar al menos uno de los parámetros: days u hours."
      };
      return res.status(400).json(e);
    }

    const days = rawDays !== undefined ? Number(rawDays) : undefined;
    const hours = rawHours !== undefined ? Number(rawHours) : undefined;

    if (days !== undefined && (!Number.isInteger(days) || days <= 0)) {
      const e: ErrorResponse = {
        error: "InvalidParameters",
        message: "El parámetro 'days' debe ser un entero positivo."
      };
      return res.status(400).json(e);
    }
    if (hours !== undefined && (!Number.isInteger(hours) || hours <= 0)) {
      const e: ErrorResponse = {
        error: "InvalidParameters",
        message: "El parámetro 'hours' debe ser un entero positivo."
      };
      return res.status(400).json(e);
    }

    let startLocal: DateTime | null;
    if (rawDate) {
      const parsed = parseUtcIsoToLocal(rawDate);
      if (!parsed) {
        const e: ErrorResponse = {
          error: "InvalidParameters",
          message: "El parámetro 'date' debe ser ISO 8601 UTC con sufijo Z (ej. 2025-04-21T20:00:00Z)."
        };
        return res.status(400).json(e);
      }
      startLocal = parsed;
    } else {
      startLocal = DateTime.now().setZone(CONFIG.tz);
    }

    let holidays;
    try {
      holidays = await getHolidays();
    } catch (err) {
      const e: ErrorResponse = {
        error: "UpstreamUnavailable",
        message: (err as Error).message
      };
      return res.status(503).json(e);
    }

    let cursor = normalizeBackwardToWorkingInstant(startLocal, holidays);

    if (days) cursor = addBusinessDays(cursor, days, holidays);
    if (hours) cursor = addBusinessHours(cursor, hours, holidays);

    const payload: OkResponse = { date: toUtcIsoZ(cursor) };
    return res.status(200).json(payload);
  } catch (_err) {
    const e: ErrorResponse = {
      error: "InternalError",
      message: "Ha ocurrido un error inesperado."
    };
    return res.status(500).json(e);
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});