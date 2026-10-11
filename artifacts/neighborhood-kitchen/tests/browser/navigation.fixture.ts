import { test as base, expect, type Page } from "@playwright/test";
import { makeSeed } from "../../src/nk/seed";
import type { Offer } from "../../src/nk/types";

const clock = Date.parse("2030-06-10T12:00:00Z");
const storageKey = "neighborhood-kitchen-prototype-v1";
// Escaped characters deliberately exercise the raw-path/double-decode boundary.
export const mealId = "fictional meal / 50%";
export const cookId = "fictional cook / 50%";
export const mealTitle = "Fictional navigation soup";
export const cookName = "Fictional Navigation Cook";
export const mealPath = `meals/${encodeURIComponent(mealId)}`;
export const cookPath = `cooks/${encodeURIComponent(cookId)}`;
export const missingCookId = "fictional missing cook / 50%";
export const missingCookPath = `cooks/${encodeURIComponent(missingCookId)}`;

const data = makeSeed(clock);
data.signedIn = true;
data.phoneConsent = true; // Previously recorded simulated neighbor consent.
data.operator = false;
data.cooks = data.cooks.map((entry) => entry.id === "me" ? { ...entry, status: "draft" } : entry);
const cook = data.cooks.find((entry) => entry.id === "mara")!;
data.cooks = [
  ...data.cooks.filter((entry) => entry.id === "me"),
  { ...cook, id: cookId, name: cookName },
  { ...cook, id: "fictional-ineligible", name: "Fictional Suspended Cook", status: "suspended" },
];
const soup = data.offers.find((entry) => entry.id === "soup")!;
const editorDraft = data.offers.find((entry) => entry.id === "squash")!;
const meal: Offer = { ...soup, id: mealId, cookId, title: mealTitle };
export const unavailable = [
  { id: "fictional-closed", status: "status-closed", reason: "offer closed", patch: { status: "closed" } },
  { id: "fictional-expired", status: "status-expired", reason: "deadline passed",
    patch: { deadlineDate: "2030-06-09", deadlineTime: "18:00" } },
  { id: "fictional-withdrawn", status: "status-consent-withdrawn", reason: "cook consent withdrawn",
    patch: { contactConsent: false } },
  { id: "fictional-moderated", status: "status-ineligible", reason: "offer suspended",
    patch: { moderated: true } },
  { id: "fictional-ineligible", status: "status-ineligible", reason: "eligibility suspended",
    patch: { cookId: "fictional-ineligible" } },
] satisfies { id: string; status: string; reason: string; patch: Partial<Offer> }[];
data.offers = [
  meal,
  editorDraft,
  ...unavailable.map(({ id, patch }) => ({ ...meal, ...patch, id, title: `Fictional unavailable meal: ${id}` })),
  { ...meal, id: "fictional-private-draft", status: "draft" },
];
data.reports = [];
data.audit = [];
const snapshot = JSON.stringify(data);

interface NavigationState { allowLocalStorageChanges: boolean }

export const test = base.extend<{ navigation: Page; navigationState: NavigationState }>({
  navigationState: async ({}, use) => {
    await use({ allowLocalStorageChanges: false });
  },
  navigation: async ({ page, context, baseURL, navigationState }, use) => {
    const origin = new URL(baseURL!).origin;
    const forbidden: string[] = [];
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      // The app's static stylesheet imports Google Fonts. Supply empty CSS
      // locally, so even that presentation-only dependency never contacts a service.
      if (url.origin === "https://fonts.googleapis.com" && url.pathname === "/css2" && request.method() === "GET") {
        await route.fulfill({ status: 200, contentType: "text/css", body: "" });
        return;
      }
      const service = /\/api(?:\/|$)/.test(url.pathname);
      if (url.origin !== origin || service || request.method() !== "GET") {
        forbidden.push(`${request.method()} ${url.origin}${url.pathname}`);
        await route.abort();
      } else await route.continue();
    });
    await page.clock.setFixedTime(clock);
    // Seed once per fresh context. Unlike an init script, this does not replace
    // stored data on reload and hide persistence or rehydration regressions.
    await context.addInitScript(({ key, value, allowedOrigin }) => {
      if (location.origin === allowedOrigin && localStorage.getItem(key) === null) {
        localStorage.setItem(key, value);
      }
    }, { key: storageKey, value: snapshot, allowedOrigin: origin });
    try {
      await use(page);
    } finally {
      expect(forbidden, "No external, API, contact or write requests may occur").toEqual([]);
      expect(errors, "Navigation must not produce browser errors").toEqual([]);
      if (!navigationState.allowLocalStorageChanges) {
        expect(await page.evaluate((key) => localStorage.getItem(key), storageKey),
          "Read-only navigation must preserve all fictional records and prior consent").toBe(snapshot);
      }
      await expect(page.locator('a[href^="tel:"], a[href^="sms:"], a[href^="mailto:"]')).toHaveCount(0);
    }
  },
});

export { expect };
