import type { Data } from "./types";
import { makeSeed } from "./seed";

const KEY = "neighborhood-kitchen-prototype-v1";
export type StorageStatus = "ok" | "corrupt" | "unavailable";

function validOffer(value: unknown, snapshot = false): boolean {
  const o = value as Data["offers"][number];
  if (!o || typeof o.id !== "string" || !Array.isArray(o.ingredients) || !o.allergens || typeof o.allergens !== "object") return false;
  if (o.otherAllergens !== undefined && typeof o.otherAllergens !== "string") return false;
  if (o.publishedAt !== undefined && (typeof o.publishedAt !== "string" || !Number.isFinite(Date.parse(o.publishedAt)))) return false;
  const confirmation = o.preparationConfirmation;
  if (confirmation !== undefined && (!confirmation || typeof confirmation.statementVersion !== "string" ||
      typeof confirmation.confirmedAt !== "string" || typeof confirmation.pickupDate !== "string" ||
      !Number.isInteger(confirmation.offerVersion))) return false;
  // Older browser-local samples need no invented publication times, confirmations or revision history.
  return o.revisions === undefined || (!snapshot && Array.isArray(o.revisions) && o.revisions.every((r) => validOffer(r, true)));
}

function valid(d: unknown): d is Data {
  const x = d as Data;
  return !!x && x.version === 1 && Array.isArray(x.offers) && Array.isArray(x.cooks) && Array.isArray(x.reports) && Array.isArray(x.audit) && !!x.applications && typeof x.applications === "object"
    && x.offers.every((o) => validOffer(o))
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
