const { test, expect } = require('./fixtures/base');

test('E2E-01 launch editor and edit document', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  const editor = page.locator('#editor');
  await editor.fill('const answer = 42;');
  await expect(page.locator('#dirty')).toHaveText('Modified');
  await expect(page.locator('#position')).toContainText('Ln 1');
});

test('E2E-05 search current document updates result count', async ({ page }) => {
  const editor = page.locator('#editor');
  await editor.fill('hello hello world');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Find in File' }).click();
  await page.locator('#command').fill('hello');
  await expect(page.locator('#command-list')).toContainText('2 matches');
});

test('E2E-06 invalid search input does not crash the editor', async ({ page }) => {
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Find in File' }).click();
  await page.locator('#command').fill('[');
  await expect(page.locator('#command-list')).toContainText('0 matches');
  await expect(page.locator('#editor')).toBeVisible();
});

test('E2E-07 preview renders sandboxed HTML document', async ({ page }) => {
  await page.locator('.tab', { hasText: 'index.html' }).click();
  await page.getByRole('button', { name: 'Preview' }).click();
  const frame = page.locator('iframe.preview-frame');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-forms allow-modals');
  await expect(frame.contentFrame().getByRole('heading', { name: 'Visual Studio Acode' })).toBeVisible();
});

test('E2E-08 preview JavaScript errors are captured by DevTools', async ({ page }) => {
  await page.locator('.tab', { hasText: 'index.html' }).click();
  await page.locator('#editor').fill('<!doctype html><html><body><script>throw new Error("e2e failure")</script></body></html>');
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.locator('iframe.preview-frame')).toBeVisible();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'DevTools' }).click();
  await expect(page.locator('#dt-output')).toContainText('e2e failure');
});

test('E2E-09 terminal stays unavailable behind the security gate', async ({ page }) => {
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Terminal' }).click();
  await page.locator('#command').fill('pwd');
  await page.getByRole('button', { name: 'Run command' }).click();
  await expect(page.locator('#command-list')).toContainText('Native terminal unavailable.');
  await expect(page.locator('#command-list')).not.toContainText('exit 0');
});

test('E2E-10 terminal rejects a forbidden path traversal command', async ({ page }) => {
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Terminal' }).click();
  await page.locator('#command').fill('cd ..');
  await page.getByRole('button', { name: 'Run command' }).click();
  await expect(page.locator('#command-list')).toContainText('$ cd ..');
  await expect(page.locator('#command-list')).toContainText('Native terminal unavailable.');
  await expect(page.locator('#command-list')).not.toContainText('exit ');
});

test('E2E-12 API Studio rejects malformed URL without native request', async ({ page }) => {
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'API Studio' }).click();
  await page.locator('#api-url').fill('not-a-url');
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.locator('#api-result')).toHaveText('Only http:// and https:// URLs are allowed.');
});

test('E2E-13 diagnostics appear in Problems panel', async ({ page }) => {
  await page.locator('.tab', { hasText: 'main.js' }).click();
  await page.locator('#editor').fill('function broken( {\n  return 1;\n');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Problems' }).click();
  await expect(page.locator('#preview-body')).toContainText('Unclosed');
  await expect(page.locator('#diagnostics-count')).not.toHaveText('0 problems');
});

test('E2E-14 empty diagnostics state is explicit', async ({ page }) => {
  await page.locator('.tab', { hasText: 'main.js' }).click();
  await page.locator('#editor').fill('function ok() { return 1; }');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Problems' }).click();
  await expect(page.locator('#preview-body')).toHaveText('No problems detected.');
});

test('E2E-15 local editor state survives reload', async ({ page }) => {
  await page.locator('#editor').fill('persist me');
  await expect(page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('vsac.workspace.v3') || '{}');
    const file = (state.files || []).find((entry) => entry.id === 'main.js');
    return file?.content;
  })).resolves.toBe('persist me');
  await page.reload();
  await expect(page.locator('#editor')).toHaveValue('persist me');
});

test('E2E-16 offline editor workflow stays usable without network', async ({ page, context }) => {
  await context.setOffline(true);
  await page.locator('#editor').fill('offline edit');
  await expect(page.locator('#dirty')).toHaveText('Modified');
  await expect(page.locator('#editor')).toHaveValue('offline edit');
});
