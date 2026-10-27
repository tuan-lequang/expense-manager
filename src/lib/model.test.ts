import { describe, expect, it, vi } from 'vitest';
import {
  addDays,
  budgetForDay,
  dayCount,
  emptySnapshot,
  isDate,
  parseBackup,
  snapshotSchema,
  toCsv,
  todayInZone,
  type Plan,
  type Snapshot,
  type Transaction,
} from './model';

const plan: Plan = {
  id: 'p',
  name: 'Test',
  amount: 3_000_000,
  reserve: 300_000,
  startDate: '2026-10-01',
  endDate: '2026-10-30',
  timezone: 'Asia/Ho_Chi_Minh',
};
const tx = (changes: Partial<Transaction> = {}): Transaction => ({
  id: 'e1',
  kind: 'expense',
  amount: 60_000,
  category: 'food',
  date: '2026-10-01',
  note: '',
  createdAt: '2026-10-01T01:00:00.000Z',
  ...changes,
});
const snapshot = (transactions: Transaction[] = []): Snapshot => ({
  ...emptySnapshot(),
  plan,
  transactions,
});

describe('daily budgets', () => {
  it('excludes reserve and includes both endpoints', () => {
    expect(budgetForDay(plan, [], plan.startDate)).toMatchObject({
      allowance: 90_000,
      daysLeft: 30,
      remaining: 2_700_000,
    });
    expect(dayCount('2026-10-01', '2026-10-01')).toBe(1);
  });
  it('subtracts today spending once without shrinking today allowance', () => {
    expect(budgetForDay(plan, [tx()], '2026-10-01')).toMatchObject({
      allowance: 90_000,
      todayRemaining: 30_000,
      remaining: 2_640_000,
      nextAllowance: 91_034,
    });
  });
  it('redistributes yesterday savings at the next day boundary', () => {
    expect(budgetForDay(plan, [tx()], '2026-10-02')).toMatchObject({
      allowance: 91_034,
      todayRemaining: 91_034,
      daysLeft: 29,
    });
  });
  it('allows overspending and reduces following day allowance', () => {
    const transactions = [tx({ amount: 120_000 })];
    expect(budgetForDay(plan, transactions, '2026-10-01').todayRemaining).toBe(-30_000);
    expect(budgetForDay(plan, transactions, '2026-10-02').allowance).toBe(88_965);
  });
  it('adds topups to the plan without counting them as expenses', () => {
    expect(
      budgetForDay(plan, [tx(), tx({ id: 'top', kind: 'topup', amount: 300_000 })], '2026-10-01'),
    ).toMatchObject({
      allowance: 100_000,
      todayRemaining: 40_000,
      netSpent: 60_000,
      remaining: 2_940_000,
    });
  });
  it('refunds return money and do not duplicate income', () => {
    const transactions = [tx(), tx({ id: 'r', kind: 'refund', refundOf: 'e1', amount: 20_000 })];
    expect(budgetForDay(plan, transactions, '2026-10-01')).toMatchObject({
      todayNet: 40_000,
      todayRemaining: 50_000,
      remaining: 2_660_000,
    });
  });
  it('recomputes from historical edits and excludes future transactions', () => {
    const updated = tx({ amount: 90_000 });
    expect(
      budgetForDay(plan, [updated, tx({ id: 'later', date: '2026-10-03' })], '2026-10-02')
        .allowance,
    ).toBe(90_000);
  });
  it('handles the last day, exhausted money, and expired plans without division by zero', () => {
    expect(budgetForDay(plan, [], '2026-10-30')).toMatchObject({
      allowance: 2_700_000,
      daysLeft: 1,
      nextAllowance: 0,
    });
    expect(budgetForDay(plan, [tx({ amount: 2_800_000 })], '2026-10-02')).toMatchObject({
      allowance: 0,
      remaining: -100_000,
    });
    expect(budgetForDay(plan, [], '2026-10-31')).toMatchObject({
      allowance: 0,
      daysLeft: 0,
      expired: true,
    });
    expect(budgetForDay(plan, [], '2026-09-30')).toMatchObject({
      allowance: 0,
      daysLeft: 0,
      upcoming: true,
    });
  });
  it('retains rounding remainder rather than allocating beyond remaining money', () => {
    const p = { ...plan, amount: 10, reserve: 0, endDate: '2026-10-03' };
    expect(budgetForDay(p, [], '2026-10-01').allowance).toBe(3);
    expect(budgetForDay(p, [tx({ amount: 3 })], '2026-10-03').allowance).toBe(7);
  });
});

describe('dates and timezone', () => {
  it('rejects impossible dates and handles leap/month/year boundaries', () => {
    expect(isDate('2026-02-30')).toBe(false);
    expect(isDate('2028-02-29')).toBe(true);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
  it('switches days at Vietnam midnight, independently of machine timezone', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-10-01T16:59:59Z'));
      expect(todayInZone()).toBe('2026-10-01');
      vi.setSystemTime(new Date('2026-10-01T17:00:00Z'));
      expect(todayInZone()).toBe('2026-10-02');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('backup and financial integrity', () => {
  it('round-trips complete data and rejects malformed/unsupported backup files', () => {
    const value = snapshot([tx()]);
    expect(parseBackup(JSON.stringify(value), '2026-10-30')).toEqual(value);
    expect(() => parseBackup('no-json')).toThrow('JSON');
    expect(() => parseBackup(JSON.stringify({ ...value, version: 2 }))).toThrow();
    expect(() =>
      parseBackup(JSON.stringify(snapshot([tx({ date: '2026-10-03' })])), '2026-10-02'),
    ).toThrow('tương lai');
  });
  it('rejects duplicate IDs, invalid plan boundaries and out-of-period transactions', () => {
    expect(snapshotSchema.safeParse(snapshot([tx(), tx()])).success).toBe(false);
    expect(
      snapshotSchema.safeParse({ ...snapshot(), plan: { ...plan, reserve: plan.amount } }).success,
    ).toBe(false);
    expect(snapshotSchema.safeParse(snapshot([tx({ date: '2026-09-30' })])).success).toBe(false);
    expect(snapshotSchema.safeParse(snapshot([tx({ amount: 1.5 })])).success).toBe(false);
  });
  it('requires a valid refund source, matching category, and limits total refunds', () => {
    const refund = tx({ id: 'r', kind: 'refund', amount: 40_000, refundOf: 'e1' });
    expect(snapshotSchema.safeParse(snapshot([tx(), refund])).success).toBe(true);
    expect(snapshotSchema.safeParse(snapshot([refund])).success).toBe(false);
    expect(snapshotSchema.safeParse(snapshot([tx(), { ...refund, category: 'fun' }])).success).toBe(
      false,
    );
    expect(
      snapshotSchema.safeParse(snapshot([tx(), refund, { ...refund, id: 'r2' }])).success,
    ).toBe(false);
    expect(snapshotSchema.safeParse(snapshot([tx({ date: '2026-10-02' }), refund])).success).toBe(
      false,
    );
  });
  it('escapes quotes/newlines and neutralizes spreadsheet formulas in CSV', () => {
    const csv = toCsv([tx({ note: '=HYPERLINK("example")\nhi' })]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"\'=HYPERLINK(""example"")\nhi"');
  });
});
