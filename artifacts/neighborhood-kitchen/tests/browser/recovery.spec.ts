import { test, expect } from "./navigation.fixture";

const recoveryKey = "neighborhood-kitchen-recoverable-drafts-v1";

test("offer recovery requires an explicit restore and never carries preparation confirmation into publication", async ({ navigation: page, baseURL, navigationState }) => {
  navigationState.allowLocalStorageChanges = true;
  await page.goto(new URL("offers/new", baseURL!).href);
  await page.getByTestId("check-offer-recovery").check();
  await page.getByTestId("input-title").fill("Fictional crash-recovery meal");
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]").length, recoveryKey)).toBe(1);
  const savedRecovery = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).find((draft: { kind: string }) => draft.kind === "offer"), recoveryKey);
  expect(savedRecovery.value.commitment).toBe(false);
  expect(savedRecovery.value.preparationConfirmation).toBeUndefined();

  const reloadWarning = page.waitForEvent("dialog");
  const reload = page.reload();
  const warning = await reloadWarning;
  expect(warning.type()).toBe("beforeunload");
  await warning.accept();
  await reload;

  await expect(page.getByTestId("panel-offer-recovery")).toBeVisible();
  await expect(page.getByTestId("input-title")).toHaveValue("");
  await page.getByTestId("button-restore-offer-" + savedRecovery.id).click();
  await expect(page.getByTestId("input-title")).toHaveValue("Fictional crash-recovery meal");
  await expect(page.getByTestId("check-commitment")).not.toBeChecked();
  const savedOffersBeforeSave = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).offers, "neighborhood-kitchen-prototype-v1");
  expect(savedOffersBeforeSave.some((offer: { id: string }) => offer.id === savedRecovery.id)).toBe(false);
  await page.getByTestId("button-save-draft").click();
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]").length, recoveryKey)).toBe(0);
  await expect(page.getByTestId("text-saved")).toContainText("Draft saved");
});

test("application recovery restores fields without submission and submission clears the copy", async ({ navigation: page, baseURL, navigationState }) => {
  navigationState.allowLocalStorageChanges = true;
  await page.goto(baseURL!);
  await page.evaluate((key) => {
    const data = JSON.parse(localStorage.getItem(key)!);
    data.cooks = data.cooks.map((cook: { id: string; status: string }) => cook.id === "me" ? { ...cook, status: "none" } : cook);
    data.applications.me = {
      ...data.applications.me,
      residential: false,
      jurisdiction: false,
      disclosures: false,
      submittedAt: undefined,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  }, "neighborhood-kitchen-prototype-v1");
  await page.goto(new URL("cook-application", baseURL!).href);
  await page.getByTestId("check-application-recovery").check();
  await page.getByTestId("input-app-name").fill("Fictional recovery applicant");
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]").length, recoveryKey)).toBe(1);

  const reloadWarning = page.waitForEvent("dialog");
  const reload = page.reload();
  const warning = await reloadWarning;
  expect(warning.type()).toBe("beforeunload");
  await warning.accept();
  await reload;

  await expect(page.getByTestId("panel-application-recovery")).toBeVisible();
  await expect(page.getByTestId("input-app-name")).not.toHaveValue("Fictional recovery applicant");
  await page.getByTestId("button-restore-application").click();
  await expect(page.getByTestId("input-app-name")).toHaveValue("Fictional recovery applicant");
  await expect(page.getByTestId("text-app-status")).toContainText("Not started");
  await expect(page.getByTestId("check-app-residential")).not.toBeChecked();

  await page.getByTestId("check-app-residential").check();
  await page.getByTestId("check-app-jurisdiction").check();
  await page.getByTestId("check-app-disclosures").check();
  await page.getByTestId("button-submit-application").click();
  await expect(page.getByTestId("text-app-status")).toContainText("pending");
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]").length, recoveryKey)).toBe(0);
});

test("choosing discard and leave deletes the opted-in offer recovery copy", async ({ navigation: page, baseURL, navigationState }) => {
  navigationState.allowLocalStorageChanges = true;
  await page.goto(new URL("offers/new", baseURL!).href);
  await page.getByTestId("check-offer-recovery").check();
  await page.getByTestId("input-title").fill("Fictional draft to discard");
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]").length, recoveryKey)).toBe(1);
  await page.getByTestId("nav-For cooks").click();
  await expect(page.getByTestId("dialog-unsaved-changes")).toBeVisible();
  await page.getByTestId("button-discard-leave").click();
  await expect(page).toHaveURL(new URL("my-cooking", baseURL!).href);
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]").length, recoveryKey)).toBe(0);
});

test("corrupt recovery data is not restored and can be explicitly deleted", async ({ navigation: page, baseURL, navigationState }) => {
  navigationState.allowLocalStorageChanges = true;
  await page.goto(baseURL!);
  await page.evaluate((key) => localStorage.setItem(key, "{broken"), recoveryKey);
  await page.goto(new URL("offers/new", baseURL!).href);
  await expect(page.getByTestId("status-recovery-corrupt")).toBeVisible();
  await expect(page.getByTestId("check-offer-recovery")).toBeDisabled();
  await page.getByTestId("button-clear-corrupt-recovery").click();
  await expect(page.getByTestId("status-recovery-corrupt")).toHaveCount(0);
  await expect(page.getByTestId("check-offer-recovery")).toBeEnabled();
});

test("unavailable recovery storage is reported while keeping edits in the form", async ({ navigation: page, baseURL, navigationState }) => {
  navigationState.allowLocalStorageChanges = true;
  await page.addInitScript((key) => {
    const nativeSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (candidate: string, value: string) {
      if (candidate === key) throw new DOMException("Storage unavailable", "QuotaExceededError");
      nativeSetItem.call(this, candidate, value);
    };
  }, recoveryKey);
  await page.goto(new URL("offers/new", baseURL!).href);
  await page.getByTestId("check-offer-recovery").check();
  await page.getByTestId("input-title").fill("Fictional input remains visible");
  await expect(page.getByTestId("status-recovery-unavailable")).toBeVisible();
  await expect(page.getByTestId("status-recovery-error")).toContainText("could not save the recovery copy");
  await expect(page.getByTestId("input-title")).toHaveValue("Fictional input remains visible");
});
