import { z } from 'zod';

export const TIMEZONE = 'Asia/Ho_Chi_Minh';
export const categories = [
  { id: 'food', name: 'Ăn uống', icon: 'utensils', color: '#e5b090', background: '#fae9dc' },
  { id: 'transport', name: 'Đi lại', icon: 'bus', color: '#9abca8', background: '#e6f0e8' },
  { id: 'shopping', name: 'Mua sắm', icon: 'bag', color: '#b6a1d1', background: '#eee7f5' },
  { id: 'bills', name: 'Nhà ở & hóa đơn', icon: 'house', color: '#8eafc6', background: '#e4eef5' },
  { id: 'fun', name: 'Giải trí', icon: 'sparkles', color: '#d3a1b2', background: '#f7e6ed' },
  { id: 'health', name: 'Sức khỏe', icon: 'heart', color: '#a9b781', background: '#edf0df' },
  { id: 'other', name: 'Khác', icon: 'dots', color: '#b7b3a5', background: '#eeede7' },
] as const;
export type CategoryId = (typeof categories)[number]['id'];
export const categorySchema = z.enum([
  'food',
  'transport',
  'shopping',
  'bills',
  'fun',
  'health',
  'other',
]);
export const MAX_MONEY = 1_000_000_000_000;

export function parseMoneyInput(input: string) {
  const compact = input.replace(/\s/g, '');
  const valid =
    /^\d+$/.test(compact) ||
    /^\d{1,3}(\.\d{3})+$/.test(compact) ||
    /^\d{1,3}(,\d{3})+$/.test(compact);
  if (!valid) return NaN;
  const value = Number(compact.replace(/[.,]/g, ''));
  return Number.isSafeInteger(value) ? value : NaN;
}

export function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
const dateSchema = z.string().refine(isDate, 'Ngày không hợp lệ.');
const moneySchema = z.number().int().min(0).max(MAX_MONEY);
export const planSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(60),
    amount: moneySchema.positive(),
    reserve: moneySchema,
    startDate: dateSchema,
    endDate: dateSchema,
    timezone: z.literal(TIMEZONE),
  })
  .superRefine((plan, ctx) => {
    if (plan.reserve >= plan.amount)
      ctx.addIssue({ code: 'custom', message: 'Khoản giữ lại phải nhỏ hơn số tiền của kế hoạch.' });
    if (plan.endDate < plan.startDate)
      ctx.addIssue({ code: 'custom', message: 'Ngày kết thúc phải từ ngày bắt đầu trở đi.' });
    if (dayCount(plan.startDate, plan.endDate) > 3660)
      ctx.addIssue({ code: 'custom', message: 'Kế hoạch tối đa 3.660 ngày.' });
  });
export const transactionSchema = z.object({
  id: z.string().min(1).max(100),
  kind: z.enum(['expense', 'refund', 'topup']),
  amount: moneySchema.positive(),
  category: categorySchema,
  date: dateSchema,
  note: z.string().trim().max(200),
  refundOf: z.string().max(100).optional(),
  createdAt: z.string().datetime(),
});
export const snapshotSchema = z
  .object({
    version: z.literal(1),
    plan: planSchema.nullable(),
    transactions: z.array(transactionSchema).max(50_000),
    settings: z.object({
      petName: z.string().trim().min(1).max(24),
      showPet: z.boolean(),
      reduceMotion: z.boolean(),
    }),
  })
  .superRefine((data, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (!data.plan && data.transactions.length) fail('Giao dịch cần thuộc một kế hoạch.');
    const ids = new Set<string>();
    const expenses = new Map(
      data.transactions.filter((t) => t.kind === 'expense').map((t) => [t.id, t]),
    );
    const refunded = new Map<string, number>();
    let total = data.plan?.amount ?? 0;
    for (const tx of data.transactions) {
      if (ids.has(tx.id)) fail('Tệp có mã giao dịch trùng nhau.');
      ids.add(tx.id);
      total += tx.amount;
      if (data.plan && (tx.date < data.plan.startDate || tx.date > data.plan.endDate))
        fail('Giao dịch nằm ngoài thời gian kế hoạch.');
      if (tx.kind !== 'refund' && tx.refundOf) fail('Chỉ khoản hoàn tiền mới có giao dịch gốc.');
      if (tx.kind === 'refund') {
        const original = expenses.get(tx.refundOf ?? '');
        if (!original || original.date > tx.date || original.category !== tx.category)
          fail('Khoản hoàn tiền cần liên kết đúng khoản chi gốc và danh mục.');
        const sum = (refunded.get(tx.refundOf ?? '') ?? 0) + tx.amount;
        refunded.set(tx.refundOf ?? '', sum);
        if (original && sum > original.amount)
          fail('Tổng hoàn tiền không được vượt khoản chi gốc.');
      }
    }
    if (total > 10_000_000_000_000) fail('Tổng dữ liệu vượt giới hạn tiền được hỗ trợ.');
  });

