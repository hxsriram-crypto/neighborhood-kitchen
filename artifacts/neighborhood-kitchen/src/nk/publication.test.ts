import assert from "node:assert/strict";
import test from "node:test";
import { ALLERGENS, type AllergenDecl } from "./types";
import { availability, canDiscloseContact, CUSTOMER_REMINDER, deadlineMs, money, PREPARATION_VERSION, usdMinorUnits, validatePublish } from "./domain";
import { prepareOfferSave, publicationMessage, reviseOffer, withdrawOfferConsent } from "./publication";
import { makeSeed } from "./seed";
import { load, save } from "./storage";

const now = Date.parse("2026-10-10T12:00:00Z");
const data = makeSeed(now);
const offer = data.offers.find((o) => o.id === "flatbread")!;
const cook = data.cooks.find((c) => c.id === offer.cookId)!;

test("current cook and neighbor consent gate every contact disclosure", () => {
  assert.equal(canDiscloseContact(offer, data.cooks, now, true, true), true);
  assert.equal(canDiscloseContact(offer, data.cooks, now, false, true), false);
  assert.equal(canDiscloseContact(offer, data.cooks, now, true, false), false);
  const withdrawn = withdrawOfferConsent(offer, now + 1);
  assert.equal(availability(withdrawn, data.cooks, now + 1), "consent-withdrawn");
  assert.equal(canDiscloseContact(withdrawn, data.cooks, now + 1, true, true), false);
  assert.equal(withdrawn.status, "published");
  assert.equal(withdrawn.revisions?.[0].contactConsent, true);
  assert.equal(offer.contactConsent, true);
  for (const unavailable of [{ ...offer, status: "closed" as const }, { ...offer, moderated: true }]) {
    assert.equal(canDiscloseContact(unavailable, data.cooks, now, true, true), false);
  }
  assert.equal(canDiscloseContact(offer, data.cooks, deadlineMs(offer), true, true), false);
  const suspended = data.cooks.map((c) => c.id === cook.id ? { ...c, status: "suspended" as const } : c);
  assert.equal(canDiscloseContact(offer, suspended, now, true, true), false);
});

test("all nine declaration keys and only supported values are required", () => {
  assert.ok(validatePublish({ ...offer, allergens: {} }, cook, now).some((e) => e.includes("nine")));
  for (const allergen of ALLERGENS) {
    const missing = { ...offer.allergens };
    delete missing[allergen];
    assert.ok(validatePublish({ ...offer, allergens: missing }, cook, now).some((e) => e.includes("nine")));
    for (const value of ["unknown", "present", "absent"] as AllergenDecl[]) {
      assert.deepEqual(validatePublish({ ...offer, allergens: { ...offer.allergens, [allergen]: value } }, cook, now), []);
    }
    for (const invalid of ["safe", "", null, false, undefined]) {
      assert.ok(validatePublish({ ...offer, allergens: { ...offer.allergens, [allergen]: invalid as AllergenDecl } }, cook, now).some((e) => e.includes("nine")));
    }
  }
});

test("USD precision is rejected rather than rounded or accepting scientific notation", () => {
  for (const price of ["12", "12.3", "12.30", "0.01", " 7.50 "]) {
    assert.notEqual(usdMinorUnits(price), null);
    assert.deepEqual(validatePublish({ ...offer, price }, cook, now), []);
  }
  for (const price of ["12.345", "0", "-1", "NaN", "Infinity", "1e2", "0x10", "", ".50", "1.", "9007199254740992"]) {
    assert.equal(usdMinorUnits(price), null);
    assert.ok(validatePublish({ ...offer, price }, cook, now).some((e) => e.includes("USD price")));
    assert.equal(money(price), "$—");
  }
  assert.equal(usdMinorUnits("12.30"), 1230);
  assert.equal(money("12.30"), "$12.30");
});

test("every publication, published edit and reopening requires explicit fresh confirmation", () => {
  for (const previous of [undefined, { ...offer, status: "draft" as const }, offer, { ...offer, status: "closed" as const }]) {
    const denied = prepareOfferSave(offer, previous, cook, now + 10, false);
    assert.equal(denied.offer, undefined);
    assert.ok(denied.errors.some((e) => e.includes("Confirm")));
    const accepted = prepareOfferSave(offer, previous, cook, now + 10, true);
    assert.deepEqual(accepted.errors, []);
    assert.deepEqual(accepted.offer?.preparationConfirmation, {
      statementVersion: PREPARATION_VERSION, confirmedAt: new Date(now + 10).toISOString(),
      pickupDate: offer.pickupDate, offerVersion: accepted.offer?.version,
    });
  }
  for (const changed of [
    { ...offer, preparationConfirmation: undefined },
    { ...offer, pickupDate: "2026-10-20" },
    { ...offer, version: offer.version + 1 },
    { ...offer, preparationConfirmation: { ...offer.preparationConfirmation!, statementVersion: "old" as typeof PREPARATION_VERSION } },
  ]) assert.ok(validatePublish(changed, cook, now).some((e) => e.includes("Confirm")));
  assert.deepEqual(prepareOfferSave({ ...offer, status: "draft" }, undefined, cook, now, false).errors, []);
});

