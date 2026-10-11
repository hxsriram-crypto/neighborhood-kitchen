import { test as base, expect, type Page } from "@playwright/test";
import { makeSeed } from "../../src/nk/seed";

const clock = Date.parse("2030-06-10T12:00:00Z");
const storageKey = "neighborhood-kitchen-prototype-v1";
const data = makeSeed(clock);
const soup = data.offers.find((offer) => offer.id === "soup")!;
// Deliberate positive controls: all are otherwise matching fictional offers.
// Never derive expected matches from the parser/matcher under test.
data.offers = [
  { ...soup, id: "helper-unknown", title: "Fictional lentil soup",
    description: "Lentil soup", allergens: { ...soup.allergens, Peanuts: "unknown", Milk: "unknown" } },
  { ...soup, id: "helper-absent", title: "Fictional tomato soup",
    description: "Tomato soup", allergens: { ...soup.allergens, Peanuts: "absent", Milk: "absent" } },
  { ...soup, id: "helper-present", title: "Fictional peanut bowl",
    description: "Peanut bowl", allergens: { ...soup.allergens, Peanuts: "present", Milk: "present" } },
];
const snapshot = JSON.stringify(data);
const allResults = ["result-helper-unknown", "result-helper-absent", "result-helper-present"];

const test = base.extend<{ helper: Page }>({
  helper: async ({ page, context, baseURL }, use) => {
    const origin = new URL(baseURL!).origin;
    const forbidden: string[] = [];
    // Only app assets may load. No API/AI, external service, write, or contact request
    // can succeed even if a later implementation accidentally introduces one.
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const service = /\/api(?:\/|$)/.test(url.pathname);
      if (service || request.method() !== "GET") {
        forbidden.push(`${request.method()} ${url.pathname}`);
      }
      if (url.origin !== origin || service || request.method() !== "GET") await route.abort();
      else await route.continue();
    });
    await page.clock.setFixedTime(clock);
    await context.addInitScript(({ key, value }) => {
      localStorage.clear();
      localStorage.setItem(key, value);
    }, { key: storageKey, value: snapshot });
    await page.goto("assistant");
    await expect(page.getByTestId("input-assistant")).toBeVisible();
    await assertBoundaries(page);
    await use(page);
    await assertBoundaries(page);
    expect(forbidden, "The scripted helper must not call a service or perform a write").toEqual([]);
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey),
      "Searching, chip edits, mode changes and fallback must not mutate fictional records").toBe(snapshot);
  },
});

const results = (page: Page) => page.locator('[data-testid^="result-"]');
const chips = (page: Page) => page.locator('button[data-testid^="chip-"]');

async function assertBoundaries(page: Page) {
  await expect(page.getByText("No allergy-safe claims, availability guarantees or medical advice.", { exact: true })).toBeVisible();
  await expect(page.getByText("No publishing, messaging, contact or other write action.", { exact: true })).toBeVisible();
  await expect(page.getByText(/It cannot publish, contact a cook, approve anyone or establish availability/)).toBeVisible();
  await expect(page.getByTestId("banner-prototype")).toContainText("No real ordering, payment, calls or messages.");
  await expect(page.locator('a[href^="tel:"], a[href^="sms:"], a[href^="mailto:"]')).toHaveCount(0);
}

async function run(page: Page, request: string) {
  await page.getByTestId("input-assistant").fill(request);
  await page.getByTestId("button-run-helper").click();
}

async function addKeyword(page: Page, keyword: string) {
  await page.getByTestId("input-add-chip").fill(keyword);
  await page.getByRole("button", { name: "Add", exact: true }).click();
}

