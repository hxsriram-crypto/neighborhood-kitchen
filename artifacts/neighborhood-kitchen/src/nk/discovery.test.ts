import assert from "node:assert/strict";
import test from "node:test";
import { blankOffer, deadlineMs, fmtDeadline, isLive, sortOffers } from "./domain";
import { prepareOfferSave, reviseOffer, withdrawOfferConsent } from "./publication";
import { makeSeed } from "./seed";
import { load, save } from "./storage";
import type { Offer } from "./types";

const now = Date.parse("2026-10-10T12:00:00Z");
const data = makeSeed(now);
const sample = data.offers.find((offer) => offer.id === "flatbread")!;
const cook = data.cooks.find((c) => c.id === sample.cookId)!;
const stamp = (offset: number) => new Date(now + offset).toISOString();
const ids = (offers: Offer[]) => [...offers].sort(sortOffers).map((offer) => offer.id);

test("first successful publication sets time, not draft saves or rejected publication", () => {
  assert.equal(blankOffer(now).publishedAt, undefined);
  const draft = prepareOfferSave({ ...sample, status: "draft", publishedAt: stamp(-100) }, undefined, cook, now, false).offer!;
  assert.equal(draft.publishedAt, undefined);
  const savedDraft = prepareOfferSave(draft, draft, cook, now + 1, false).offer!;
  assert.equal(savedDraft.publishedAt, undefined);
  assert.equal(prepareOfferSave({ ...savedDraft, status: "published" }, savedDraft, cook, now + 2, false).offer, undefined);
  assert.equal(savedDraft.publishedAt, undefined);
  const published = prepareOfferSave({ ...savedDraft, status: "published", publishedAt: stamp(-100) }, savedDraft, cook, now + 3, true).offer!;
  assert.equal(published.publishedAt, stamp(3));
  assert.equal(published.revisions?.at(-1)?.publishedAt, undefined);
  assert.equal(prepareOfferSave(sample, undefined, cook, now + 4, true).offer?.publishedAt, stamp(4));
});

test("edits, closure, reopening, moderation and consent withdrawal preserve first publication", () => {
  const edited = prepareOfferSave({ ...sample, price: "9", publishedAt: stamp(999) }, sample, cook, now + 1, true).offer!;
  const closed = reviseOffer(edited, { ...edited, status: "closed", publishedAt: undefined }, now + 2);
  const reopened = prepareOfferSave({ ...closed, status: "published" }, closed, cook, now + 3, true).offer!;
  const moderated = reviseOffer(reopened, { ...reopened, moderated: true }, now + 4);
  const restored = reviseOffer(moderated, { ...moderated, moderated: false }, now + 5);
  const withdrawn = withdrawOfferConsent(restored, now + 6);
  for (const offer of [edited, closed, reopened, moderated, restored, withdrawn]) {
    assert.equal(offer.publishedAt, sample.publishedAt);
    assert.notEqual(offer.updatedAt, sample.updatedAt);
    assert.ok(offer.revisions?.every((revision) => revision.publishedAt === sample.publishedAt));
  }
});

test("browse prioritizes pickup, then newest first publication, never edits, then ID", () => {
  const older = { ...sample, id: "a", publishedAt: stamp(1), updatedAt: stamp(100) };
  const newer = { ...sample, id: "z", publishedAt: stamp(2), updatedAt: stamp(2) };
  const early = { ...older, id: "early", pickupDate: "2026-10-18" };
  assert.deepEqual(ids([older, newer, early]), ["early", "z", "a"]);
  const edited = prepareOfferSave({ ...older, price: "10" }, older, cook, now + 200, true).offer!;
  assert.deepEqual(ids([edited, newer, early]), ["early", "z", "a"]);
  assert.deepEqual(ids([{ ...newer, id: "b" }, { ...newer, id: "a" }]), ["a", "b"]);
  assert.deepEqual(ids([{ ...older, publishedAt: "2026-10-10T13:00:00+01:00" }, { ...newer, publishedAt: stamp(0) }]), ["a", "z"]);
});

test("unknown legacy publication stays unknown through edits, reopening and draft roundtrip", () => {
  const legacy = { ...sample, publishedAt: undefined };
  const edited = prepareOfferSave({ ...legacy, publishedAt: stamp(999) }, legacy, cook, now + 1, true).offer!;
  const closed = reviseOffer(edited, { ...edited, status: "closed" }, now + 2);
  const reopened = prepareOfferSave({ ...closed, status: "published" }, closed, cook, now + 3, true).offer!;
  const draft = prepareOfferSave({ ...reopened, status: "draft" }, reopened, cook, now + 4, false).offer!;
  const republished = prepareOfferSave({ ...draft, status: "published" }, draft, cook, now + 5, true).offer!;
  for (const offer of [edited, closed, reopened, draft, republished]) assert.equal(offer.publishedAt, undefined);
  const a = { ...legacy, id: "a", updatedAt: stamp(500) };
  const b = { ...legacy, id: "b", updatedAt: stamp(0) };
  assert.deepEqual(ids([b, a, { ...sample, id: "known" }]), ["known", "a", "b"]);
  assert.deepEqual(ids([a, { ...sample, id: "known" }, b]), ["known", "a", "b"]);
});

test("publication history and stable sorting survive storage reload without backfill", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  const closed = reviseOffer(sample, { ...sample, status: "closed" }, now + 1);
  const legacy = { ...sample, id: "legacy", publishedAt: undefined };
  const offers = [legacy, closed];
  assert.equal(save({ ...data, offers }), true);
  const reloaded = load(now + 2);
  assert.equal(reloaded.status, "ok");
  assert.equal(reloaded.data.offers[0].publishedAt, undefined);
  assert.equal(reloaded.data.offers[1].publishedAt, stamp(0));
  assert.equal(reloaded.data.offers[1].revisions?.[0].publishedAt, stamp(0));
  assert.deepEqual(ids(reloaded.data.offers), ids(offers));
  assert.equal(save(reloaded.data), true);
  assert.equal(load(now + 3).data.offers[0].publishedAt, undefined);
  for (const publishedAt of ["not a date", "", null, 123]) {
    values.set("neighborhood-kitchen-prototype-v1", JSON.stringify({ ...data, offers: [{ ...sample, publishedAt }] }));
    assert.equal(load(now + 4).status, "corrupt");
  }
});

test("new published samples use creation time while unpublished samples remain unstamped", () => {
  for (const offer of data.offers) {
    assert.equal(offer.publishedAt, offer.status === "published" ? stamp(0) : undefined);
  }
});

test("separate UTC cutoff formatting and featured selection expire at contact cutoff, not pickup", () => {
  assert.equal(fmtDeadline(sample), "Sun, Oct 18 · 8:00 pm UTC");
  assert.notEqual(sample.deadlineDate, sample.pickupDate);
  const cutoff = deadlineMs(sample);
  const featured = (time: number) => [sample].filter((offer) => isLive(offer, data.cooks, time)).sort(sortOffers)[0];
  assert.equal(featured(cutoff - 1)?.id, sample.id);
  assert.equal(featured(cutoff), undefined);
});
