import { ALLERGENS, type Cook, type Ingredient, type Offer } from "./types";
import { isLive, weekdayOf } from "./domain";

export interface Chip { id: string; kind: "tag" | "cuisine" | "weekday" | "budget" | "avoid" | "keyword"; value: string; label: string }
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const AVOID: [RegExp, string][] = [[/peanut/, "Peanuts"], [/tree nut|\bnuts?\b/, "Tree nuts"], [/milk|dairy/, "Milk"], [/\beggs?\b/, "Egg"], [/\bfish\b/, "Fish"], [/shellfish|crustacean/, "Crustacean shellfish"], [/wheat|gluten/, "Wheat"], [/\bsoy/, "Soybeans"], [/sesame/, "Sesame"]];
let n = 0;
const chip = (kind: Chip["kind"], value: string, label: string): Chip => ({ id: "c" + n++, kind, value, label });

/** Scripted keyword parser. Not AI. */
export function parseFind(text: string, offers: Offer[]): Chip[] {
  const t = text.toLowerCase();
  const out: Chip[] = [];
  if (/vegetarian/.test(t)) out.push(chip("tag", "Vegetarian", "Vegetarian"));
  if (/\bvegan/.test(t)) out.push(chip("tag", "Vegan", "Vegan"));
  if (/dairy[- ]free/.test(t)) out.push(chip("tag", "Dairy-free", "Dairy-free"));
  if (/gluten/.test(t) && !/(no|without|allergic to|avoid)\s+gluten/.test(t)) out.push(chip("tag", "Gluten-aware", "Gluten-aware"));
  DAYS.forEach((d, i) => { if (new RegExp("\\b" + d.slice(0, 3) + "(" + d.slice(3) + ")?\\b").test(t)) out.push(chip("weekday", String(i), "Pickup " + d[0].toUpperCase() + d.slice(1))); });
  const b = t.match(/(?:under|below|less than|max|around|up to|\$)\s*\$?(\d+(?:\.\d+)?)/);
  if (b) out.push(chip("budget", b[1], "Up to $" + b[1]));
  for (const m of t.matchAll(/(?:\bno|without|allergic to|avoid|free of)\s+([a-z ]+?)(?=$|[,.;]| and | but | with )/g)) {
    const w = m[1];
    for (const [re, a] of AVOID) if (re.test(w) && !out.some((c) => c.kind === "avoid" && c.value === a)) out.push(chip("avoid", a, "Avoid " + a + " (declared present)"));
  }
  const cuisines = [...new Set(offers.map((o) => o.cuisine).filter(Boolean))];
  cuisines.forEach((c) => { if (t.includes(c.toLowerCase().split(/[ -]/)[0])) out.push(chip("cuisine", c, c)); });
  const words = new Set(offers.flatMap((o) => (o.title + " " + o.description).toLowerCase().match(/[a-z]{4,}/g) ?? []));
  const stop = new Set(["under", "below", "meal", "dinner", "lunch", "something", "with", "that", "have", "want", "thursday", "friday", "saturday", "sunday", "monday", "tuesday", "wednesday", "around", "vegetarian", "vegan", "gluten", "free"]);
  [...new Set(t.match(/[a-z]{4,}/g) ?? [])].forEach((w) => { if (words.has(w) && !stop.has(w)) out.push(chip("keyword", w, "Mentions “" + w + "”")); });
  return out;
}
export const keywordChip = (w: string) => chip("keyword", w.toLowerCase(), "Mentions “" + w + "”");

export interface Match { offer: Offer; unknownAvoid: string[] }
export function matchOffers(chips: Chip[], offers: Offer[], cooks: Cook[], now: number): Match[] {
  const res: Match[] = [];
  for (const o of offers) {
    if (!isLive(o, cooks, now)) continue;
    const cookN = cooks.find((c) => c.id === o.cookId)?.name ?? "";
    const hay = (o.title + " " + o.description + " " + cookN).toLowerCase();
    const ok = chips.every((c) => c.kind === "tag" ? o.tags.includes(c.value) : c.kind === "cuisine" ? o.cuisine === c.value : c.kind === "weekday" ? weekdayOf(o.pickupDate) === Number(c.value) : c.kind === "budget" ? Number(o.price) <= Number(c.value) : c.kind === "avoid" ? o.allergens[c.value] !== "present" : hay.includes(c.value));
    if (ok) res.push({ offer: o, unknownAvoid: chips.filter((c) => c.kind === "avoid" && o.allergens[c.value] === "unknown").map((c) => c.value) });
  }
  return res;
}

export interface OfferDraftResult { draft: Partial<Offer>; known: string[]; missing: string[] }
export function parseOffer(text: string): OfferDraftResult {
  const raw = text.trim();
  const draft: Partial<Offer> = {};
  const known: string[] = [];
  if (raw) {
    const head = raw.split(/ with |[,.;\n]/i)[0].trim();
    if (head) { draft.title = head[0].toUpperCase() + head.slice(1); known.push("Meal name: " + draft.title); }
    const w = raw.match(/ with ([^.;\n]+)/i);
    if (w) {
      const names = w[1].split(/,| and /i).map((s) => s.trim()).filter(Boolean);
      if (names.length) { draft.ingredients = names.map((name): Ingredient => ({ name, source: "", organic: "unknown" })); known.push("Ingredients named: " + names.join(", ") + " (sourcing and organic status unknown)"); }
    }
    const p = raw.match(/\$\s?(\d+(?:\.\d{1,2})?)/);
    if (p) { draft.price = p[1]; known.push("Price: $" + p[1]); }
    const por = raw.match(/\b((?:one|two|three|\d+)\s+(?:[a-z0-9-]+\s+){0,2}(?:jar|bowl|pie|pies|slice|slices|box|container|loaf|portion)s?)\b/i);
    if (por) { draft.portion = por[1]; known.push("Portion: " + por[1]); }
    if (/\bhot\b/i.test(raw)) { draft.condition = "Hot"; known.push("Pickup condition: hot"); }
    else if (/chilled|cold/i.test(raw)) { draft.condition = "Chilled"; known.push("Pickup condition: chilled"); }
  }
  const missing: string[] = [];
  if (!draft.title) missing.push("What is the meal called?");
  if (!draft.ingredients) missing.push("Which ingredients are in it, and where do they come from?");
  missing.push("Organic status for each ingredient (unknown is fine, but say so)");
  missing.push("Each of the nine major allergens: present, not present, or unknown");
  missing.push("Kitchen cross-contact, or that it is unknown");
  if (!draft.portion) missing.push("What does one portion look like?");
  if (!draft.price) missing.push("Price per portion in USD");
  missing.push("Pickup date, start and end time (UTC)");
  missing.push("A separate ordering deadline, no later than pickup start");
  missing.push("Phone-route consent and the same-day preparation commitment");
  return { draft, known, missing };
}
export const ALLERGEN_LIST = ALLERGENS;
