import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

async function navigate(page: Page, name: string) {
  await page.locator('nav:visible').getByRole('button', { name, exact: true }).click();
}
async function createPlan(page: Page) {
  await page.goto('/');
  await page.getByLabel('Số tiền dành cho kỳ này', { exact: true }).fill('3000000');
  await page.getByLabel('Khoản muốn giữ lại', { exact: true }).fill('300000');
  await page.getByRole('button', { name: 'Bắt đầu cùng Mơ' }).click();
  await expect(page.locator('.hero-amount')).toContainText('90.000');
}
async function addExpense(page: Page, amount = '30000', note = 'Cà phê kiểm thử') {
  await page.getByRole('button', { name: 'Thêm giao dịch', exact: true }).click();
  await page.getByLabel('Số tiền', { exact: true }).fill(amount);
  await page.getByLabel('Ghi chú').fill(note);
  await page.getByRole('button', { name: 'Lưu giao dịch', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-27T03:00:00Z') });
});

test('onboarding, spending, reload, edit, filter and delete', async ({ page }) => {
  await createPlan(page);
  await addExpense(page);
  await expect(page.locator('.hero-amount')).toContainText('60.000');
  await page.reload();
  await expect(page.locator('.hero-amount')).toContainText('60.000');
  await navigate(page, 'Giao dịch');
  await page.getByRole('button', { name: 'Sửa Cà phê kiểm thử' }).click();
  await page.getByLabel('Số tiền', { exact: true }).fill('45000');
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByLabel('Tìm giao dịch').fill('khong ton tai');
  await expect(page.getByText('Chưa tìm thấy giao dịch phù hợp')).toBeVisible();
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
  await page.getByRole('button', { name: 'Xóa Cà phê kiểm thử' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Xóa giao dịch', exact: true })
    .click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await navigate(page, 'Hôm nay');
  await expect(page.locator('.hero-amount')).toContainText('90.000');
});

test('refunds, topups and overspending affect the budget correctly', async ({ page }) => {
  await createPlan(page);
  await addExpense(page, '120000', 'Ăn cùng bạn');
  await expect(page.locator('.hero-amount')).toContainText('30.000');
  await expect(page.getByText('Bạn đã vượt hạn mức hôm nay')).toBeVisible();
  await page.getByRole('button', { name: 'Thêm giao dịch', exact: true }).click();
  await page.getByRole('button', { name: 'Hoàn tiền', exact: true }).click();
  await page.getByLabel('Số tiền', { exact: true }).fill('20000');
  const source = page.getByLabel('Khoản chi gốc');
  await source.selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Lưu giao dịch', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.hero-amount')).toContainText('10.000');
  await page.getByRole('button', { name: 'Thêm giao dịch', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm tiền', exact: true }).click();
  await page.getByLabel('Số tiền', { exact: true }).fill('600000');
  await page.getByRole('button', { name: 'Lưu giao dịch', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.hero-amount')).toContainText('10.000');
  await expect(page.getByText('Hôm nay bạn còn có thể tiêu')).toBeVisible();
});

test('backup preview is non-destructive, restore works and invalid files are rejected', async ({
  page,
}) => {
  await createPlan(page);
  await addExpense(page);
  await navigate(page, 'Cài đặt');
  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Sao lưu JSON Giữ toàn bộ kế hoạch và giao dịch', exact: true })
    .click();
  const download = await downloadPromise;
  const backup = await readFile((await download.path())!, 'utf8');
  expect(JSON.parse(backup).transactions).toHaveLength(1);
  await page.getByLabel('Tệp sao lưu JSON').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  });
  await expect(page.getByRole('status').filter({ hasText: 'không phải JSON' })).toBeVisible();
  await page.getByLabel('Tệp sao lưu JSON').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  });
  await expect(page.getByRole('dialog')).toContainText('1 giao dịch');
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await navigate(page, 'Hôm nay');
  await addExpense(page, '20000', 'Khoản chi thứ hai');
  await expect(page.locator('.hero-amount')).toContainText('40.000');
  await navigate(page, 'Cài đặt');
  await page.getByLabel('Tệp sao lưu JSON').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  });
  await page.getByRole('button', { name: 'Thay thế và khôi phục', exact: true }).click();
  await expect(page.locator('.hero-amount')).toContainText('60.000');
  await page.reload();
  await expect(page.locator('.hero-amount')).toContainText('60.000');
});

