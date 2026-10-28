import { test, expect, type Page } from '@playwright/test';

async function navigate(page: Page, name: string) {
  await page.locator('nav:visible').getByRole('button', { name, exact: true }).click();
}
async function personalPlan(page: Page) {
  await page.goto('/');
  await page.getByLabel('Số tiền dành cho kỳ này', { exact: true }).fill('3000000');
  await page.getByLabel('Khoản muốn giữ lại', { exact: true }).fill('300000');
  await page.getByRole('button', { name: 'Bắt đầu cùng Mơ' }).click();
  await expect(page.locator('.hero-amount')).toContainText('90.000');
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-27T03:00:00Z') });
});

test('uppercase Vietnamese Đ is searchable without accents', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Khám phá bản mẫu' }).click();
  await page.getByRole('button', { name: 'Thêm giao dịch', exact: true }).click();
  await page.getByLabel('Số tiền', { exact: true }).fill('20000');
  await page.getByLabel('Ghi chú').fill('ĐI CHỢ');
  await page.getByRole('button', { name: 'Lưu giao dịch', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await navigate(page, 'Giao dịch');
  await page.getByLabel('Tìm giao dịch').fill('di cho');
  await expect(page.getByText('ĐI CHỢ', { exact: true })).toBeVisible();
});

test('end-of-plan forecast does not change with a historical report filter', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Khám phá bản mẫu' }).click();
  await navigate(page, 'Phân tích');
  const forecast = await page.locator('.forecast-card p').innerText();
  await page.getByLabel('Khoảng thời gian phân tích').selectOption('custom');
  await page.getByLabel('Đến ngày', { exact: true }).fill('2026-10-21');
  await expect(page.locator('.forecast-card p')).toHaveText(forecast);
});

