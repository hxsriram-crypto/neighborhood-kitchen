import assert from "node:assert/strict";
import test from "node:test";
import { makeSeed } from "./seed";
import {
  clearRecoverableDrafts, loadRecoverableDrafts, RECOVERY_RETENTION_MS,
  removeRecoverableDraft, resetStorage, saveRecoverableDraft, type RecoverableDraft,
} from "./storage";

const RECOVERY_KEY = "neighborhood-kitchen-recoverable-drafts-v1";

function withStorage(run: (values: Map<string, string>) => void) {
  const values = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  try { run(values); } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
}

function offerDraft(id: string, savedAt: number): RecoverableDraft {
  const offer = structuredClone(makeSeed(savedAt).offers.find((item) => item.id === "squash")!);
  offer.id = id;
  offer.cookId = "me";
  offer.commitment = false;
  offer.preparationConfirmation = undefined;
  offer.revisions = undefined;
  return { kind: "offer", identity: "me", id, savedAt, expiresAt: savedAt + RECOVERY_RETENTION_MS, value: offer };
}

test("recovery records are separate and keyed by draft type, simulated identity, and meal ID", () => {
  withStorage((values) => {
    const now = Date.parse("2030-06-10T12:00:00Z");
    const application = makeSeed(now).applications.me;
    const appDraft: RecoverableDraft = {
      kind: "application", identity: "me", id: "me", savedAt: now,
      expiresAt: now + RECOVERY_RETENTION_MS,
      value: { ...application, submittedAt: undefined },
    };
    assert.equal(saveRecoverableDraft(offerDraft("meal-one", now)), true);
    assert.equal(saveRecoverableDraft(offerDraft("meal-two", now)), true);
    assert.equal(saveRecoverableDraft(appDraft), true);
    assert.equal(values.has("neighborhood-kitchen-prototype-v1"), false);
    assert.equal(JSON.parse(values.get(RECOVERY_KEY)!).length, 3);
    assert.deepEqual(loadRecoverableDrafts(now).drafts.map(({ kind, identity, id }) => [kind, identity, id]), [
      ["offer", "me", "meal-one"], ["offer", "me", "meal-two"], ["application", "me", "me"],
    ]);
    assert.equal(removeRecoverableDraft("offer", "me", "meal-one"), true);
    assert.deepEqual(loadRecoverableDrafts(now).drafts.map(({ id }) => id), ["meal-two", "me"]);
  });
});

test("expired recovery copies are removed, while corrupt data is never silently overwritten", () => {
  withStorage((values) => {
    assert.equal(saveRecoverableDraft(offerDraft("expired-meal", 10)), true);
    assert.deepEqual(loadRecoverableDrafts(10 + RECOVERY_RETENTION_MS).drafts, []);
    assert.equal(JSON.parse(values.get(RECOVERY_KEY)!).length, 0);
    values.set(RECOVERY_KEY, "{broken");
    assert.equal(loadRecoverableDrafts(20).status, "corrupt");
    assert.equal(saveRecoverableDraft(offerDraft("other-meal", 20)), false);
    assert.equal(clearRecoverableDrafts(), true);
    assert.deepEqual(loadRecoverableDrafts(20), { drafts: [], status: "ok" });
  });
});

test("browser storage access failures are reported instead of falling back silently", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get: () => { throw new Error("blocked"); } });
  try {
    assert.deepEqual(loadRecoverableDrafts(0), { drafts: [], status: "unavailable" });
    assert.equal(saveRecoverableDraft(offerDraft("meal", 0)), false);
    assert.equal(removeRecoverableDraft("offer", "me", "meal"), false);
    assert.equal(clearRecoverableDrafts(), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

test("sample reset removes every recoverable copy along with prototype data", () => {
  withStorage((values) => {
    assert.equal(saveRecoverableDraft(offerDraft("meal-to-reset", 10)), true);
    assert.equal(values.has(RECOVERY_KEY), true);
    assert.equal(resetStorage(20).status, "ok");
    assert.deepEqual(loadRecoverableDrafts(20), { drafts: [], status: "ok" });
    assert.equal(values.has("neighborhood-kitchen-prototype-v1"), true);
  });
});