export type Plan = z.infer<typeof planSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export const emptySnapshot = (): Snapshot => ({
  version: 1,
  plan: null,
  transactions: [],
  settings: { petName: 'Mochi', showPet: true, reduceMotion: false },
});
export const categoryFor = (id: CategoryId) => categories.find((c) => c.id === id)!;
export const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
export const shortMoney = (value: number) =>
  Math.abs(value) >= 1_000_000
    ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1_000_000)}tr`
    : `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value / 1000)}k`;
export function todayInZone() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}-${parts.find((p) => p.type === 'day')!.value}`;
}
export const dayCount = (start: string, end: string) =>
  Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86_400_000) + 1;
export function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
export const niceDate = (date: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'numeric',
    ...options,
  }).format(new Date(`${date}T05:00:00Z`));
export const signedAmount = (tx: Transaction) => (tx.kind === 'expense' ? -tx.amount : tx.amount);

export function budgetForDay(plan: Plan, transactions: Transaction[], day: string) {
  const relevant = transactions.filter(
    (t) => t.date <= day && t.date >= plan.startDate && t.date <= plan.endDate,
  );
  const remaining =
    plan.amount - plan.reserve + relevant.reduce((sum, t) => sum + signedAmount(t), 0);
  const active = day >= plan.startDate && day <= plan.endDate;
  const daysLeft = active ? dayCount(day, plan.endDate) : 0;
  const before =
    plan.amount -
    plan.reserve +
    relevant
      .filter((t) => t.date < day || (t.date === day && t.kind === 'topup'))
      .reduce((s, t) => s + signedAmount(t), 0);
  const allowance = active ? Math.max(0, Math.floor(before / daysLeft)) : 0;
  const todayNet = relevant
    .filter((t) => t.date === day && t.kind !== 'topup')
    .reduce((s, t) => s - signedAmount(t), 0);
  const netSpent = relevant
    .filter((t) => t.kind !== 'topup')
    .reduce((s, t) => s - signedAmount(t), 0);
  return {
    active,
    expired: day > plan.endDate,
    upcoming: day < plan.startDate,
    daysLeft,
    remaining,
    allowance,
    todayNet,
    netSpent,
    // A refund can reduce an old deficit without creating spendable cash yet.
    todayRemaining: active ? Math.min(allowance - todayNet, Math.max(0, remaining)) : 0,
    nextAllowance: active && daysLeft > 1 ? Math.max(0, Math.floor(remaining / (daysLeft - 1))) : 0,
    available:
      plan.amount -
      plan.reserve +
      relevant.filter((t) => t.kind === 'topup').reduce((s, t) => s + t.amount, 0),
  };
}

export function planForecast(plan: Plan, transactions: Transaction[], today: string) {
  const asOf = today < plan.endDate ? today : plan.endDate;
  const elapsed = Math.max(0, dayCount(plan.startDate, asOf));
  if (elapsed < 3 || !transactions.some((t) => t.kind === 'expense' && t.date <= asOf)) return null;
  const current = budgetForDay(plan, transactions, today);
  return Math.round(
    current.remaining - (current.netSpent / elapsed) * Math.max(0, current.daysLeft - 1),
  );
}

export function assertUnchanged<T>(expected: T, current: T, label: string) {
  if (JSON.stringify(expected) !== JSON.stringify(current)) {
    throw new Error(
      `${label} đã thay đổi ở tab khác. Đóng và mở lại biểu mẫu để dùng dữ liệu mới; thay đổi mới chưa bị ghi đè.`,
    );
  }
}

export function parseBackup(text: string, today = todayInZone()): Snapshot {
  if (new TextEncoder().encode(text).length > 10 * 1024 * 1024)
    throw new Error('Tệp sao lưu tối đa 10 MB.');
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Tệp không phải JSON hợp lệ.');
  }
  const result = snapshotSchema.safeParse(json);
  if (!result.success) throw new Error(result.error.issues[0].message);
  if (result.data.transactions.some((t) => t.date > today))
    throw new Error(
      'Tệp chứa giao dịch trong tương lai. Kiểm tra ngày trên thiết bị hoặc tệp sao lưu.',
    );
  return result.data;
}

// Prefix formula-like user text so spreadsheet applications treat it as text.
const csvCell = (value: string) =>
  `"${(/^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
export function toCsv(transactions: Transaction[]) {
  return (
    '\uFEFF' +
    [
      ['Ngày', 'Loại', 'Danh mục', 'Số tiền (VND)', 'Ghi chú', 'Giao dịch gốc'],
      ...transactions.map((t) => [
        t.date,
        { expense: 'Chi tiêu', refund: 'Hoàn tiền', topup: 'Bổ sung ngân sách' }[t.kind],
        categoryFor(t.category).name,
        String(t.amount),
        t.note,
        t.refundOf ?? '',
      ]),
    ]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n')
  );
}
