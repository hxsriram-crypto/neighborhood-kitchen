import { test as base, expect, type Page } from "@playwright/test";
import { makeSeed } from "../../src/nk/seed";

export const start = Date.parse("2030-06-10T11:59:55Z");
export const firstCutoff = Date.parse("2030-06-10T12:00:00Z");
export const lastCutoff = Date.parse("2030-06-10T12:01:00Z");
export const firstTitle = "Fictional early soup";
export const lastTitle = "Fictional later soup";
const storageKey = "neighborhood-kitchen-prototype-v1";
const data = makeSeed(start);
const soup = data.offers.find((offer) => offer.id === "soup")!;
const meal = {
  ...soup, pickupDate: "2030-06-11", pickupEnd: "20:00",
  deadlineDate: "2030-06-10", deadlineTime: "12:00",
};
// Deliberately unordered; all pickups remain tomorrow when today's contact
// cutoffs pass. Expected results are not computed with the predicate under test.
data.offers = [
  { ...meal, id: "clock-last", title: lastTitle, pickupStart: "19:00", deadlineTime: "12:01" },
  { ...meal, id: "clock-sibling", title: "Fictional same-cutoff soup", pickupStart: "18:00" },
  { ...meal, id: "clock-first", title: firstTitle, pickupStart: "17:00" },
  { ...meal, id: "clock-expired", title: "Fictional previously expired soup", deadlineTime: "11:59" },
];
data.reports = [];
data.audit = [];
const snapshot = JSON.stringify(data);

export const test = base.extend<{ discovery: Page }>({
  discovery: async ({ page, context, baseURL }, use) => {
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
      if (url.origin === "https://fonts.googleapis.com" && url.pathname === "/css2" && request.method() === "GET") {
        await route.fulfill({ status: 200, contentType: "text/css", body: "" });
        return;
      }
      if (url.origin !== origin || /\/api(?:\/|$)/.test(url.pathname) || request.method() !== "GET") {
        forbidden.push(`${request.method()} ${url.origin}${url.pathname}`);
        await route.abort();
      } else await route.continue();
    });
    await page.clock.install({ time: start });
    await page.clock.pauseAt(start);
    await context.addInitScript(({ key, value, allowedOrigin }) => {
      if (location.origin === allowedOrigin && localStorage.getItem(key) === null) {
        localStorage.setItem(key, value);
      }
    }, { key: storageKey, value: snapshot, allowedOrigin: origin });
    await page.goto(baseURL!);
    await page.clock.runFor(350); // Finish Discover's intentional loading state.
    await expect(page.getByTestId("text-count")).toHaveText("3 fictional offers");
    await expect(page.getByTestId("button-featured")).toContainText(firstTitle);
    for (const id of ["clock-first", "clock-sibling", "clock-last"]) {
      await expect(page.getByTestId(`card-offer-${id}`)).toBeVisible();
    }
    await expect(page.getByTestId("card-offer-clock-expired")).toHaveCount(0);
    try {
      await use(page);
    } finally {
      expect(forbidden, "Clock refreshes must not call services or enable contact").toEqual([]);
      expect(errors, "Browse clock changes must not produce browser errors").toEqual([]);
      expect(await page.evaluate((key) => localStorage.getItem(key), storageKey),
        "Expiry changes visibility, not stored fictional meals or consent").toBe(snapshot);
      await expect(page).toHaveURL(baseURL!);
    }
  },
});

export { expect };
