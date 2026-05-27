import { expect, test } from "@playwright/test";

test("organizer can reach the new event screen", async ({ page }) => {
  await page.goto("/events/new");
  await expect(page.getByRole("heading", { name: "Create event" })).toBeVisible();
});
