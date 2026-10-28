import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, Info, Minus, Plus } from 'lucide-react';
import {
  addDays,
  categories,
  categoryFor,
  dayCount,
  isDate,
  MAX_MONEY,
  money,
  niceDate,
  planSchema,
  parseMoneyInput,
  TIMEZONE,
  type CategoryId,
  type Plan,
  type Snapshot,
  type Transaction,
} from '../lib/model';
import { CategoryIcon } from './Shared';

export function PlanForm({
  initial,
  today,
  petName = 'Mochi',
  onSave,
}: {
  initial?: Plan;
  today: string;
  petName?: string;
  onSave: (plan: Plan, petName: string, expected: Plan | null) => Promise<void>;
}) {
  const [basePlan] = useState(initial ?? null);
  const [name, setName] = useState(initial?.name ?? 'Một tháng an tâm');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [reserve, setReserve] = useState(initial ? String(initial.reserve) : '0');
  const [mode, setMode] = useState<'days' | 'date'>('days');
  const startDate = basePlan?.startDate ?? today;
  const [days, setDays] = useState(initial ? dayCount(startDate, initial.endDate) : 30);
  const [end, setEnd] = useState(initial?.endDate ?? addDays(today, 29));
  const [pet, setPet] = useState(petName);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const endDate =
    mode === 'date'
      ? end
      : Number.isInteger(days) && days >= 1 && days <= 3660
        ? addDays(startDate, days - 1)
        : startDate;
  const count = dayCount(startDate, endDate);
  const available = parseMoneyInput(amount) - parseMoneyInput(reserve || '0');
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Đặt tên cho kế hoạch của bạn nhé.');
      return;
    }
    const total = parseMoneyInput(amount);
    const kept = parseMoneyInput(reserve || '0');
    if (!Number.isSafeInteger(total) || total <= 0 || total > MAX_MONEY) {
      setError(
        'Nhập số tiền nguyên dương, tối đa 1.000 tỷ đồng. Dấu phân cách chỉ dùng cho nhóm nghìn, ví dụ 1.000.000.',
      );
      return;
    }
    if (!Number.isSafeInteger(kept) || kept < 0 || kept > MAX_MONEY) {
      setError('Khoản giữ lại phải là số tiền nguyên không âm, ví dụ 300.000.');
      return;
    }
    const result = planSchema.safeParse({
      id: initial?.id ?? crypto.randomUUID(),
      name,
      amount: total,
      reserve: kept,
      startDate,
      endDate,
      timezone: TIMEZONE,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (mode === 'days' && (!Number.isInteger(days) || days < 1 || days > 3660)) {
      setError('Chọn từ 1 đến 3.660 ngày.');
      return;
    }
    if (!pet.trim()) {
      setError('Đặt tên cho người bạn nhỏ nhé.');
      return;
    }
    setBusy(true);
    try {
      await onSave(result.data, pet.trim(), basePlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chưa lưu được kế hoạch.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <label>
        Tên kế hoạch
        <input
          value={name}
          maxLength={60}
          required
          onChange={(e) => setName(e.target.value)}
          placeholder="Một tháng an tâm"
        />
      </label>
      <label>
        Số tiền dành cho kỳ này
        <div className="input-suffix">
          <input
            aria-label="Số tiền dành cho kỳ này"
            autoFocus={!initial}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="3.000.000"
            required
          />
          <span>₫</span>
        </div>
      </label>
      <label>
        Khoản muốn giữ lại <span className="optional">· tùy chọn</span>
        <div className="input-suffix">
          <input
            aria-label="Khoản muốn giữ lại"
            inputMode="numeric"
            value={reserve}
            onChange={(e) => setReserve(e.target.value)}
            placeholder="0"
          />
          <span>₫</span>
        </div>
        <small>Phần tiền để dành, không chia vào hạn mức mỗi ngày.</small>
      </label>
      <div>
        <span className="field-label">Bạn muốn dùng trong bao lâu?</span>
        <div className="segmented compact">
          <button
            type="button"
            aria-pressed={mode === 'days'}
            className={mode === 'days' ? 'selected' : ''}
            onClick={() => setMode('days')}
          >
            Số ngày
          </button>
          <button
            type="button"
            aria-pressed={mode === 'date'}
            className={mode === 'date' ? 'selected' : ''}
            onClick={() => setMode('date')}
          >
            Ngày kết thúc
          </button>
        </div>
      </div>
      {mode === 'days' ? (
        <div className="stepper">
          <button
            type="button"
            aria-label="Bớt một ngày"
            onClick={() => setDays((d) => Math.max(1, d - 1))}
          >
            <Minus size={16} />
          </button>
          <label>
            <input
              aria-label="Số ngày"
              type="number"
              min={1}
              max={3660}
              value={Number.isNaN(days) ? '' : days}
              onChange={(e) => setDays(e.target.valueAsNumber)}
            />{' '}
            ngày
          </label>
          <button
            type="button"
            aria-label="Thêm một ngày"
            onClick={() => setDays((d) => Math.min(3660, (d || 0) + 1))}
          >
            <Plus size={16} />
          </button>
        </div>
      ) : (
        <label>
          Ngày kết thúc
          <input
            type="date"
            min={startDate}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </label>
      )}
      <p className="date-hint">
        {niceDate(startDate)} —{' '}
        {isDate(endDate) ? niceDate(endDate, { year: 'numeric' }) : 'Chọn ngày kết thúc'} · Tính cả
        ngày đầu và ngày cuối
      </p>
      {!initial && (
        <label>
          Tên người bạn nhỏ
          <input maxLength={24} value={pet} onChange={(e) => setPet(e.target.value)} required />
        </label>
      )}
      <div className="plan-preview">
        <div>
          <span>Hạn mức ban đầu mỗi ngày</span>
          <strong>
            {Number.isFinite(available) && available > 0 && count > 0 && available <= MAX_MONEY
              ? money(Math.floor(available / count))
              : '—'}
          </strong>
        </div>
        <Info size={19} />
        <small>
          {initial
            ? 'Thay đổi sẽ tính lại hạn mức và giữ nguyên các giao dịch đã ghi.'
            : 'Mỗi ngày, Mơ sẽ điều chỉnh theo số tiền và số ngày còn lại.'}
        </small>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button className="button primary full" disabled={busy} type="submit">
        {busy ? 'Đang lưu…' : initial ? 'Lưu kế hoạch' : 'Bắt đầu cùng Mơ'}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}

export function TransactionForm({
  data,
  today,
  initial,
  onSave,
}: {
  data: Snapshot;
  today: string;
  initial?: Transaction;
  onSave: (tx: Transaction) => Promise<void>;
}) {
  const plan = data.plan!;
  const [kind, setKind] = useState<Transaction['kind']>(initial?.kind ?? 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [category, setCategory] = useState<CategoryId>(initial?.category ?? 'food');
  const [date, setDate] = useState(initial?.date ?? (today > plan.endDate ? plan.endDate : today));
  const [note, setNote] = useState(initial?.note ?? '');
  const [refundOf, setRefundOf] = useState(initial?.refundOf ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const expenses = data.transactions.filter((t) => t.kind === 'expense');
  const original = expenses.find((t) => t.id === refundOf);
  const refundable = original
    ? original.amount -
      data.transactions
        .filter((t) => t.kind === 'refund' && t.refundOf === original.id && t.id !== initial?.id)
        .reduce((sum, t) => sum + t.amount, 0)
    : 0;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const value = parseMoneyInput(amount);
    if (!Number.isSafeInteger(value) || value <= 0 || value > MAX_MONEY) {
      setError('Nhập số tiền nguyên dương, tối đa 1.000 tỷ đồng.');
      return;
    }
    if (date > today) {
      setError('Chỉ ghi giao dịch đến hôm nay.');
      return;
    }
    if (kind === 'refund' && !original) {
      setError('Chọn khoản chi cần hoàn tiền.');
      return;
    }
    const tx: Transaction = {
      id: initial?.id ?? crypto.randomUUID(),
      kind,
      amount: value,
      category: kind === 'refund' ? original!.category : kind === 'topup' ? 'other' : category,
      date,
      note,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      ...(kind === 'refund' ? { refundOf } : {}),
    };
    setBusy(true);
    try {
      await onSave(tx);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chưa lưu được giao dịch.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <div className="segmented">
        {(
          [
            ['expense', 'Chi tiêu'],
            ['refund', 'Hoàn tiền'],
            ['topup', 'Thêm tiền'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={kind === value ? 'selected' : ''}
            aria-pressed={kind === value}
            onClick={() => setKind(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <label>
        Số tiền
        <div className="input-suffix large-input">
          <input
            autoFocus
            aria-label="Số tiền"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
          />
          <span>₫</span>
        </div>
      </label>
      {kind === 'expense' && (
        <fieldset className="category-picker">
          <legend>Danh mục</legend>
          <div>
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                aria-pressed={category === c.id}
                className={category === c.id ? 'picked' : ''}
                onClick={() => setCategory(c.id)}
              >
                <span style={{ background: c.background }}>
                  <CategoryIcon category={c.id} size={19} />
                </span>
                {c.name}
                {category === c.id && <Check className="picked-check" size={12} />}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {kind === 'refund' && (
        <label>
          Khoản chi gốc
          <select required value={refundOf} onChange={(e) => setRefundOf(e.target.value)}>
            <option value="">Chọn khoản chi</option>
            {expenses.map((tx) => (
              <option key={tx.id} value={tx.id}>
                {niceDate(tx.date)} · {tx.note || categoryFor(tx.category).name} ·{' '}
                {money(tx.amount)}
              </option>
            ))}
          </select>
          <small>
            {original
              ? `Còn có thể hoàn ${money(refundable)}. Tiền hoàn trở lại ngân sách của kế hoạch.`
              : 'Hoàn tiền gắn với khoản chi đã ghi, không tạo khoản thu trùng.'}
          </small>
        </label>
      )}
      {kind === 'topup' && (
        <div className="info-box">
          <Info size={18} />
          <span>
            Khoản này bổ sung trực tiếp vào ngân sách và tính lại hạn mức hôm nay. Không tính là chi
            tiêu.
          </span>
        </div>
      )}
      <label>
        Ngày giao dịch
        <input
          type="date"
          required
          value={date}
          min={plan.startDate}
          max={today < plan.endDate ? today : plan.endDate}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <label>
        Ghi chú <span className="optional">· tùy chọn</span>
        <input
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Một bữa trưa ngon, một chút niềm vui…"
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button type="submit" className="button primary full" disabled={busy}>
        {busy ? 'Đang lưu…' : initial ? 'Lưu thay đổi' : 'Lưu giao dịch'}
        <Check size={17} />
      </button>
    </form>
  );
}