test('a stale transaction editor cannot overwrite a change made in another tab', async ({
  page,
  context,
}) => {
  await personalPlan(page);
  await page.getByRole('button', { name: 'Thêm giao dịch', exact: true }).click();
  await page.getByLabel('Số tiền', { exact: true }).fill('30000');
  await page.getByLabel('Ghi chú').fill('Chi chung');
  await page.getByRole('button', { name: 'Lưu giao dịch', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await navigate(page, 'Giao dịch');
  await page.getByRole('button', { name: 'Sửa Chi chung' }).click();
  const other = await context.newPage();
  await other.clock.install({ time: new Date('2026-10-27T03:00:00Z') });
  await other.goto('/');
  await navigate(other, 'Giao dịch');
  await other.getByRole('button', { name: 'Sửa Chi chung' }).click();
  await other.getByLabel('Số tiền', { exact: true }).fill('45000');
  await other.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(other.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.list-summary')).toContainText('45.000');
  await page.getByLabel('Ghi chú').fill('Bản chỉnh cũ');
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('tab khác');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(page.locator('.list-summary')).toContainText('45.000');
  await page.getByRole('button', { name: 'Xóa Chi chung', exact: true }).click();
  await other.getByRole('button', { name: 'Sửa Chi chung', exact: true }).click();
  await other.getByLabel('Số tiền', { exact: true }).fill('60000');
  await other.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(other.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.list-summary')).toContainText('60.000');
  await page.getByRole('button', { name: 'Xóa giao dịch', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('tab khác');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(page.locator('.list-summary')).toContainText('60.000');
  await other.close();
});

test('a backup can be restored before creating a new plan', async ({ page }) => {
  await page.goto('/');
  const backup = {
    version: 1,
    plan: {
      id: 'restored-plan',
      name: 'Dữ liệu từ laptop',
      amount: 3000000,
      reserve: 300000,
      startDate: '2026-10-27',
      endDate: '2026-11-25',
      timezone: 'Asia/Ho_Chi_Minh',
    },
    transactions: [
      {
        id: 'restored-expense',
        kind: 'expense',
        amount: 30000,
        category: 'food',
        date: '2026-10-27',
        note: 'Chuyển sang điện thoại',
        createdAt: '2026-10-27T01:00:00.000Z',
      },
    ],
    settings: { petName: 'Bơ', showPet: true, reduceMotion: true },
  };
  await page.getByLabel('Tệp sao lưu JSON').setInputFiles({
    name: 'mo-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByRole('dialog')).toContainText('Dữ liệu từ laptop');
  await expect(page.getByRole('heading', { name: 'Mình bắt đầu từ đây nhé.' })).toBeVisible();
  await page.getByRole('button', { name: 'Thay thế và khôi phục', exact: true }).click();
  await expect(page.locator('.hero-amount')).toContainText('60.000');
  await page.reload();
  await expect(page.locator('.hero-amount')).toContainText('60.000');
  await expect(page.getByText('Chuyển sang điện thoại', { exact: true })).toBeVisible();
});

test('decimal money is rejected rather than changing its amount', async ({ page }) => {
  await personalPlan(page);
  await page.getByRole('button', { name: 'Thêm giao dịch', exact: true }).click();
  await page.getByLabel('Số tiền', { exact: true }).fill('1,5');
  await page.getByRole('button', { name: 'Lưu giao dịch', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('số tiền nguyên dương');
  await page.getByLabel('Số tiền', { exact: true }).fill('30.000');
  await page.getByRole('button', { name: 'Lưu giao dịch', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.hero-value')).toContainText('60.000');
});

test('large balances remain fully visible at 320px and onboarding returns to the top', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.getByLabel('Số tiền dành cho kỳ này', { exact: true }).fill('1000000000000');
  await page.getByLabel('Số ngày', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Bắt đầu cùng Mơ' }).click();
  await expect(page.locator('.hero-value')).toContainText('1.000.000.000.000');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const dimensions = await page
    .locator('.hero-amount')
    .evaluate((element) => ({ scroll: element.scrollWidth, width: element.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('install prompt events and offline readiness are explained in settings', async ({ page }) => {
  await personalPlan(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.evaluate(() => {
    const prompt = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(prompt, {
      prompt: async () => {
        document.documentElement.dataset.installPromptOpened = 'yes';
      },
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
    window.dispatchEvent(prompt);
  });
  await navigate(page, 'Cài đặt');
  await expect(page.getByText('Đã sẵn sàng dùng offline', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cài Mơ trên thiết bị', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-install-prompt-opened', 'yes');
  await expect(page.getByRole('status').filter({ hasText: 'Bạn có thể cài sau' })).toBeVisible();
  await page.locator('.install-instructions summary').click();
  await expect(page.locator('.install-instructions')).toContainText('iPhone/iPad');
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.locator('.install-badge')).toContainText('Đã cài');
});

test('stale plan and settings forms preserve changes from another tab', async ({
  page,
  context,
}) => {
  await personalPlan(page);
  await navigate(page, 'Cài đặt');
  await page.getByRole('button', { name: 'Điều chỉnh kế hoạch', exact: true }).click();
  await page.getByLabel('Số tiền dành cho kỳ này', { exact: true }).fill('4000000');
  const other = await context.newPage();
  await other.clock.install({ time: new Date('2026-10-27T03:00:00Z') });
  await other.goto('/');
  await navigate(other, 'Cài đặt');
  await other.getByRole('button', { name: 'Điều chỉnh kế hoạch', exact: true }).click();
  await other.getByLabel('Số tiền dành cho kỳ này', { exact: true }).fill('5000000');
  await other.getByRole('button', { name: 'Lưu kế hoạch', exact: true }).click();
  await expect(other.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.plan-details')).toContainText('5.000.000');
  await page.getByRole('button', { name: 'Lưu kế hoạch', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Kế hoạch đã thay đổi ở tab khác');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.getByLabel('Tên thú cưng', { exact: true }).fill('Bơ');
  await other.getByLabel('Tên thú cưng', { exact: true }).fill('Mít');
  await other.getByRole('button', { name: 'Lưu tùy chọn', exact: true }).click();
  await expect(other.getByRole('status').filter({ hasText: 'Đã lưu tùy chọn' })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu tùy chọn', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'tab khác' })).toBeVisible();
  await page.reload();
  await navigate(page, 'Cài đặt');
  await expect(page.getByLabel('Tên thú cưng', { exact: true })).toHaveValue('Mít');
  await expect(page.locator('.plan-details')).toContainText('5.000.000');
  await other.close();
});

test('resetting in another tab closes an open editor without crashing', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await personalPlan(page);
  await page.getByRole('button', { name: 'Thêm giao dịch', exact: true }).click();
  const other = await context.newPage();
  await other.clock.install({ time: new Date('2026-10-27T03:00:00Z') });
  await other.goto('/');
  await navigate(other, 'Cài đặt');
  await other.getByRole('button', { name: 'Xóa dữ liệu', exact: true }).click();
  await other.getByLabel('Nhập XÓA để xác nhận').fill('XÓA');
  await other.getByRole('button', { name: 'Xóa toàn bộ dữ liệu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mình bắt đầu từ đây nhé.' })).toBeVisible();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
  await other.close();
});
