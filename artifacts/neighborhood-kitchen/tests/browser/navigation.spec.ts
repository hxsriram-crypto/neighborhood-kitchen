import type { Page } from "@playwright/test";
import {
  test, expect, mealId, mealTitle, cookName, mealPath, cookPath, missingCookPath, unavailable,
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

test("report drafts warn on navigation and Back, survive hide/reopen, and ignore untouched forms", async ({ navigation: page, baseURL }) => {
  await page.goto(new URL(mealPath, baseURL!).href);
  await page.getByTestId("button-report-offer").click();
  await page.getByTestId("button-back").click();
  await expectDiscover(page, baseURL!); // Merely opening the default report is not a dirty change.
  await page.goBack();
  await expectMeal(page, baseURL!);

  await page.getByTestId("button-report-offer").click();
  const context = page.getByTestId("input-report-context");
  await context.fill("Fictional context that should survive a collapsed panel.");
  await page.getByTestId("button-report-offer").click();
  await expect(context).toHaveCount(0);

  await page.getByTestId("link-cook-profile").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await expect(page.getByTestId("dialog-unsaved-changes")).toContainText("report edits");
  await page.getByTestId("button-stay-editing").click();
  await expectMeal(page, baseURL!);
  await page.getByTestId("button-report-offer").click();
  await expect(page.getByTestId("input-report-context")).toHaveValue("Fictional context that should survive a collapsed panel.");

  await page.getByTestId("link-cook-profile").click();
  await page.getByTestId("button-discard-leave").click();
  await expectCook(page, baseURL!);

  await page.getByTestId("button-report-cook").click();
  const profileContext = page.getByTestId("input-report-context");
  await profileContext.fill("Another fictional report draft.");
  await page.goBack();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-stay-editing").click();
  await expectCook(page, baseURL!);
  await expect(profileContext).toHaveValue("Another fictional report draft.");
  await page.goBack();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-discard-leave").click();
  await expectMeal(page, baseURL!);
});

test("a dirty report warns before reload, and a local submission clears its navigation guard", async ({ navigation: page, baseURL, navigationState }) => {
  await page.goto(new URL(mealPath, baseURL!).href);
  await page.getByTestId("button-report-offer").click();
  const context = page.getByTestId("input-report-context");
  await context.fill("Fictional report context for reload warning.");

  const dialogPromise = page.waitForEvent("dialog");
  const reloadPromise = page.reload();
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.accept();
  await reloadPromise;

  navigationState.allowLocalStorageChanges = true;
  await page.getByTestId("button-report-offer").click();
  await page.getByTestId("input-report-context").fill("Fictional context for local submission.");
  await page.getByTestId("button-submit-report").click();
  await expect(page.getByTestId("text-report-done")).toContainText("saved locally");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("neighborhood-kitchen-prototype-v1")!));
  expect(stored.reports[0]).toMatchObject({
    targetType: "offer",
    targetId: mealId,
    reason: "Inaccurate allergen information",
    context: "Fictional context for local submission.",
  });
  await page.getByTestId("button-back").click();
  await expectDiscover(page, baseURL!);
});

test("offer edits survive Stay for in-app navigation and browser Back/Forward", async ({ navigation: page, baseURL }) => {
  await page.goto(baseURL!);
  await page.getByTestId("nav-For cooks").click();
  await page.getByTestId("button-edit-squash").click();
  const title = page.getByTestId("input-title");
  await expect(title).toHaveValue("Roasted squash & rice");

  // A clean editor can leave normally, and its history entry can be revisited.
  await page.getByTestId("nav-Browse meals").click();
  await expectDiscover(page, baseURL!);
  await page.goBack();
  await expect(title).toHaveValue("Roasted squash & rice");
  await title.fill("Fictional offer retained after Forward");

  // The editor is now behind the current history entry. Stay restores it,
  // while Discard authorizes the pending Forward traversal.
  await page.goForward();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-stay-editing").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeHidden();
  await expectPath(page, baseURL!, "offers/squash/edit");
  await expect(title).toHaveValue("Fictional offer retained after Forward");
  await page.goForward();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-discard-leave").click();
  await expectDiscover(page, baseURL!);

  // A dirty in-app departure also waits for an explicit decision.
  await page.goBack();
  await expect(title).toHaveValue("Roasted squash & rice");
  await title.fill("Fictional offer retained after Back");
  await page.getByTestId("nav-Browse meals").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-stay-editing").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeHidden();
  await expect(title).toHaveValue("Fictional offer retained after Back");
  await page.getByTestId("nav-Browse meals").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-discard-leave").click();
  await expectDiscover(page, baseURL!);

  // A dirty Back traversal keeps the edited form mounted after Stay.
  await page.goBack();
  await expect(title).toHaveValue("Roasted squash & rice");
  await title.fill("Fictional offer retained after Back traversal");
  await page.goBack();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-stay-editing").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeHidden();
  await expectPath(page, baseURL!, "offers/squash/edit");
  await expect(title).toHaveValue("Fictional offer retained after Back traversal");
  await page.goBack();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-discard-leave").click();
  await expect(page.getByTestId("button-new-offer")).toBeVisible();
});