test('reports show real totals and demo changes never touch personal data', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Khám phá bản mẫu' }).click();
  await expect(page.locator('.demo-banner')).toBeVisible();
  await navigate(page, 'Phân tích');
  await expect(page.getByRole('heading', { name: 'Bức tranh chi tiêu' })).toBeVisible();
  await page.getByRole('button', { name: 'Xem bảng số liệu theo ngày' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(10);
  await page.getByRole('button', { name: 'Thoát bản mẫu' }).click();
  await expect(page.getByRole('heading', { name: 'Mình bắt đầu từ đây nhé.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mình bắt đầu từ đây nhé.' })).toBeVisible();
});

test('plan edits recalculate, settings persist and reset requires explicit confirmation', async ({
  page,
}) => {
  await createPlan(page);
  await addExpense(page);
  await navigate(page, 'Cài đặt');
  await page.getByRole('button', { name: 'Điều chỉnh kế hoạch' }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Số tiền dành cho kỳ này', { exact: true })
    .fill('6000000');
  await page.getByRole('button', { name: 'Lưu kế hoạch', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByLabel('Tên thú cưng', { exact: true }).fill('Bơ');
  await page.getByLabel('Hiển thị thú cưng').uncheck();
  await page.getByRole('button', { name: 'Lưu tùy chọn' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu tùy chọn' })).toBeVisible();
  await navigate(page, 'Hôm nay');
  await expect(page.locator('.hero-amount')).toContainText('160.000');
  await expect(page.locator('.pet-card')).not.toBeVisible();
  await page.reload();
  await expect(page.locator('.pet-card')).not.toBeVisible();
  await navigate(page, 'Cài đặt');
  await expect(page.getByLabel('Tên thú cưng', { exact: true })).toHaveValue('Bơ');
  await page.getByRole('button', { name: 'Xóa dữ liệu', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Xóa toàn bộ dữ liệu', exact: true }),
  ).toBeDisabled();
  await page.getByLabel('Nhập XÓA để xác nhận').fill('XÓA');
  await page.getByRole('button', { name: 'Xóa toàn bộ dữ liệu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mình bắt đầu từ đây nhé.' })).toBeVisible();
});

test('budget rolls over at midnight in Vietnam', async ({ page }) => {
  await createPlan(page);
  await addExpense(page, '60000');
  await expect(page.locator('.hero-amount')).toContainText('30.000');
  await page.clock.fastForward(21 * 60 * 60 * 1000);
  await expect(page.locator('.hero-amount')).toContainText('91.034');
  await expect(page.locator('.date-display')).toContainText('28/10/2026');
});

test('production app reloads offline and saves a transaction', async ({ page, context }) => {
  await createPlan(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.hero-amount')).toContainText('90.000');
  await expect(page.locator('.offline-banner')).toBeVisible();
  await addExpense(page, '25000', 'Ghi khi offline');
  await page.reload();
  await expect(page.locator('.hero-amount')).toContainText('65.000');
  await context.setOffline(false);
});

test('clearing dates is safe and future report ranges are rejected', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ngày kết thúc', exact: true }).click();
  await page.getByLabel('Ngày kết thúc', { exact: true }).fill('');
  await expect(page.getByText('Chọn ngày kết thúc')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mình bắt đầu từ đây nhé.' })).toBeVisible();
  await createPlan(page);
  await addExpense(page);
  await navigate(page, 'Phân tích');
  await page.getByLabel('Khoảng thời gian phân tích').selectOption('custom');
  await page.getByLabel('Đến ngày', { exact: true }).fill('2026-12-31');
  await expect(page.getByRole('alert')).toContainText('Chọn khoảng ngày hợp lệ');
});

test('refunds cannot exceed the original expense', async ({ page }) => {
  await createPlan(page);
  await addExpense(page);
  await page.getByRole('button', { name: 'Thêm giao dịch', exact: true }).click();
  await page.getByRole('button', { name: 'Hoàn tiền', exact: true }).click();
  await page.getByLabel('Số tiền', { exact: true }).fill('40000');
  await page.getByLabel('Khoản chi gốc').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Lưu giao dịch', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Tổng hoàn tiền không được vượt khoản chi gốc',
  );
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await expect(page.locator('.hero-amount')).toContainText('60.000');
});

test('screens fit the viewport and core UI passes accessibility checks', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Mình bắt đầu từ đây nhé.' })).toBeVisible();
  const onboardingA11y = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    onboardingA11y.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  await page.getByRole('button', { name: 'Khám phá bản mẫu' }).click();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-dashboard.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const dashboardA11y = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    dashboardA11y.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  for (const name of ['Giao dịch', 'Phân tích', 'Cài đặt']) {
    await navigate(page, name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
});
