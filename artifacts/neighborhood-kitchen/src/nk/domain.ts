import { ALLERGENS, type Cook, type Offer } from "./types";

export const ms = (d: string, t: string) => (d && t ? Date.parse(d + "T" + t + ":00Z") : NaN);
export const pickupStartMs = (o: Offer) => ms(o.pickupDate, o.pickupStart);
export const pickupEndMs = (o: Offer) => ms(o.pickupDate, o.pickupEnd);
export const deadlineMs = (o: Offer) => ms(o.deadlineDate, o.deadlineTime);

export type Availability = "live" | "draft" | "closed" | "expired" | "ineligible" | "moderated";
/** Shared predicate: published + not moderated + cook eligible + now < deadline (equality = expired). */
export function availability(o: Offer, cooks: Cook[], now: number): Availability {
  if (o.status === "draft") return "draft";
  if (o.status === "closed") return "closed";
  const cook = cooks.find((c) => c.id === o.cookId);
  if (!cook || cook.status !== "approved") return "ineligible";
  if (o.moderated) return "moderated";
  const dl = deadlineMs(o);
  if (!(now < dl)) return "expired";
  return "live";
}
export const isLive = (o: Offer, cooks: Cook[], now: number) => availability(o, cooks, now) === "live";

export function validatePublish(o: Offer, cook: Cook | undefined, now: number): string[] {
  const e: string[] = [];
  if (!cook || cook.status !== "approved") e.push("Your cook eligibility is not approved, so publishing is blocked.");
  if (!o.title.trim()) e.push("Add a meal name.");
  if (!o.description.trim()) e.push("Add a description.");
  const price = Number(o.price);
  if (!o.price.trim() || !Number.isFinite(price) || price <= 0) e.push("Enter a price per portion greater than 0 (USD).");
  if (!o.cuisine.trim()) e.push("Add a cuisine.");
  if (!o.portion.trim()) e.push("Describe the portion size.");
  if (!o.ingredients.some((i) => i.name.trim())) e.push("List at least one ingredient (sourcing and organic status may be unknown).");
  if (!o.handling.trim()) e.push("Add food-specific handling instructions.");
  if (o.crossContact === "known" && !o.crossContactNote.trim()) e.push("Describe the known kitchen cross-contact.");
  if (!o.contactConsent) e.push("Consent to showing the fictional phone contact route.");
  const s = pickupStartMs(o), en = pickupEndMs(o), dl = deadlineMs(o);
  if (!o.pickupDate || Number.isNaN(Date.parse(o.pickupDate + "T00:00:00Z"))) e.push("Pickup date is missing or invalid.");
  else if (Number.isNaN(s) || Number.isNaN(en)) e.push("Pickup start and end times are required.");
  else if (!(en > s)) e.push("Pickup end must be after pickup start on the same date.");
  if (!o.deadlineDate || !o.deadlineTime || Number.isNaN(dl)) e.push("Ordering deadline is missing. Choose both a date and a time.");
  else {
    if (!(dl > now)) e.push("Ordering deadline is in the past. It must be later than the current demo time (UTC).");
    if (!Number.isNaN(s) && dl > s) e.push("Ordering deadline is after pickup start. It must be no later than pickup start.");
  }
  if (!o.commitment) e.push("Confirm the same-day preparation commitment (unchecked until you confirm it).");
  return e;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const dayOf = (d: string) => new Date(d + "T00:00:00Z");
export const weekdayOf = (d: string) => dayOf(d).getUTCDay();
export const fmtDay = (d: string) => (d && !Number.isNaN(dayOf(d).getTime()) ? dayOf(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }) : "Date not set");
export const fmtLong = (d: string) => (d && !Number.isNaN(dayOf(d).getTime()) ? dayOf(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "date not set");
export function fmtTime(t: string) {
  if (!t) return "time not set";
  const [h, m] = t.split(":").map(Number);
  return ((h + 11) % 12 + 1) + ":" + pad(m) + (h >= 12 ? " pm" : " am");
}
export const fmtWindow = (o: Offer) => fmtTime(o.pickupStart) + "–" + fmtTime(o.pickupEnd);
export const fmtDeadline = (o: Offer) => fmtDay(o.deadlineDate) + " · " + fmtTime(o.deadlineTime) + " UTC";
export const fmtNow = (now: number) => { const d = new Date(now); return d.toISOString().slice(0, 10) + " " + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + " UTC"; };
export const fmtStamp = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16).replace("T", " ") + " UTC"; };
export const money = (p: string) => { const n = Number(p); return Number.isFinite(n) ? "$" + (Number.isInteger(n) ? n : n.toFixed(2)) : "$—"; };
export const cookName = (cooks: Cook[], id: string) => cooks.find((c) => c.id === id)?.name ?? "Unknown cook";
export const sortOffers = (a: Offer, b: Offer) => pickupStartMs(a) - pickupStartMs(b) || b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id);
export const emptyAllergens = () => Object.fromEntries(ALLERGENS.map((a) => [a, "unknown"])) as Offer["allergens"];
export function blankOffer(now: number): Offer {
  return { id: "o_" + now.toString(36), cookId: "me", title: "", description: "", price: "", cuisine: "", portion: "", ingredients: [{ name: "", source: "", organic: "unknown" }], allergens: emptyAllergens(), crossContact: "unknown", crossContactNote: "", condition: "Chilled", handling: "", tags: [], pickupDate: "", pickupStart: "17:00", pickupEnd: "19:00", deadlineDate: "", deadlineTime: "", commitment: false, contactConsent: false, status: "draft", moderated: false, version: 0, updatedAt: new Date(now).toISOString(), art: "peach" };
}
export const ingredientLine = (i: { name: string; source: string; organic: string }) => i.name + " — source: " + (i.source.trim() || "unknown") + "; organic status: " + i.organic;
