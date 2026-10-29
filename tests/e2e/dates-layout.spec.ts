import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function navigate(page: Page, label: string) {
  await page.locator('nav:visible').getByRole('button', { name: label, exact: true }).click();
}
async function createPlan(page: Page) {
  await page.goto('/');
  await page.getByLabel('Số tiền dành cho kỳ này', { exact: true }).fill('3000000');
  await page.getByLabel('Khoản muốn giữ lại', { exact: true }).fill('300000');
  await page.getByRole('button', { name: 'Bắt đầu cùng Mơ' }).click();
  await expect(page.locator('.hero-value')).toContainText('90.000');
}
async function record(page: Page, date: string, amount: string, note: string) {
  await page.getByRole('button', { name: 'Thêm giao dịch', exact: true }).click();
  await page.getByLabel('Số tiền', { exact: true }).fill(amount);
  await page.getByLabel('Ngày giao dịch', { exact: true }).fill(date);
  await page.getByLabel('Ghi chú').fill(note);
  await page.getByRole('button', { name: 'Lưu giao dịch', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-27T03:00:00Z') });
});

test('global add button stays at the same position across all tabs and opens from settings', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Khám phá bản mẫu' }).click();
  await page.evaluate(() => document.fonts.ready);
  const widths = testInfo.project.name === 'desktop' ? [768, 1024, 1440] : [320, 393, 600];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    let original: { x: number; y: number; width: number; height: number } | null = null;
    for (const tab of ['Hôm nay', 'Giao dịch', 'Phân tích', 'Cài đặt', 'Hôm nay']) {
      await navigate(page, tab);
      const button = page.getByRole('button', { name: 'Thêm giao dịch', exact: true });
      const box = (await button.boundingBox())!;
      expect(box).toBeTruthy();
      if (original)
        for (const axis of ['x', 'y', 'width', 'height'] as const)
          expect(Math.abs(box[axis] - original[axis]), `${width}px ${tab}: ${axis}`).toBeLessThan(
            1,
          );
      original = box;
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      if (width < 761) {
        const nav = (await page.locator('.mobile-nav').boundingBox())!;
        expect(box.y + box.height).toBeLessThan(nav.y);
      }
      await button.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
    if (width === 393 || width === 1440)
      await page.screenshot({
        path: `test-results/${testInfo.project.name}-global-action.png`,
        fullPage: true,
      });
  }
});

test('past and future records survive backup and only affect today on their transaction date', async ({
  page,
}) => {
  await createPlan(page);
  await record(page, '2026-10-26', '30000', 'Chi hôm qua');
  await expect(page.locator('.hero-value')).toContainText('90.000');
  await record(page, '2026-10-28', '60000', 'Tiền ăn ngày mai');
  await expect(page.locator('.hero-value')).toContainText('90.000');
  await page.reload();
  await expect(page.locator('.hero-value')).toContainText('90.000');
  await navigate(page, 'Giao dịch');
  await expect(
    page.locator('.transaction-row').filter({ hasText: 'Tiền ăn ngày mai' }),
  ).toContainText('Dự kiến');
  await expect(page.locator('.transaction-row').filter({ hasText: 'Chi hôm qua' })).toContainText(
    'Ngoài kỳ',
  );
  await page.getByLabel('Từ ngày', { exact: true }).fill('2026-10-26');
  await page.getByLabel('Đến ngày', { exact: true }).fill('2026-10-28');
  await expect(page.locator('.list-summary')).toContainText('2 giao dịch');
  await expect(page.locator('.list-summary')).toContainText('Chi ròng thực tế: 30.000');
  await expect(page.locator('.list-summary')).toContainText('1 dự kiến');
  await navigate(page, 'Cài đặt');
  const pending = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Sao lưu JSON Giữ toàn bộ kế hoạch và giao dịch', exact: true })
    .click();
  const downloaded = await pending;
  const backup = await readFile((await downloaded.path())!, 'utf8');
  expect(JSON.parse(backup).transactions.map((tx: { date: string }) => tx.date)).toEqual([
    '2026-10-26',
    '2026-10-28',
  ]);
  await page.getByLabel('Tệp sao lưu JSON').setInputFiles({
    name: 'future.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  });
  await page.getByRole('button', { name: 'Thay thế và khôi phục', exact: true }).click();
  await expect(page.locator('.hero-value')).toContainText('90.000');
  await page.clock.fastForward(21 * 60 * 60 * 1000);
  await expect(page.locator('.hero-value')).toContainText('33.103');
  await navigate(page, 'Giao dịch');
  await expect(
    page.locator('.transaction-row').filter({ hasText: 'Tiền ăn ngày mai' }),
  ).not.toContainText('Dự kiến');
});

test('history and reports include dates outside the budget without changing its period', async ({
  page,
}) => {
  await createPlan(page);
  await record(page, '2026-10-26', '30000', 'Lịch sử trước kế hoạch');
  await record(page, '2026-11-30', '200000', 'Kế hoạch chi tháng sau');
  await expect(page.locator('.hero-value')).toContainText('90.000');
  await navigate(page, 'Giao dịch');
  await page.getByLabel('Từ ngày', { exact: true }).fill('2026-11-30');
  await page.getByLabel('Đến ngày', { exact: true }).fill('2026-11-30');
  await expect(page.locator('.list-summary')).toContainText('1 giao dịch');
  await expect(page.locator('.transaction-row')).toContainText('Dự kiến');
  await expect(page.locator('.transaction-row')).toContainText('Ngoài kỳ');
  await navigate(page, 'Phân tích');
  await page.getByLabel('Khoảng thời gian phân tích').selectOption('custom');
  await page.getByLabel('Từ ngày', { exact: true }).fill('2026-10-26');
  await page.getByRole('button', { name: 'Xem bảng số liệu theo ngày' }).click();
  const row = page.getByRole('row').filter({ hasText: '26/10' });
  await expect(row).toContainText('30.000');
  await expect(row).toContainText('Ngoài kỳ');
  await expect(page.locator('.stats-grid').first()).toContainText('30.000');
  await page.getByLabel('Khoảng thời gian phân tích').selectOption('7');
  await expect(page.locator('.stats-grid').first()).toContainText('30.000');
  await navigate(page, 'Cài đặt');
  await expect(page.locator('.plan-details')).toContainText('3.000.000');
  await expect(page.getByText('27/10 — 25/11/2026', { exact: true })).toBeVisible();
});
