import type { Application, Data, Offer } from "./types";
import { makeSeed } from "./seed";

const KEY = "neighborhood-kitchen-prototype-v1";
const RECOVERY_KEY = "neighborhood-kitchen-recoverable-drafts-v1";
export const RECOVERY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export type StorageStatus = "ok" | "corrupt" | "unavailable";

export type RecoverableDraft =
  | { kind: "offer"; identity: string; id: string; savedAt: number; expiresAt: number; value: Offer }
  | { kind: "application"; identity: string; id: string; savedAt: number; expiresAt: number; value: Application };

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

function validApplication(value: unknown): value is Application {
  const a = value as Application;
  return !!a && typeof a.name === "string" && typeof a.neighborhood === "string" &&
    typeof a.setting === "string" && typeof a.permitAgency === "string" &&
    typeof a.permitNumber === "string" && typeof a.permitExpiry === "string" &&
    typeof a.evidenceSample === "boolean" && typeof a.residential === "boolean" &&
    typeof a.jurisdiction === "boolean" && typeof a.disclosures === "boolean" &&
    typeof a.updatedAt === "string" && (a.submittedAt === undefined || typeof a.submittedAt === "string");
}

function validRecoverableDraft(value: unknown): value is RecoverableDraft {
  const d = value as RecoverableDraft;
  if (!d || (d.kind !== "offer" && d.kind !== "application") || typeof d.identity !== "string" ||
      typeof d.id !== "string" || !d.id || !Number.isFinite(d.savedAt) || !Number.isFinite(d.expiresAt) ||
      d.expiresAt <= d.savedAt) return false;
  if (d.kind === "offer") {
    return d.value?.id === d.id && d.value?.cookId === d.identity && validOffer(d.value) &&
      d.value.commitment === false && d.value.preparationConfirmation === undefined &&
      d.value.revisions === undefined;
  }
  return d.id === d.identity && validApplication(d.value) && d.value.submittedAt === undefined;
}

function parseRecoverable(raw: string): RecoverableDraft[] | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(validRecoverableDraft)) return null;
    return parsed;
  } catch {
    return null;
  }
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

export function loadRecoverableDrafts(now: number): { drafts: RecoverableDraft[]; status: StorageStatus } {
  let raw: string | null;
  try { raw = localStorage.getItem(RECOVERY_KEY); } catch { return { drafts: [], status: "unavailable" }; }
  if (raw === null) return { drafts: [], status: "ok" };
  const parsed = parseRecoverable(raw);
  if (!parsed) return { drafts: [], status: "corrupt" };
  const drafts = parsed.filter((draft) => draft.expiresAt > now);
  if (drafts.length !== parsed.length) {
    try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(drafts)); } catch { return { drafts, status: "unavailable" }; }
  }
  return { drafts, status: "ok" };
}

export function saveRecoverableDraft(input: RecoverableDraft): boolean {
  let raw: string | null;
  try { raw = localStorage.getItem(RECOVERY_KEY); } catch { return false; }
  const current = raw === null ? [] : parseRecoverable(raw);
  if (!current) return false;
  const next = current.filter((draft) =>
    !(draft.kind === input.kind && draft.identity === input.identity && draft.id === input.id));
  next.push(input);
  try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(next)); return true; } catch { return false; }
}

export function removeRecoverableDraft(kind: RecoverableDraft["kind"], identity: string, id: string): boolean {
  let raw: string | null;
  try { raw = localStorage.getItem(RECOVERY_KEY); } catch { return false; }
  if (raw === null) return true;
  const current = parseRecoverable(raw);
  if (!current) return false;
  const next = current.filter((draft) => !(draft.kind === kind && draft.identity === identity && draft.id === id));
  try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(next)); return true; } catch { return false; }
}

export function clearRecoverableDrafts(): boolean {
  try { localStorage.removeItem(RECOVERY_KEY); return true; } catch { return false; }
}

export function resetStorage(now: number): { data: Data; status: StorageStatus } {
  const data = makeSeed(now);
  try { localStorage.removeItem(RECOVERY_KEY); localStorage.removeItem(KEY); } catch { return { data, status: "unavailable" }; }
  return { data, status: save(data) ? "ok" : "unavailable" };
}
