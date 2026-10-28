import { describe, expect, it } from 'vitest';
import { budgetForDay, parseMoneyInput, planForecast, type Plan, type Transaction } from './model';

const plan: Plan = {
  id: 'review',
  name: 'Review',
  amount: 3000,
  reserve: 0,
  startDate: '2026-10-01',
  endDate: '2026-10-03',
  timezone: 'Asia/Ho_Chi_Minh',
};
const transactions: Transaction[] = [
  {
    id: 'expense',
    kind: 'expense',
    amount: 6000,
    category: 'food',
    date: '2026-10-01',
    note: '',
    createdAt: '2026-10-01T01:00:00.000Z',
  },
  {
    id: 'refund',
    kind: 'refund',
    amount: 1000,
    category: 'food',
    refundOf: 'expense',
    date: '2026-10-02',
    note: '',
    createdAt: '2026-10-02T01:00:00.000Z',
  },
];
describe('review regressions', () => {
  it('accepts whole VND and complete thousands groups', () => {
    for (const input of ['1000000', '1.000.000', '1,000,000', '1 000 000'])
      expect(parseMoneyInput(input)).toBe(1000000);
  });
  it('does not silently turn decimal amounts or malformed separators into a different expense', () => {
    for (const input of ['1.5', '1,5', '12.34', '1,,000', '.100', '1.000,000', '-100', '1e3', ''])
      expect(parseMoneyInput(input)).toBeNaN();
  });
  it('forecasts through today and stops extrapolating at expiry', () => {
    const larger = { ...plan, amount: 30000, endDate: '2026-10-30' };
    expect(planForecast(larger, [transactions[0]], '2026-10-03')).toBe(-30000);
    expect(planForecast(larger, [transactions[0]], '2026-10-31')).toBe(24000);
    expect(planForecast(larger, [transactions[0]], '2026-10-02')).toBeNull();
  });
  it('does not show spendable money when a refund still leaves the plan in debt', () => {
    const day = budgetForDay(plan, transactions, '2026-10-02');
    expect(day.remaining).toBe(-2000);
    expect(day.todayRemaining).toBe(0);
  });
  it('never offers more than actual remaining funds after refunding an old deficit', () => {
    const day = budgetForDay(
      plan,
      [transactions[0], { ...transactions[1], amount: 4000 }],
      '2026-10-02',
    );
    expect(day.remaining).toBe(1000);
    expect(day.todayRemaining).toBe(1000);
  });
});
