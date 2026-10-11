import { ALLERGENS, type Cook, type Ingredient, type Offer } from "./types";
import { isLive, weekdayOf } from "./domain";

export interface Chip { id: string; kind: "tag" | "cuisine" | "weekday" | "date" | "budget" | "avoid" | "keyword"; value: string; label: string }
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const AVOID: [string, string[]][] = [
  ["peanuts?", ["Peanuts"]], ["tree[ -]nuts?", ["Tree nuts"]],
  ["nuts?", ["Peanuts", "Tree nuts"]], ["milk|dairy", ["Milk"]],
  ["eggs?", ["Egg"]], ["fish", ["Fish"]],
  ["(?:crustacean[ -])?shellfish|crustaceans?", ["Crustacean shellfish"]],
  ["wheat|gluten", ["Wheat"]], ["soy(?:beans?)?", ["Soybeans"]], ["sesame", ["Sesame"]],
];
const ALLERGEN_PATTERN = AVOID.map(([pattern]) => pattern).join("|");
let n = 0;
const chip = (kind: Chip["kind"], value: string, label: string): Chip => ({ id: "c" + n++, kind, value, label });

export interface FindResult { chips: Chip[]; issues: string[] }

/** Scripted, deliberately bounded grammar. Unconsumed text blocks suggestions. Not AI. */
export function parseFind(text: string, offers: Offer[]): FindResult {
  let rest = text.toLowerCase().replace(/[–—]/g, "-");
  const out: Chip[] = [];
  const issues: string[] = [];
  const add = (kind: Chip["kind"], value: string, label: string) => {
    if (!out.some((c) => c.kind === kind && c.value === value)) out.push(chip(kind, value, label));
  };
  const consume = (re: RegExp, use: (m: RegExpExecArray) => void) => {
    rest = rest.replace(re, (...args) => {
      const m = args.slice(0, -2) as unknown as RegExpExecArray;
      use(m);
      return " ";
    });
  };
  const avoid = (names: string) => {
    for (const m of names.matchAll(new RegExp("\\b(?:" + ALLERGEN_PATTERN + ")\\b", "g"))) {
      const entry = AVOID.find(([pattern]) => new RegExp("^(?:" + pattern + ")$").test(m[0]));
      entry?.[1].forEach((a) => add("avoid", a, "Avoid " + a + " (declared present)"));
    }
  };
  // Consume exclusions before positive dish words; never interpret "no peanuts" as "mentions peanuts".
  const list = "(?:" + ALLERGEN_PATTERN + ")(?:\\s*(?:,\\s*(?:and\\s+)?|and\\s+|&\\s*)(?:" + ALLERGEN_PATTERN + "))*";
  consume(new RegExp("\\b(?:no|without|allergic to|avoid(?:ing)?|free (?:of|from))\\s+(" + list + ")\\b", "g"), (m) => avoid(m[1]));
  consume(new RegExp("\\b(" + ALLERGEN_PATTERN + ")[ -]free\\b", "g"), (m) => {
    avoid(m[1]);
    if (m[1] === "dairy") add("tag", "Dairy-free", "Dairy-free");
    if (m[1] === "gluten") add("tag", "Gluten-aware", "Gluten-aware");
  });
  consume(/\b\d{4}-\d{1,2}-\d{1,2}\b/g, (m) => {
    const date = m[0];
    const ms = Date.parse(date + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== date) {
      issues.push("Invalid date “" + date + "”. Use a valid YYYY-MM-DD pickup date.");
    } else add("date", date, "Pickup " + date);
  });
  consume(/\b(?:under|below|less than|max(?:imum)?|around|up to)\s*\$?(\d+(?:\.\d+)?)|\$\s*(\d+(?:\.\d+)?)/g, (m) => {
    const value = m[1] ?? m[2];
    if (!Number.isFinite(Number(value))) issues.push("Budget is not a finite number.");
    else add("budget", value, "Up to $" + value);
  });
  for (const tag of ["Vegetarian", "Vegan", "Dairy-free", "Gluten-aware"]) {
    consume(new RegExp("\\b" + tag.toLowerCase() + "\\b", "g"), () => add("tag", tag, tag));
  }
  consume(/\bgluten\b/g, () => add("tag", "Gluten-aware", "Gluten-aware"));
  DAYS.forEach((d, i) => consume(new RegExp("\\b" + d.slice(0, 3) + "(?:" + d.slice(3) + ")?\\b", "g"), () => add("weekday", String(i), "Pickup " + d[0].toUpperCase() + d.slice(1))));
  const cuisines = [...new Set(offers.map((o) => o.cuisine).filter(Boolean))];
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  cuisines.forEach((c) => consume(new RegExp("\\b" + escape(c.toLowerCase()) + "\\b", "g"), () => add("cuisine", c, c)));
  // A shortened cuisine is supported only when it names exactly one fixture cuisine.
  for (const prefix of new Set(cuisines.map((c) => c.toLowerCase().split(/[ -]/)[0]))) {
    consume(new RegExp("\\b" + escape(prefix) + "\\b", "g"), () => {
      const options = cuisines.filter((c) => c.toLowerCase().split(/[ -]/)[0] === prefix);
      if (options.length === 1) add("cuisine", options[0], options[0]);
      else issues.push("Ambiguous cuisine “" + prefix + "”. Please use its full name.");
    });
  }
  // Only these conversational words carry no filter meaning. Negations, alternatives,
  // locations, relative dates, times, and unsupported dietary needs are NOT discarded.
  rest = rest.replace(/\b(?:a|an|the|i|me|my|please|find|show|want|would|like|looking|look|hoping|to|for|on|at|and|with|of|some|something|meal|meals|dinner|lunch|pickup)\b/g, " ");
  const words = new Set(offers.flatMap((o) => (o.title + " " + o.description).toLowerCase().match(/[a-z]{4,}/g) ?? []));
  // Do not let a fixture word accidentally consume unsupported grammar.
  const reserved = /^(?:no|not|without|avoid|avoiding|allergic|free|from|or|except|only|before|after|between|today|tomorrow|next|under|below|max|around|less|than|up)$/;
  rest = rest.replace(/\b[a-z]{4,}\b/g, (w) => {
    if (!reserved.test(w) && words.has(w)) { add("keyword", w, "Mentions “" + w + "”"); return " "; }
    return w;
  });
  const unresolved = rest.replace(/[,.;!?…]/g, " ").replace(/\s+/g, " ").trim();
  if (unresolved) issues.push("Unsupported or ambiguous wording: “" + unresolved + "”. Rephrase using dietary tags, major-allergen exclusions, a weekday or YYYY-MM-DD date, a maximum USD budget, cuisine or dish words.");
  if (!out.length && !issues.length) issues.push("No supported preferences found. Please add a constraint or use the ordinary filters.");
  return { chips: out, issues };
}
export const keywordChip = (w: string) => chip("keyword", w.toLowerCase(), "Mentions “" + w + "”");

