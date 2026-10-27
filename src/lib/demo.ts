import { addDays, emptySnapshot, type Snapshot, type Transaction } from './model';

export function demoSnapshot(today: string): Snapshot {
  const startDate = addDays(today, -8);
  const amounts = [95000, 68000, 124000, 52000, 87000, 115000, 73000, 62000];
  const cats = ['food', 'transport', 'shopping', 'food', 'fun', 'bills', 'food', 'health'] as const;
  const notes = [
    'Bữa trưa cùng bạn',
    'Xăng xe một tuần',
    'Một cuốn sách mới',
    'Bữa sáng & cà phê',
    'Một buổi xem phim',
    'Tiền điện thoại',
    'Đi chợ nấu cơm',
    'Vitamin mỗi ngày',
  ];
  const transactions: Transaction[] = amounts.map((amount, i) => ({
    id: `demo-${i}`,
    kind: 'expense',
    amount,
    category: cats[i],
    date: addDays(startDate, i),
    note: notes[i],
    createdAt: `${startDate}T00:00:00.000Z`,
  }));
  transactions.push({
    id: 'demo-coffee',
    kind: 'expense',
    amount: 35000,
    category: 'food',
    date: today,
    note: 'Cà phê sáng ☕',
    createdAt: `${today}T01:00:00.000Z`,
  });
  transactions.push({
    id: 'demo-lunch',
    kind: 'expense',
    amount: 45000,
    category: 'food',
    date: today,
    note: 'Một bữa trưa ngon',
    createdAt: `${today}T05:00:00.000Z`,
  });
  return {
    ...emptySnapshot(),
    plan: {
      id: 'demo-plan',
      name: 'Một tháng an tâm',
      amount: 3500000,
      reserve: 500000,
      startDate,
      endDate: addDays(startDate, 29),
      timezone: 'Asia/Ho_Chi_Minh',
    },
    transactions,
  };
}
