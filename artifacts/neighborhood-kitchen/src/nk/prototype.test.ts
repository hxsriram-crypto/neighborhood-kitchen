import assert from "node:assert/strict";
import test from "node:test";
import { availability, blankOffer, deadlineMs, validatePublish } from "./domain";
import { makeSeed } from "./seed";
import { load, save } from "./storage";

const now = Date.parse("2026-10-10T12:00:00Z");
const data = makeSeed(now);
const offer = data.offers.find((o) => o.id === "flatbread")!;
const cook = data.cooks.find((c) => c.id === offer.cookId)!;

test("eligible offers disappear at the exact deadline, not at pickup", () => {
  const cutoff = deadlineMs(offer);
  assert.equal(availability(offer, data.cooks, cutoff - 1), "live");
  assert.equal(availability(offer, data.cooks, cutoff), "expired");
  assert.equal(availability(offer, data.cooks, cutoff + 1), "expired");
});

test("draft, closed, moderated and suspended cooks cannot be actionable", () => {
  assert.equal(availability({ ...offer, status: "draft" }, data.cooks, now), "draft");
  assert.equal(availability({ ...offer, status: "closed" }, data.cooks, now), "closed");
  assert.equal(availability({ ...offer, moderated: true }, data.cooks, now), "moderated");
  const cooks = data.cooks.map((c) => c.id === cook.id ? { ...c, status: "suspended" as const } : c);
  assert.equal(availability(offer, cooks, now), "ineligible");
});

test("publishing permits advance offers and deadline equal to future pickup start", () => {
  assert.deepEqual(validatePublish(offer, cook, now), []);
  assert.deepEqual(validatePublish({
    ...offer, deadlineDate: offer.pickupDate, deadlineTime: offer.pickupStart,
  }, cook, now), []);
});

test("publishing rejects missing, elapsed, or post-pickup deadlines", () => {
  assert.ok(validatePublish({ ...offer, deadlineDate: "" }, cook, now).some((e) => e.includes("missing")));
  assert.ok(validatePublish(offer, cook, deadlineMs(offer)).some((e) => e.includes("past")));
  assert.ok(validatePublish({
    ...offer, deadlineDate: offer.pickupDate, deadlineTime: "23:59",
  }, cook, now).some((e) => e.includes("after pickup")));
});

test("preparation, consent, chronology and cook approval gate publishing", () => {
  assert.ok(validatePublish({ ...offer, commitment: false }, cook, now).length);
  assert.ok(validatePublish({ ...offer, contactConsent: false }, cook, now).length);
  assert.ok(validatePublish({ ...offer, pickupEnd: offer.pickupStart }, cook, now).length);
  assert.ok(validatePublish(offer, { ...cook, status: "pending" }, now).length);
  const draft = blankOffer(now);
  assert.equal(draft.commitment, false);
  assert.equal(Object.values(draft.allergens).length, 9);
  assert.ok(Object.values(draft.allergens).every((a) => a === "unknown"));
});

test("local saves survive reload, and corrupt/unavailable storage fails explicitly", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  assert.equal(load(now).status, "ok");
  const edited = { ...data, offers: data.offers.map((o) => o.id === offer.id ? { ...o, title: "Edited fictional meal" } : o) };
  assert.equal(save(edited), true);
  assert.equal(load(now).data.offers.find((o) => o.id === offer.id)?.title, "Edited fictional meal");
  values.set("neighborhood-kitchen-prototype-v1", "{broken");
  assert.equal(load(now).status, "corrupt");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get: () => { throw new Error("blocked"); } });
  assert.equal(load(now).status, "unavailable");
  assert.equal(save(data), false);
});