async function expectResults(page: Page, ids: string[]) {
  await expect(results(page)).toHaveCount(ids.length);
  expect(await results(page).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-testid")))).toEqual(ids);
}

async function expectBlocked(page: Page) {
  await expect(page.getByTestId("text-helper-clarify")).toBeVisible();
  await expect(page.getByTestId("text-helper-clarify")).toContainText("Editing chips does not resolve unsupported wording.");
  await expectResults(page, []);
}

for (const request of [
  "vegetarian without coconut",
  "vegetarian kosher",
  "vegetarian or vegan",
  "vegetarian tomorrow",
]) {
  test(`unresolved wording stays blocked through keyword/chip edits: ${request}`, async ({ helper: page }) => {
    await run(page, request);
    const initialChipCount = request === "vegetarian or vegan" ? 2 : 1;
    await expect(chips(page)).toHaveCount(initialChipCount);
    await expectBlocked(page);
    const originalIssue = await page.getByTestId("text-helper-clarify").innerText();
    await addKeyword(page, "lentil"); // Would match a known positive control.
    await expect(chips(page)).toHaveCount(initialChipCount + 1);
    await expectBlocked(page);
    await page.getByRole("button", { name: "Remove Vegetarian", exact: true }).click();
    await expectBlocked(page);
    if (request === "vegetarian or vegan") {
      await page.getByRole("button", { name: "Remove Vegan", exact: true }).click();
      await expectBlocked(page);
    }
    await page.getByRole("button", { name: "Remove Mentions “lentil”", exact: true }).click();
    await expect(chips(page)).toHaveCount(0);
    await expectBlocked(page);
    await addKeyword(page, "tomato");
    await expectBlocked(page);
    await expect(page.getByTestId("text-helper-clarify")).toHaveText(originalIssue, { useInnerText: true });
    // Only a corrected request AND a fresh run can clear the issue.
    await page.getByTestId("input-assistant").fill("vegetarian");
    await expect(page.getByTestId("list-helper-results")).toHaveCount(0);
    await expectResults(page, []);
    await page.getByTestId("button-run-helper").click();
    await expect(page.getByTestId("text-helper-clarify")).toHaveCount(0);
    await expectResults(page, allResults);
  });
}

test("wholly unsupported wording cannot turn into suggestions by adding a keyword", async ({ helper: page }) => {
  await run(page, "kosher");
  await expect(chips(page)).toHaveCount(0);
  await expectBlocked(page);
  await addKeyword(page, "lentil");
  await expectBlocked(page);
});

test("supported keyword additions narrow results; removing every chip never lists every offer", async ({ helper: page }) => {
  await run(page, "vegetarian");
  await expectResults(page, allResults);
  await addKeyword(page, "lentil");
  await expectResults(page, ["result-helper-unknown"]);
  await page.getByRole("button", { name: "Remove Mentions “lentil”", exact: true }).click();
  await expectResults(page, allResults);
  await page.getByRole("button", { name: "Remove Vegetarian", exact: true }).click();
  await expect(chips(page)).toHaveCount(0);
  await expect(page.getByTestId("text-helper-empty")).toContainText("I will not recommend every offer.");
  await expectResults(page, []);
  await addKeyword(page, "tomato");
  await expectResults(page, ["result-helper-absent"]);
  await page.getByRole("button", { name: "Remove Mentions “tomato”", exact: true }).click();
  await expect(page.getByTestId("text-helper-empty")).toBeVisible();
  await expectResults(page, []);
});

test("editing before rerunning invalidates old results, including blank input", async ({ helper: page }) => {
  await run(page, "vegetarian");
  await expectResults(page, allResults);
  await page.getByTestId("input-assistant").fill("vegetarian without coconut");
  await expectResults(page, []);
  await expect(chips(page)).toHaveCount(0);
  await expect(page.getByTestId("list-helper-results")).toHaveCount(0);
  await page.getByTestId("button-run-helper").click();
  await expectBlocked(page);
  await page.getByTestId("input-assistant").fill("vegetarian");
  await expectResults(page, []);
  await page.getByTestId("button-run-helper").click();
  await expectResults(page, allResults);
  await page.getByTestId("input-assistant").fill("   ");
  await expectResults(page, []);
  await page.getByTestId("button-run-helper").click();
  await expect(page.getByTestId("text-helper-ask")).toContainText("Tell me something to look for");
  await expectResults(page, []);
});

for (const request of ["vegetarian", "vegetarian without coconut"]) {
  test(`switching modes clears search state and never restores stale suggestions: ${request}`, async ({ helper: page }) => {
    await run(page, request);
    if (request.includes("coconut")) await expectBlocked(page);
    else await expectResults(page, allResults);
    await page.getByTestId("input-add-chip").fill("unsubmitted keyword");
    await page.getByTestId("button-mode-offer").click();
    await expect(page.getByTestId("input-assistant")).toHaveValue("");
    await expect(chips(page)).toHaveCount(0);
    await expectResults(page, []);
    await expect(page.getByTestId("text-helper-clarify")).toHaveCount(0);
    await run(page, "Lentil soup with tomatoes and onion, $12");
    await expect(page.getByTestId("list-missing")).toBeVisible();
    await expect(page.getByText("Opens a draft for review.", { exact: false })).toContainText("It is not saved, published or approved by the helper");
    await expectResults(page, []);
    // Stay in the helper: do not open the editor, save, publish, or contact.
    await page.getByTestId("button-mode-find").click();
    await expect(page.getByTestId("input-assistant")).toHaveValue("");
    await expect(page.getByTestId("list-missing")).toHaveCount(0);
    await expect(page.getByTestId("list-helper-results")).toHaveCount(0);
    await expectResults(page, []);
    await run(page, request);
    await expect(page.getByTestId("input-add-chip")).toHaveValue("");
    if (request.includes("coconut")) await expectBlocked(page);
    else await expectResults(page, allResults);
  });
}

for (const state of ["matching", "blocked", "empty"] as const) {
  test(`simulated fallback hides suggestions and restores the ${state} state without relaxing it`, async ({ helper: page }) => {
    const request = state === "blocked" ? "vegetarian without coconut" : "vegetarian";
    await run(page, request);
    if (state === "empty") await page.getByRole("button", { name: "Remove Vegetarian", exact: true }).click();
    await page.getByTestId("button-toggle-down").click();
    await expect(page.getByTestId("status-helper-down")).toBeVisible();
    await expect(page.getByText("No suggestions are shown while the helper is unavailable.", { exact: true })).toBeVisible();
    await expect(page.getByTestId("input-assistant")).toHaveCount(0);
    await expectResults(page, []);
    await expect(page.getByRole("button", { name: "Open ordinary filters", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open standard editor", exact: true })).toBeVisible();
    await page.getByTestId("button-toggle-down").click();
    await expect(page.getByTestId("status-helper-down")).toHaveCount(0);
    await expect(page.getByTestId("input-assistant")).toHaveValue(request);
    if (state === "matching") await expectResults(page, allResults);
    else if (state === "blocked") {
      await expectBlocked(page);
      await addKeyword(page, "lentil");
      await expectBlocked(page);
    } else {
      await expect(chips(page)).toHaveCount(0);
      await expect(page.getByTestId("text-helper-empty")).toBeVisible();
      await expectResults(page, []);
    }
  });
}

test("unknown allergen warnings are prominent within results; absent is not unknown or allergy-safe", async ({ helper: page }) => {
  await run(page, "vegetarian no peanuts and milk");
  await expectResults(page, ["result-helper-unknown", "result-helper-absent"]);
  const card = page.getByTestId("result-helper-unknown");
  const warning = card.getByTestId("warning-unknown-helper-unknown");
  await expect(warning).toBeVisible();
  await expect(warning).toHaveText("Allergen declaration unknown: Peanuts, Milk. Confirm with the cook before deciding. This is not an allergy-safe match; unknown does not mean absent. Contact remains inert in this fictional demo.");
  const style = await warning.evaluate((element) => {
    const css = getComputedStyle(element);
    return { weight: Number(css.fontWeight), size: parseFloat(css.fontSize),
      border: parseFloat(css.borderTopWidth), background: css.backgroundColor };
  });
  // Prominence contract, without coupling the test to a particular brand hex color.
  expect(style.weight).toBeGreaterThanOrEqual(600);
  expect(style.size).toBeGreaterThanOrEqual(14);
  expect(style.border).toBeGreaterThanOrEqual(1);
  expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
  await expect(page.getByTestId("result-helper-absent").locator('[data-testid^="warning-unknown-"]')).toHaveCount(0);
  for (const id of ["helper-unknown", "helper-absent"]) {
    await expect(page.getByTestId(`result-${id}`)).toContainText("Published offer; confirm availability with the cook.");
  }
  await expect(page.getByText("Allergen chips exclude only offers that declare the allergen present. Unknown stays unknown.", { exact: true })).toBeVisible();
});
