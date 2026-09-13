const { test: base, expect } = require('@playwright/test');

const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.VSACNative = {
        openTextFile: () => {},
        openWorkspace: () => {},
        saveTextFile: () => {},
        httpRequest: () => {},
      };
    });
    await page.goto('/index.html');
    await expect(page).toHaveTitle('Visual Studio Acode');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('#editor')).toBeVisible();
    await use(page);
  },
});

module.exports = { test, expect };
