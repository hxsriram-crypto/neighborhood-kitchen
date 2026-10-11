import type { Page } from "@playwright/test";
import {
  test, expect, mealId, mealTitle, cookName, mealPath, cookPath, unavailable,
} from "./navigation.fixture";

async function expectPath(page: Page, baseURL: string, path: string) {
  await expect(page).toHaveURL(new URL(path, baseURL).href);
}

async function expectDiscover(page: Page, baseURL: string) {
  await expectPath(page, baseURL, "");
  await expect(page.getByRole("heading", { name: "Upcoming home-cooked meals" })).toBeVisible();
  await expect(page.getByTestId(`card-offer-${mealId}`)).toBeVisible();
  await expect(page.getByTestId("text-offer-title")).toHaveCount(0);
}

async function expectMeal(page: Page, baseURL: string) {
  await expectPath(page, baseURL, mealPath);
  await expect(page.getByTestId("text-offer-title")).toHaveText(mealTitle);
  // Positive control: prior simulated consent reveals a live meal's inert route.
  await expect(page.getByTestId("panel-contact")).toBeVisible();
  await expect(page.getByTestId("check-contact-consent")).toBeChecked();
}

async function expectCook(page: Page, baseURL: string) {
  await expectPath(page, baseURL, cookPath);
  await expect(page.getByTestId("text-cook-name")).toHaveText(cookName);
  await expect(page.getByTestId(`card-offer-${mealId}`)).toBeVisible();
  await expect(page.getByTestId("text-offer-title")).toHaveCount(0);
}

test("Discover → meal → cook profile survives real Back/Forward and reload", async ({ navigation: page, baseURL }) => {
  await page.goto(baseURL!);
  await expectDiscover(page, baseURL!);
  // Clicking the current tab must not insert an invisible extra history step.
  await page.getByTestId("nav-Browse meals").click();
  await page.getByTestId(`button-view-${mealId}`).click();
  await expectMeal(page, baseURL!);
  await page.getByTestId("link-cook-profile").click();
  await expectCook(page, baseURL!);
  await page.reload();
  await expectCook(page, baseURL!);
  await page.goBack();
  await expectMeal(page, baseURL!);
  await page.reload();
  await expectMeal(page, baseURL!);
  await page.goBack();
  await expectDiscover(page, baseURL!);
  await page.goForward();
  await expectMeal(page, baseURL!);
  await page.goForward();
  await expectCook(page, baseURL!);
});

test("a fresh direct encoded meal link reloads and navigates within its artifact base", async ({ navigation: page, baseURL }) => {
  await page.goto(new URL(mealPath, baseURL!).href);
  await expectMeal(page, baseURL!);
  await page.reload();
  await expectMeal(page, baseURL!);
  await page.getByTestId("button-back").click();
  await expectDiscover(page, baseURL!);
  await page.goBack();
  await expectMeal(page, baseURL!);
  await page.goForward();
  await expectDiscover(page, baseURL!);
});

for (const { id, status, reason } of unavailable) {
  test(`direct and reloaded ${id} blocks contact despite prior neighbor consent`, async ({ navigation: page, baseURL }) => {
    const path = `meals/${id}`;
    await page.goto(new URL(path, baseURL!).href);
    const assertUnavailable = async () => {
      await expectPath(page, baseURL!, path);
      await expect(page.getByTestId("text-offer-title")).toHaveText(`Fictional unavailable meal: ${id}`);
      await expect(page.getByTestId(status)).toBeVisible();
      await expect(page.getByTestId("button-contact-disabled")).toBeDisabled();
      await expect(page.getByTestId("button-contact-disabled")).toContainText(reason);
      await expect(page.getByTestId("panel-contact")).toHaveCount(0);
      await expect(page.getByText("Phone · (555) 010-0194", { exact: true })).toHaveCount(0);
      await expect(page.getByTestId("check-contact-consent")).toHaveCount(0);
    };
    await assertUnavailable();
    await page.reload();
    await assertUnavailable();
    await page.getByTestId("button-back").click();
    await expectDiscover(page, baseURL!);
    await expect(page.getByTestId(`card-offer-${id}`)).toHaveCount(0);
    await page.goBack();
    await assertUnavailable();
  });
}

for (const id of ["fictional-does-not-exist", "fictional-private-draft"]) {
  test(`missing or private meal ${id} stays unavailable on reload and history traversal`, async ({ navigation: page, baseURL }) => {
    const path = `meals/${id}`;
    const assertMissing = async () => {
      await expectPath(page, baseURL!, path);
      await expect(page.getByText("This offer could not be found.", { exact: true })).toBeVisible();
      await expect(page.getByTestId("text-offer-title")).toHaveCount(0);
      await expect(page.getByTestId("panel-contact")).toHaveCount(0);
      await expect(page.getByTestId("link-cook-profile")).toHaveCount(0);
    };
    await page.goto(new URL(path, baseURL!).href);
    await assertMissing();
    await page.reload();
    await assertMissing();
    await page.getByRole("button", { name: "Back to Discover", exact: true }).click();
    await expectDiscover(page, baseURL!);
    await page.goBack();
    await assertMissing();
    await page.goForward();
    await expectDiscover(page, baseURL!);
  });
}

for (const path of ["meals/"]) {
  test(`absent meal ID renders not-found without crashing: ${path}`, async ({ navigation: page, baseURL }) => {
    await page.goto(baseURL!);
    await expectDiscover(page, baseURL!);
    await page.goto(new URL(path, baseURL!).href);
    await expectPath(page, baseURL!, path);
    await expect(page.getByRole("heading", { name: "404 Page Not Found" })).toBeVisible();
    await expect(page.getByTestId("panel-contact")).toHaveCount(0);
    await page.reload();
    await expectPath(page, baseURL!, path);
    await expect(page.getByRole("heading", { name: "404 Page Not Found" })).toBeVisible();
    await page.goBack();
    await expectDiscover(page, baseURL!);
    await page.goForward();
    await expectPath(page, baseURL!, path);
    await expect(page.getByRole("heading", { name: "404 Page Not Found" })).toBeVisible();
  });
}