test("moderation rejects publication and reopening, including a stale editor", () => {
  const moderated = { ...offer, moderated: true };
  assert.ok(validatePublish(moderated, cook, now).some((e) => e.includes("suspended")));
  for (const status of ["draft", "closed", "published"] as const) {
    const result = prepareOfferSave({ ...offer, moderated: false }, { ...moderated, status }, cook, now + 1, true);
    assert.equal(result.offer, undefined);
    assert.ok(result.errors.some((e) => e.includes("suspended")));
  }
  assert.equal(availability(moderated, data.cooks, now), "moderated");
});

test("restoring consent cannot bypass publication checks or reopen a closed offer implicitly", () => {
  const withdrawn = withdrawOfferConsent(offer, now + 1);
  const restored = prepareOfferSave({ ...withdrawn, contactConsent: true }, withdrawn, cook, now + 2, true).offer!;
  assert.equal(availability(restored, data.cooks, now + 2), "live");
  const closed = reviseOffer(withdrawn, { ...withdrawn, status: "closed" }, now + 3);
  const stillClosed = prepareOfferSave({ ...closed, contactConsent: true }, closed, cook, now + 4, false).offer!;
  assert.equal(availability(stillClosed, data.cooks, now + 4), "closed");
  const rejected = prepareOfferSave({ ...closed, status: "published" }, closed, cook, now + 4, true);
  assert.ok(rejected.errors.some((e) => e.includes("Consent")));
});

test("offer snapshots preserve disclosures, confirmations and revisions independently", () => {
  const edited = prepareOfferSave({ ...offer, otherAllergens: "Mustard; celery", price: "8.50" }, offer, cook, now + 1, true).offer!;
  const closed = reviseOffer(edited, { ...edited, status: "closed" }, now + 2);
  assert.equal(closed.revisions?.length, 2);
  assert.equal(closed.revisions?.[0].price, "8");
  assert.equal(closed.revisions?.[1].otherAllergens, "Mustard; celery");
  edited.ingredients[0].name = "changed after snapshot";
  assert.equal(closed.revisions?.[1].ingredients[0].name, "Wheat flour");
  assert.equal(closed.revisions?.[1].preparationConfirmation?.confirmedAt, new Date(now + 1).toISOString());
  assert.ok(closed.revisions?.every((r) => !("revisions" in r) && !("customers" in r) && !("orders" in r)));
  assert.equal(closed.updatedAt, new Date(now + 2).toISOString());
  assert.ok(publicationMessage("Reopened.").includes(CUSTOMER_REMINDER));
});

test("new disclosures, withdrawn consent and prior revisions survive browser-local reload", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  const edited = prepareOfferSave({ ...offer, otherAllergens: "Mustard" }, offer, cook, now + 1, true).offer!;
  const withdrawn = withdrawOfferConsent(edited, now + 2);
  assert.equal(save({ ...data, offers: [withdrawn] }), true);
  const reloaded = load(now + 3).data.offers[0];
  assert.equal(reloaded.otherAllergens, "Mustard");
  assert.equal(reloaded.contactConsent, false);
  assert.equal(reloaded.revisions?.length, 2);
  assert.equal(reloaded.preparationConfirmation?.statementVersion, PREPARATION_VERSION);
  assert.equal(canDiscloseContact(reloaded, data.cooks, now + 3, true, true), false);
  for (const malformed of [
    { ...withdrawn, revisions: {} },
    { ...withdrawn, otherAllergens: ["not text"] },
    { ...withdrawn, preparationConfirmation: {} },
  ]) {
    values.set("neighborhood-kitchen-prototype-v1", JSON.stringify({ ...data, offers: [malformed] }));
    assert.equal(load(now + 3).status, "corrupt");
  }
  const legacy = { ...offer };
  delete legacy.otherAllergens;
  delete legacy.preparationConfirmation;
  delete legacy.revisions;
  values.set("neighborhood-kitchen-prototype-v1", JSON.stringify({ ...data, offers: [legacy] }));
  const legacyLoad = load(now + 3);
  assert.equal(legacyLoad.status, "ok");
  assert.equal(legacyLoad.data.offers[0].preparationConfirmation, undefined);
});
