import assert from "node:assert/strict";
import test from "node:test";
import { createUnsavedChangeRegistry, protectUnsavedNavigation } from "./leaveProtection";

test("independent form guards combine, and unregistering one preserves the others", () => {
  const registry = createUnsavedChangeRegistry();
  let firstDirty = false;
  let secondDirty = false;
  const unregisterFirst = registry.register(() => firstDirty);
  const unregisterSecond = registry.register(() => secondDirty);
  assert.equal(registry.shouldWarn(), false);
  firstDirty = true;
  assert.equal(registry.shouldWarn(), true);
  firstDirty = false;
  secondDirty = true;
  unregisterFirst();
  assert.equal(registry.shouldWarn(), true);
  unregisterSecond();
  assert.equal(registry.shouldWarn(), false);
});

function browser() {
  const events = new EventTarget();
  const entries = [{ state: { nk: { key: 1 } } as Record<string, unknown>, url: "https://demo.test/" }];
  let cursor = 0;
  let dirty = false;
  let discard = false;
  let prompts = 0;
  let rendered = 0;
  let pending: (() => void) | null = null;
  const w = Object.assign(events, {
    location: { href: entries[0].url },
  });
  const h = {
    get state() { return entries[cursor].state; },
    replaceState(state: Record<string, unknown>, _title: string, url: string) {
      entries[cursor] = { state, url }; w.location.href = url;
      events.dispatchEvent(new Event("replaceState"));
    },
    pushState(state: Record<string, unknown>, _title: string, url: string) {
      entries.splice(++cursor, entries.length, { state, url }); w.location.href = url;
      events.dispatchEvent(new Event("pushState"));
    },
    go(delta: number) {
      cursor += delta;
      w.location.href = entries[cursor].url;
      events.dispatchEvent(Object.assign(new Event("popstate"), { state: h.state }));
    },
  };
  const originals = ["window", "history"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  Object.defineProperty(globalThis, "window", { configurable: true, value: w });
  Object.defineProperty(globalThis, "history", { configurable: true, value: h });
  const guard = protectUnsavedNavigation(() => dirty, (leave) => {
    prompts++;
    pending = leave;
    if (discard) { pending = null; leave(); }
  });
  // Simulate the router listener, registered after the capture guard.
  events.addEventListener("popstate", () => { rendered++; });
  return {
    guard, h, w,
    dirty: (v: boolean) => { dirty = v; },
    discard: (v: boolean) => { discard = v; },
    push: (url: string) => h.pushState({ nkIndex: guard.nextIndex(), nk: { key: 2 } }, "", url),
    prompts: () => prompts,
    rendered: () => rendered,
    stay: () => { pending = null; },
    accept: () => { const leave = pending; pending = null; leave?.(); },
    restore: () => {
      guard.dispose();
      for (const [key, descriptor] of originals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

test("clean navigation is silent; dirty navigation explicitly offers discard or stay", () => {
  const b = browser();
  try {
    let departures = 0;
    b.guard.requestLeave(() => departures++);
    assert.equal(b.prompts(), 0);
    assert.equal(departures, 1);
    b.dirty(true);
    b.guard.requestLeave(() => departures++);
    assert.equal(departures, 1);
    b.stay();
    assert.equal(departures, 1);
    b.guard.requestLeave(() => departures++);
    b.accept();
    assert.equal(departures, 2);
    assert.equal(b.prompts(), 2);
  } finally { b.restore(); }
});

test("cancelled Back preserves the current entry, URL, form render and Forward history", () => {
  const b = browser();
  try {
    b.push("https://demo.test/cook-application");
    b.push("https://demo.test/offers/new");
    b.dirty(true);
    b.h.go(-1);
    b.stay();
    b.h.go(-1);
    b.stay();
    assert.equal(b.w.location.href, "https://demo.test/offers/new");
    assert.equal(b.guard.currentIndex(), 2);
    assert.equal(b.rendered(), 0);
    assert.equal(b.prompts(), 2);
    b.discard(true);
    b.h.go(-1);
    assert.equal(b.w.location.href, "https://demo.test/cook-application");
    assert.equal(b.rendered(), 1);
    b.dirty(false);
    b.h.go(1);
    assert.equal(b.w.location.href, "https://demo.test/offers/new");
    assert.equal(b.rendered(), 2);
    assert.equal(b.prompts(), 3);
  } finally { b.restore(); }
});

test("cancelled multi-entry traversals and Forward return to the same editor", () => {
  const b = browser();
  try {
    b.push("https://demo.test/my-cooking");
    b.push("https://demo.test/offers/new");
    b.dirty(true);
    b.h.go(-2);
    assert.equal(b.w.location.href, "https://demo.test/offers/new");
    b.dirty(false);
    b.h.go(-1);
    b.dirty(true);
    b.h.go(1);
    assert.equal(b.w.location.href, "https://demo.test/my-cooking");
    assert.equal(b.guard.currentIndex(), 1);
    assert.equal(b.rendered(), 1);
  } finally { b.restore(); }
});

test("reload/close warns only for unsaved work, and disposal removes protection", () => {
  const b = browser();
  try {
    const unload = () => {
      const event = new Event("beforeunload", { cancelable: true });
      b.w.dispatchEvent(event);
      return event.defaultPrevented;
    };
    assert.equal(unload(), false);
    b.dirty(true);
    assert.equal(unload(), true);
    b.dirty(false);
    assert.equal(unload(), false);
    b.dirty(true);
    b.guard.dispose();
    assert.equal(unload(), false);
    assert.equal(b.prompts(), 0);
  } finally { b.restore(); }
});

test("older unindexed history entries retain the editor without guessing direction", () => {
  const b = browser();
  try {
    b.h.replaceState({ legacy: true }, "", b.w.location.href);
    b.push("https://demo.test/offers/new");
    b.dirty(true);
    b.h.go(-1);
    assert.equal(b.w.location.href, "https://demo.test/offers/new");
    assert.equal(b.h.state.nkIndex, 1);
    assert.deepEqual(b.h.state.nk, { key: 2 });
    assert.equal(b.rendered(), 0);
  } finally { b.restore(); }
});
