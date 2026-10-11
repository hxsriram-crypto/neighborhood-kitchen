import type { Data } from "./types";
import { makeSeed } from "./seed";

const KEY = "neighborhood-kitchen-prototype-v1";
export type StorageStatus = "ok" | "corrupt" | "unavailable";

function valid(d: unknown): d is Data {
  const x = d as Data;
  return !!x && x.version === 1 && Array.isArray(x.offers) && Array.isArray(x.cooks) && Array.isArray(x.reports) && Array.isArray(x.audit) && !!x.applications && typeof x.applications === "object"
    && x.offers.every((o) => o && typeof o.id === "string" && Array.isArray(o.ingredients) && o.allergens && typeof o.allergens === "object")
    && x.cooks.every((c) => c && typeof c.id === "string");
}
export function save(d: Data): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch { return false; }
}
export function load(now: number): { data: Data; status: StorageStatus } {
  let raw: string | null;
  try { raw = localStorage.getItem(KEY); } catch { return { data: makeSeed(now), status: "unavailable" }; }
  if (raw === null) { const data = makeSeed(now); return { data, status: save(data) ? "ok" : "unavailable" }; }
  try { const p = JSON.parse(raw); if (valid(p)) return { data: p, status: "ok" }; } catch { /* corrupt */ }
  return { data: makeSeed(now), status: "corrupt" };
}
export function resetStorage(now: number): { data: Data; status: StorageStatus } {
  const data = makeSeed(now);
  try { localStorage.removeItem(KEY); } catch { return { data, status: "unavailable" }; }
  return { data, status: save(data) ? "ok" : "unavailable" };
}
