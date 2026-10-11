import { ALLERGENS, type Cook, type Offer } from "./types";

export const ms = (d: string, t: string) => (d && t ? Date.parse(d + "T" + t + ":00Z") : NaN);
export const pickupStartMs = (o: Offer) => ms(o.pickupDate, o.pickupStart);
export const pickupEndMs = (o: Offer) => ms(o.pickupDate, o.pickupEnd);
export const deadlineMs = (o: Offer) => ms(o.deadlineDate, o.deadlineTime);

export type Availability = "live" | "draft" | "closed" | "expired" | "ineligible" | "moderated" | "consent-withdrawn";
/** Shared discovery/contact predicate; withdrawal hides the offer immediately. */
export function availability(o: Offer, cooks: Cook[], now: number): Availability {
  if (o.status === "draft") return "draft";
  if (o.status === "closed") return "closed";
  const cook = cooks.find((c) => c.id === o.cookId);
  if (!cook || cook.status !== "approved") return "ineligible";
  if (o.moderated) return "moderated";
  if (o.contactConsent !== true) return "consent-withdrawn";
  const dl = deadlineMs(o);
  if (!(now < dl)) return "expired";
  return "live";
}
export const isLive = (o: Offer, cooks: Cook[], now: number) => availability(o, cooks, now) === "live";
export const canDiscloseContact = (o: Offer, cooks: Cook[], now: number, signedIn: boolean, neighborConsent: boolean) =>
  o.contactConsent === true && signedIn && neighborConsent && isLive(o, cooks, now);
export const PREPARATION_VERSION = "same-day-v1" as const;
export const PREPARATION_STATEMENT = "I will prepare this meal on the day of pickup and will not freeze the completed meal.";
export const CUSTOMER_REMINDER = "If you have arranged meals with neighbors outside the app, tell them directly about material changes, closure, reopening or contact withdrawal. No customer records or notifications are kept here.";
export function usdMinorUnits(price: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(price.trim())) return null;
  const [whole, fraction = ""] = price.trim().split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
export const validAllergens = (o: Offer) => ALLERGENS.every((a) =>
  Object.prototype.hasOwnProperty.call(o.allergens ?? {}, a) && ["unknown", "present", "absent"].includes(o.allergens[a]));

export function validatePublish(o: Offer, cook: Cook | undefined, now: number, allowWithdrawn = false): string[] {
  const e: string[] = [];
  if (!cook || cook.status !== "approved") e.push("Your cook eligibility is not approved, so publishing is blocked.");
  if (o.moderated) e.push("This offer is suspended by the simulated operator. Publication and reopening are blocked until it is restored.");
  if (!o.title.trim()) e.push("Add a meal name.");
  if (!o.description.trim()) e.push("Add a description.");
  if (usdMinorUnits(o.price) === null) e.push("Enter a USD price greater than 0 with at most two decimal places (for example, 12.50).");
  if (!validAllergens(o)) e.push("Declare all nine major allergens as unknown, present or absent.");
  if (o.otherAllergens !== undefined && typeof o.otherAllergens !== "string") e.push("Other allergen disclosures must be text.");
  if (!o.cuisine.trim()) e.push("Add a cuisine.");
  if (!o.portion.trim()) e.push("Describe the portion size.");
  if (!o.ingredients.some((i) => i.name.trim())) e.push("List at least one ingredient (sourcing and organic status may be unknown).");
  if (!o.handling.trim()) e.push("Add food-specific handling instructions.");
  if (o.crossContact === "known" && !o.crossContactNote.trim()) e.push("Describe the known kitchen cross-contact.");
  if (!allowWithdrawn && o.contactConsent !== true) e.push("Consent to showing the fictional phone contact route.");
  const s = pickupStartMs(o), en = pickupEndMs(o), dl = deadlineMs(o);
  if (!o.pickupDate || Number.isNaN(Date.parse(o.pickupDate + "T00:00:00Z"))) e.push("Pickup date is missing or invalid.");
  else if (Number.isNaN(s) || Number.isNaN(en)) e.push("Pickup start and end times are required.");
  else if (!(en > s)) e.push("Pickup end must be after pickup start on the same date.");
  if (!o.deadlineDate || !o.deadlineTime || Number.isNaN(dl)) e.push("Ordering deadline is missing. Choose both a date and a time.");
  else {
    if (!(dl > now)) e.push("Ordering deadline is in the past. It must be later than the current demo time (UTC).");
    if (!Number.isNaN(s) && dl > s) e.push("Ordering deadline is after pickup start. It must be no later than pickup start.");
  }
  const confirmation = o.preparationConfirmation;
  if (!o.commitment || !confirmation || confirmation.statementVersion !== PREPARATION_VERSION ||
      confirmation.pickupDate !== o.pickupDate || confirmation.offerVersion !== o.version ||
      !Number.isFinite(Date.parse(confirmation.confirmedAt)) || Date.parse(confirmation.confirmedAt) > now)
    e.push("Confirm the same-day preparation statement again for this publication or reopening.");
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
export const money = (p: string) => { const cents = usdMinorUnits(p); return cents === null ? "$—" : "$" + (cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2)); };
export const cookName = (cooks: Cook[], id: string) => cooks.find((c) => c.id === id)?.name ?? "Unknown cook";
/** Missing historical times stay unknown: known publications first, then stable IDs. */
export const sortOffers = (a: Offer, b: Offer) => {
  const pickup = pickupStartMs(a) - pickupStartMs(b);
  if (pickup) return pickup;
  const aTime = a.publishedAt === undefined ? NaN : Date.parse(a.publishedAt);
  const bTime = b.publishedAt === undefined ? NaN : Date.parse(b.publishedAt);
  const aKnown = Number.isFinite(aTime), bKnown = Number.isFinite(bTime);
  return (aKnown && bKnown ? bTime - aTime : Number(bKnown) - Number(aKnown)) || a.id.localeCompare(b.id);
};
export const emptyAllergens = () => Object.fromEntries(ALLERGENS.map((a) => [a, "unknown"])) as Offer["allergens"];
export function blankOffer(now: number): Offer {
  return { id: "o_" + now.toString(36), cookId: "me", title: "", description: "", price: "", cuisine: "", portion: "", ingredients: [{ name: "", source: "", organic: "unknown" }], allergens: emptyAllergens(), crossContact: "unknown", crossContactNote: "", condition: "Chilled", handling: "", tags: [], pickupDate: "", pickupStart: "17:00", pickupEnd: "19:00", deadlineDate: "", deadlineTime: "", commitment: false, contactConsent: false, status: "draft", moderated: false, version: 0, updatedAt: new Date(now).toISOString(), art: "peach" };
}
export const ingredientLine = (i: { name: string; source: string; organic: string }) => i.name + " — source: " + (i.source.trim() || "unknown") + "; organic status: " + i.organic;
