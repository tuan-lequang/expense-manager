import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { categories, money, type Snapshot, type Transaction } from '../lib/model';
import { EmptyState, TransactionList } from './Shared';

export default function Transactions({
  data,
  today,
  onAdd,
  onEdit,
  onDelete,
}: {
  data: Snapshot;
  today: string;
  onAdd: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [kind, setKind] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replaceAll('đ', 'd')
      .toLowerCase();
  const filtered = data.transactions
    .filter(
      (t) =>
        (category === 'all' || t.category === category) &&
        (kind === 'all' || t.kind === kind) &&
        (!from || t.date >= from) &&
        (!to || t.date <= to) &&
        normalize(`${t.note} ${categories.find((c) => c.id === t.category)!.name}`).includes(
          normalize(query),
        ),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const active = query || category !== 'all' || kind !== 'all' || from || to;
  const pages = Math.max(1, Math.ceil(filtered.length / 15));
  const safePage = Math.min(page, pages - 1);
  const update = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(0);
  };
  const net = filtered
    .filter((t) => t.kind !== 'topup')
    .reduce((s, t) => s + (t.kind === 'expense' ? t.amount : -t.amount), 0);
  return (
    <section className="panel transactions-panel">
      <div className="transaction-filters">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Tìm giao dịch"
            placeholder="Tìm một khoản chi…"
            value={query}
            onChange={(e) => update(setQuery, e.target.value)}
          />
        </div>
        <select
          aria-label="Lọc danh mục"
          value={category}
          onChange={(e) => update(setCategory, e.target.value)}
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc loại giao dịch"
          value={kind}
          onChange={(e) => update(setKind, e.target.value)}
        >
          <option value="all">Mọi giao dịch</option>
          <option value="expense">Chi tiêu</option>
          <option value="refund">Hoàn tiền</option>
          <option value="topup">Bổ sung ngân sách</option>
        </select>
      </div>
      <div className="date-filters">
        <SlidersHorizontal size={16} />
        <label>
          Từ ngày
          <input
            type="date"
            min={data.plan!.startDate}
            max={to || today}
            value={from}
            onChange={(e) => update(setFrom, e.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            min={from || data.plan!.startDate}
            max={today}
            value={to}
            onChange={(e) => update(setTo, e.target.value)}
          />
        </label>
        {active && (
          <button
            className="text-button"
            onClick={() => {
              setQuery('');
              setCategory('all');
              setKind('all');
              setFrom('');
              setTo('');
              setPage(0);
            }}
          >
            <X size={14} />
            Xóa bộ lọc
          </button>
        )}
      </div>
      <div className="list-summary">
        <span>{filtered.length} giao dịch</span>
        <span>
          Chi ròng: <strong>{money(net)}</strong>
        </span>
      </div>
      {filtered.length ? (
        <TransactionList
          transactions={filtered.slice(safePage * 15, safePage * 15 + 15)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <EmptyState
          title={active ? 'Chưa tìm thấy giao dịch phù hợp' : undefined}
          detail={active ? 'Thử đổi từ khóa hoặc khoảng thời gian nhé.' : undefined}
          onAdd={active ? undefined : onAdd}
        />
      )}
      {pages > 1 && (
        <div className="pagination">
          <button
            className="button soft small"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            Trước
          </button>
          <span>
            {safePage + 1} / {pages}
          </span>
          <button
            className="button soft small"
            disabled={safePage >= pages - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Sau
          </button>
        </div>
      )}
    </section>
  );
}