test("application edits survive Stay for in-app navigation and browser Back/Forward", async ({ navigation: page, baseURL }) => {
  await page.goto(baseURL!);
  await page.getByTestId("nav-For cooks").click();
  await page.getByRole("button", { name: "Application & eligibility" }).click();
  const name = page.getByTestId("input-app-name");
  await expect(name).toHaveValue("Alex Larkin");

  // A clean application can leave normally and be revisited from history.
  await page.getByTestId("nav-Browse meals").click();
  await expectDiscover(page, baseURL!);
  await page.goBack();
  await expect(name).toHaveValue("Alex Larkin");
  await name.fill("Fictional applicant retained after Forward");

  // A cancelled Forward must return to the original form before asking.
  await page.goForward();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-stay-editing").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeHidden();
  await expectPath(page, baseURL!, "cook-application");
  await expect(name).toHaveValue("Fictional applicant retained after Forward");
  await page.goForward();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-discard-leave").click();
  await expectDiscover(page, baseURL!);

  // In-app navigation and Back use the same Stay/Discard decision.
  await page.goBack();
  await expect(name).toHaveValue("Alex Larkin");
  await name.fill("Fictional applicant retained after in-app navigation");
  await page.getByTestId("nav-Browse meals").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-stay-editing").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeHidden();
  await expect(name).toHaveValue("Fictional applicant retained after in-app navigation");
  await page.getByTestId("nav-Browse meals").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-discard-leave").click();
  await expectDiscover(page, baseURL!);

  await page.goBack();
  await expect(name).toHaveValue("Alex Larkin");
  await name.fill("Fictional applicant retained after Back");
  await page.goBack();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-stay-editing").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeHidden();
  await expectPath(page, baseURL!, "cook-application");
  await expect(name).toHaveValue("Fictional applicant retained after Back");
  await page.goBack();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-discard-leave").click();
  await expect(page.getByTestId("button-new-offer")).toBeVisible();
});

test("clean and saved offer editors do not prompt, while dirty edits warn before reload", async ({ navigation: page, baseURL, navigationState }) => {
  await page.goto(baseURL!);
  await page.getByTestId("nav-For cooks").click();
  await page.getByTestId("button-edit-squash").click();
  await page.getByRole("button", { name: "Back to My cooking" }).click();
  await expect(page.getByTestId("button-new-offer")).toBeVisible();
  await expect(page.getByTestId("dialog-unsaved-changes")).toHaveCount(0);

  await page.getByTestId("button-edit-squash").click();
  const title = page.getByTestId("input-title");
  await title.fill("Fictional saved offer title");
  navigationState.allowLocalStorageChanges = true;
  await page.getByTestId("button-save-draft").click();
  await expect(page.getByTestId("text-saved")).toContainText("Draft saved.");
  await page.getByRole("button", { name: "Back to My cooking" }).click();
  await expect(page.getByTestId("button-new-offer")).toBeVisible();
  await expect(page.getByTestId("dialog-unsaved-changes")).toHaveCount(0);

  await page.getByTestId("button-edit-squash").click();
  await page.getByTestId("input-title").fill("Fictional unsaved offer reload check");
  const dialogPromise = page.waitForEvent("dialog");
  const reloadPromise = page.reload();
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.accept();
  await reloadPromise;
  await expect(page.getByTestId("input-title")).toHaveValue("Fictional saved offer title");
});

test("clean and saved applications do not prompt, while dirty edits warn before reload", async ({ navigation: page, baseURL, navigationState }) => {
  await page.goto(baseURL!);
  await page.getByTestId("nav-For cooks").click();
  await page.getByRole("button", { name: "Application & eligibility" }).click();
  await page.getByTestId("nav-Browse meals").click();
  await expectDiscover(page, baseURL!);
  await expect(page.getByTestId("dialog-unsaved-changes")).toHaveCount(0);

  await page.getByTestId("nav-For cooks").click();
  await page.getByRole("button", { name: "Application & eligibility" }).click();
  await page.getByTestId("input-app-name").fill("Fictional saved applicant");
  navigationState.allowLocalStorageChanges = true;
  await page.getByTestId("button-save-application").click();
  await page.getByTestId("nav-Browse meals").click();
  await expectDiscover(page, baseURL!);
  await expect(page.getByTestId("dialog-unsaved-changes")).toHaveCount(0);

  await page.goBack();
  await page.getByTestId("input-app-name").fill("Fictional unsaved applicant reload check");
  const dialogPromise = page.waitForEvent("dialog");
  const reloadPromise = page.reload();
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.accept();
  await reloadPromise;
  await expect(page.getByTestId("input-app-name")).toHaveValue("Fictional saved applicant");
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

test("a missing direct cook profile stays unavailable on reload and history traversal", async ({ navigation: page, baseURL }) => {
  const assertMissing = async () => {
    await expectPath(page, baseURL!, missingCookPath);
    await expect(page.getByTestId("status-cook-not-found")).toHaveText("This cook profile could not be found.");
    await expect(page.getByRole("heading", { name: "Neighbor and cook, one account." })).toHaveCount(0);
    await expect(page.getByTestId("text-cook-name")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Back to Discover", exact: true })).toBeVisible();
  };
  await page.goto(baseURL!);
  await expectDiscover(page, baseURL!);
  await page.goto(new URL(missingCookPath, baseURL!).href);
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
