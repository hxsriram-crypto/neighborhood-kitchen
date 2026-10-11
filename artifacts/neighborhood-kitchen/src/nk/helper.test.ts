import assert from "node:assert/strict";
import test from "node:test";
import { deadlineMs } from "./domain";
import { matchOffers, parseFind } from "./helper";
import { makeSeed } from "./seed";
import type { Offer } from "./types";

const now = Date.parse("2026-10-10T12:00:00Z");
const data = makeSeed(now);
const base = data.offers.find((o) => o.id === "flatbread")!;
const fixture = (id: string, changes: Partial<Offer> = {}): Offer => ({
  ...base, id, title: "Vegetarian peanut bowl", description: "Fictional meal with peanuts",
  tags: ["Vegetarian"], price: "11", pickupDate: "2026-10-18",
  allergens: { ...base.allergens, Peanuts: "absent" }, ...changes,
});
const offers = [
  fixture("absent"),
  fixture("present", { allergens: { ...base.allergens, Peanuts: "present" } }),
  fixture("unknown", { allergens: { ...base.allergens, Peanuts: "unknown" } }),
  fixture("over-budget", { price: "13" }),
  fixture("wrong-date", { pickupDate: "2026-10-19" }),
  fixture("wrong-tag", { tags: ["Vegan"] }),
];
const values = (text: string, kind: string) => parseFind(text, offers).chips.filter((c) => c.kind === kind).map((c) => c.value);
const matches = (text: string, source = offers, clock = now) => matchOffers(parseFind(text, source), source, data.cooks, clock);

test("combined vegetarian, peanut-free, budget and explicit date constraints survive", () => {
  const request = "vegetarian peanut-free under $12 on 2026-10-18";
  assert.deepEqual(parseFind(request, offers).issues, []);
  assert.deepEqual(values(request, "tag"), ["Vegetarian"]);
  assert.deepEqual(values(request, "avoid"), ["Peanuts"]);
  assert.deepEqual(values(request, "budget"), ["12"]);
  assert.deepEqual(values(request, "date"), ["2026-10-18"]);
  assert.deepEqual(matches(request).map((m) => m.offer.id), ["absent", "unknown"]);
});

test("common exclusion phrases never match declared-present allergens", () => {
  for (const phrase of ["no peanuts", "without peanuts", "allergic to peanuts", "avoid peanuts",
    "avoiding peanuts", "free of peanuts", "free from peanuts", "peanut-free", "peanut free", "peanuts-free"]) {
    assert.deepEqual(parseFind(phrase, offers).issues, [], phrase);
    assert.deepEqual(values(phrase, "avoid"), ["Peanuts"], phrase);
    assert.ok(matches(phrase).every((m) => m.offer.allergens.Peanuts !== "present"), phrase);
    assert.equal(values(phrase, "keyword").length, 0, phrase);
  }
});

test("multiple exclusions and broad nut avoidance preserve every allergen", () => {
  assert.deepEqual(values("no peanuts and milk, eggs", "avoid"), ["Peanuts", "Milk", "Egg"]);
  assert.deepEqual(values("without peanuts, milk and soy", "avoid"), ["Peanuts", "Milk", "Soybeans"]);
  assert.deepEqual(values("nut-free", "avoid"), ["Peanuts", "Tree nuts"]);
  for (const [phrase, allergen] of [
    ["dairy-free", "Milk"], ["egg-free", "Egg"], ["fish-free", "Fish"],
    ["shellfish-free", "Crustacean shellfish"], ["tree nut-free", "Tree nuts"],
    ["wheat-free", "Wheat"], ["soy-free", "Soybeans"], ["sesame-free", "Sesame"],
  ]) {
    const source = [fixture("excluded", { allergens: { ...base.allergens, [allergen]: "present" } })];
    assert.deepEqual(parseFind(phrase, source).issues, [], phrase);
    assert.deepEqual(values(phrase, "avoid"), [allergen], phrase);
    assert.deepEqual(matches(phrase, source), [], phrase);
  }
});

