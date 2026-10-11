import type { Page } from "@playwright/test";
import { test, expect, start, firstCutoff, lastCutoff, firstTitle, lastTitle } from "./discovery-clock.fixture";

async function expectSwitched(page: Page) {
  await expect(page.getByTestId("button-featured")).toContainText(lastTitle);
  await expect(page.getByTestId("button-featured")).not.toContainText(firstTitle);
  await expect(page.getByTestId("card-offer-clock-first")).toHaveCount(0);
  await expect(page.getByTestId("card-offer-clock-sibling")).toHaveCount(0);
  await expect(page.getByTestId("card-offer-clock-last")).toBeVisible();
  await expect(page.getByTestId("text-count")).toHaveText("1 fictional offer");
  await expect(page.getByTestId("button-browse")).toHaveText("Browse 1 sample meal");
}

async function expectCleared(page: Page) {
  await expect(page.getByTestId("button-featured")).toHaveCount(0);
  await expect(page.getByText("No current offers. Cooks can publish one from My cooking.")).toBeVisible();
  await expect(page.locator('[data-testid^="card-offer-"]')).toHaveCount(0);
  await expect(page.getByTestId("text-count")).toHaveText("0 fictional offers");
  await expect(page.getByTestId("button-browse")).toHaveText("Browse 0 sample meals");
  await expect(page.getByTestId("empty-matches")).toContainText("There are no current offers.");
}

test("the next-deadline timer removes simultaneous expiries, switches the feature, then rearms and clears it", async ({ discovery: page }) => {
  // Stop one millisecond before cutoff: positive controls prevent a vacuous pass.
  await page.clock.runFor(firstCutoff - start - 350 - 1);
  await expect(page.getByTestId("button-featured")).toContainText(firstTitle);
  await expect(page.getByTestId("text-count")).toHaveText("3 fictional offers");
  // The existing timer has a 50ms scheduling cushion. This must refresh long
  // before the 15s interval; removing the precise timer must fail this check.
  await page.clock.runFor(51);
  await expectSwitched(page);

  await page.clock.runFor(lastCutoff - firstCutoff - 51);
  await expect(page.getByTestId("button-featured")).toContainText(lastTitle);
  await expect(page.getByTestId("card-offer-clock-last")).toBeVisible();
  // The most recent interval was at 12:00:55; the next is 12:01:10.
  // Only the rearmed next-deadline timer can expire the last meal here.
  await page.clock.runFor(51);
  await expectCleared(page);
});

test("an open filtered list loses expired cards without clearing the neighbor's search", async ({ discovery: page }) => {
  await page.getByTestId("input-search").fill(firstTitle);
  await expect(page.getByTestId("text-count")).toHaveText("1 fictional offer");
  await expect(page.getByTestId("card-offer-clock-first")).toBeVisible();
  await page.clock.runFor(firstCutoff - start - 350 + 50);
  await expect(page.getByTestId("input-search")).toHaveValue(firstTitle);
  await expect(page.getByTestId("button-featured")).toContainText(lastTitle);
  await expect(page.locator('[data-testid^="card-offer-"]')).toHaveCount(0);
  await expect(page.getByTestId("text-count")).toHaveText("0 fictional offers");
  await expect(page.getByTestId("empty-matches")).toContainText("Try a different pickup date or clear a filter.");
  await expect(page.getByTestId("button-browse")).toHaveText("Browse 1 sample meal");
});

async function setVisibility(page: Page, state: "hidden" | "visible", dispatch = true) {
  // Simulate the browser lifecycle signal explicitly; headless tab activation
  // does not reliably change visibilityState. No application hooks are mocked.
  await page.evaluate(({ state, dispatch }) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
    if (dispatch) document.dispatchEvent(new Event("visibilitychange"));
  }, { state, dispatch });
}

for (const signal of ["visibilitychange", "focus"] as const) {
  test(`${signal} refreshes a resumed browse page at exact cutoff with overdue timers still paused`, async ({ discovery: page }) => {
    await setVisibility(page, "hidden");
    // Move wall time without running any scheduled callbacks. This models
    // throttled background timers and isolates the event refresh from polling.
    await page.clock.setSystemTime(firstCutoff);
    await setVisibility(page, "hidden");
    await expect(page.getByTestId("button-featured")).toContainText(firstTitle);
    await expect(page.getByTestId("text-count")).toHaveText("3 fictional offers");

    const resume = async () => {
      await setVisibility(page, "visible", signal === "visibilitychange");
      if (signal === "focus") await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    };
    await resume();
    await expectSwitched(page);
    await setVisibility(page, "hidden");
    await page.clock.setSystemTime(lastCutoff);
    await expect(page.getByTestId("button-featured")).toContainText(lastTitle);
    await resume();
    await expectCleared(page);
  });
}