export interface Match { offer: Offer; unknownAvoid: string[] }
export function matchOffers({ chips, issues }: FindResult, offers: Offer[], cooks: Cook[], now: number): Match[] {
  if (issues.length || !chips.length) return [];
  const res: Match[] = [];
  for (const o of offers) {
    if (!isLive(o, cooks, now)) continue;
    const cookN = cooks.find((c) => c.id === o.cookId)?.name ?? "";
    const hay = (o.title + " " + o.description + " " + cookN).toLowerCase();
    const ok = chips.every((c) => c.kind === "tag" ? o.tags.includes(c.value) : c.kind === "cuisine" ? o.cuisine === c.value : c.kind === "weekday" ? weekdayOf(o.pickupDate) === Number(c.value) : c.kind === "date" ? o.pickupDate === c.value : c.kind === "budget" ? o.price.trim() !== "" && Number.isFinite(Number(o.price)) && Number(o.price) <= Number(c.value) : c.kind === "avoid" ? ALLERGENS.some((a) => a === c.value) && o.allergens[c.value] !== "present" : c.kind === "keyword" ? hay.includes(c.value) : false);
    if (ok) res.push({ offer: o, unknownAvoid: chips.filter((c) => c.kind === "avoid" && o.allergens[c.value] !== "absent").map((c) => c.value) });
  }
  return res;
}

export interface OfferDraftResult { draft: Partial<Offer>; known: string[]; missing: string[] }
export function parseOffer(text: string): OfferDraftResult {
  const raw = text.trim();
  // Blank out the editor's convenience schedule defaults: the helper has no
  // authority to choose pickup or ordering times on the cook's behalf.
  const draft: Partial<Offer> = {
    pickupDate: "", pickupStart: "", pickupEnd: "", deadlineDate: "", deadlineTime: "",
  };
  const known: string[] = [];
  if (raw) {
    const head = raw.split(/ with |[,.;\n]/i)[0].trim();
    if (head) { draft.title = head[0].toUpperCase() + head.slice(1); known.push("Meal name: " + draft.title); }
    const w = raw.match(/ with ([^.;\n]+)/i);
    if (w) {
      // Do not absorb adjacent price, portion, condition or schedule details into
      // the ingredient list. They are parsed independently (or left missing).
      const detailStart = /(?:,\s*(?=(?:for\s+)?\$\s*\d|\b(?:one|two|three|\d+)\s+(?:[a-z0-9-]+\s+){0,2}(?:jar|bowl|pie|pies|slice|slices|box|container|loaf|portion)s?\b|\b(?:hot|chilled|cold)\b|\b(?:pickup|deadline|ordering deadline)\b))|\s+for\s+\$\s*\d/i;
      const detailIndex = w[1].search(detailStart);
      const ingredientText = detailIndex < 0 ? w[1] : w[1].slice(0, detailIndex);
      const names = ingredientText.split(/,| and /i).map((s) => s.trim()).filter(Boolean);
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