test("unknown declarations are included with explicit warning metadata, never rewritten", () => {
  const results = matches("no peanuts");
  assert.deepEqual(results.find((m) => m.offer.id === "unknown")?.unknownAvoid, ["Peanuts"]);
  assert.deepEqual(results.find((m) => m.offer.id === "absent")?.unknownAvoid, []);
  assert.equal(offers.find((o) => o.id === "unknown")?.allergens.Peanuts, "unknown");
  const missing = fixture("missing", { allergens: {} });
  assert.deepEqual(matches("no peanuts", [missing])[0]?.unknownAvoid, ["Peanuts"]);
});

test("ISO dates are exact, invalid and ambiguous dates block suggestions", () => {
  assert.ok(matches("on 2026-10-18").every((m) => m.offer.pickupDate === "2026-10-18"));
  for (const text of ["vegetarian on 2026-02-30", "on 2026-13-01", "on 2026-1-2",
    "vegetarian on 10/18", "vegetarian tomorrow", "vegetarian on October 18"]) {
    assert.ok(parseFind(text, offers).issues.length, text);
    assert.deepEqual(matches(text), [], text);
  }
  assert.deepEqual(matches("on 2026-10-18 and 2026-10-19"), []);
  assert.deepEqual(matches("on Monday 2026-10-18"), []);
});

test("unknown and partially supported requests cannot become unrestricted or relaxed searches", () => {
  for (const text of ["", "hello", "please find a meal", "vegetarian kosher", "vegetarian without coconut",
    "vegetarian low sodium", "vegetarian organic", "vegetarian or vegan", "not vegetarian",
    "vegetarian after 6pm", "vegetarian under $12 near me", "no peanuts or milk",
    "vegetarian at least $12", "vegetarian before 2026-10-18", "vegetarian no spicy food"]) {
    assert.ok(parseFind(text, offers).issues.length, text);
    assert.deepEqual(matches(text), [], text);
  }
  const partial = parseFind("vegetarian without coconut", offers);
  assert.deepEqual(partial.chips.map((c) => c.value), ["Vegetarian"]);
  assert.deepEqual(matchOffers({ ...partial, chips: [] }, offers, data.cooks, now), []);
  assert.deepEqual(matchOffers({ chips: [], issues: [] }, offers, data.cooks, now), []);
});

test("weekday, cuisine, dish words, tags and all budgets are conjunctive", () => {
  assert.deepEqual(parseFind("A vegetarian dinner for Thursday, under $15, no peanuts…", offers).issues, []);
  assert.deepEqual(values("gluten-aware", "tag"), ["Gluten-aware"]);
  assert.deepEqual(values("gluten-free", "tag"), ["Gluten-aware"]);
  assert.deepEqual(values("dairy-free", "tag"), ["Dairy-free"]);
  assert.deepEqual(values("no gluten", "avoid"), ["Wheat"]);
  assert.deepEqual(values("gluten-free", "avoid"), ["Wheat"]);
  assert.deepEqual(values("Mediterranean bowl", "cuisine"), ["Mediterranean"]);
  assert.ok(matches("Mediterranean bowl under $12 up to $10").length === 0);
  assert.ok(matches("Vegetarian bowl").length > 0);
  assert.deepEqual(values("vegan", "tag"), ["Vegan"]);
});

test("availability rules and cutoff equality remain enforced", () => {
  const source = [
    fixture("live"), fixture("closed", { status: "closed" }), fixture("draft", { status: "draft" }),
    fixture("moderated", { moderated: true }), fixture("no-consent", { contactConsent: false }),
  ];
  assert.deepEqual(matches("vegetarian", source).map((m) => m.offer.id), ["live"]);
  assert.deepEqual(matches("vegetarian", source, deadlineMs(source[0])), []);
  const cooks = data.cooks.map((c) => ({ ...c, status: "suspended" as const }));
  assert.deepEqual(matchOffers(parseFind("vegetarian", source), source, cooks, now), []);
});
