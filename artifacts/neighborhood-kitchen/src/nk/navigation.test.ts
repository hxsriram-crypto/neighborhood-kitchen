import assert from "node:assert/strict";
import test from "node:test";
import { parseScreenPath, relativeScreenPath, screenPath } from "./navigation";
import { availability, canDiscloseContact } from "./domain";
import { makeSeed } from "./seed";
import type { Screen } from "./types";

test("every screen has a reloadable route independent of history state", () => {
  const screens: Screen[] = ["Discover", "Profile", "Cook application", "My cooking", "Offer editor", "Assistant", "Operator review", "Report queue"];
  for (const screen of screens) {
    assert.equal(parseScreenPath(screenPath(screen)).screen, screen);
  }
  for (const [screen, options] of [
    ["Offer detail", { offerId: "flatbread" }],
    ["Profile", { cookId: "mara" }],
    ["Offer editor", { editorId: "flatbread" }],
    ["Assistant", { mode: "offer" }],
  ] as const) {
    assert.deepEqual(parseScreenPath(screenPath(screen, options)), { screen, ...options });
  }
});

test("meal links round-trip escaped IDs at root and nested artifact bases", () => {
  for (const base of ["", "/", "/kitchen", "/kitchen/"]) {
    for (const id of ["soup", "meal with spaces", "50% / soup?#", "literal%20", "café"]) {
      const path = screenPath("Offer detail", { offerId: id });
      const full = base.replace(/\/$/, "") + path;
      assert.deepEqual(parseScreenPath(relativeScreenPath(full, base)), { screen: "Offer detail", offerId: id });
    }
    assert.equal(relativeScreenPath(base || "/", base), "/");
  }
  assert.equal(parseScreenPath(relativeScreenPath("/kitchen-other/meals/soup", "/kitchen")).notFound, true);
});

test("unknown routes and malformed IDs fail safely, missing meal IDs stay missing", () => {
  for (const path of ["/missing", "/meals", "/meals/", "/meals/%E0%A4%A", "/meals/a/extra"]) {
    assert.equal(parseScreenPath(path).notFound, true);
  }
  assert.deepEqual(parseScreenPath("/meals/not-a-record"), { screen: "Offer detail", offerId: "not-a-record" });
  assert.deepEqual(parseScreenPath("/meals/soup/"), { screen: "Offer detail", offerId: "soup" });
});

test("deep links identify current local offers without overriding availability or contact gates", () => {
  const now = Date.parse("2026-10-11T12:00:00Z");
  const seed = makeSeed(now);
  const original = seed.offers.find((o) => o.id === "flatbread")!;
  for (const state of ["live", "expired", "closed", "consent-withdrawn", "moderated", "ineligible"] as const) {
    // Model persisted records read on reload, not cached route/contact state.
    const data = structuredClone(seed);
    const offer = data.offers.find((o) => o.id === original.id)!;
    if (state === "expired") { offer.deadlineDate = "2026-10-10"; offer.deadlineTime = "12:00"; }
    if (state === "closed") offer.status = "closed";
    if (state === "consent-withdrawn") offer.contactConsent = false;
    if (state === "moderated") offer.moderated = true;
    if (state === "ineligible") data.cooks.find((c) => c.id === offer.cookId)!.status = "suspended";
    const restored = JSON.parse(JSON.stringify(data)) as typeof data;
    const route = parseScreenPath(screenPath("Offer detail", { offerId: offer.id }));
    const current = restored.offers.find((o) => o.id === route.offerId)!;
    assert.equal(availability(current, restored.cooks, now), state);
    assert.equal(canDiscloseContact(current, restored.cooks, now, false, false), false);
    assert.equal(canDiscloseContact(current, restored.cooks, now, true, false), false);
    assert.equal(canDiscloseContact(current, restored.cooks, now, true, true), state === "live");
  }
});
