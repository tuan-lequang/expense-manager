import {
  ArrowDownLeft,
  ArrowUpRight,
  Bus,
  Coffee,
  Heart,
  House,
  MoreHorizontal,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import { categoryFor, money, niceDate, type CategoryId, type Transaction } from '../lib/model';

const icons: Record<CategoryId, LucideIcon> = {
  food: Utensils,
  transport: Bus,
  shopping: ShoppingBag,
  bills: House,
  fun: Sparkles,
  health: Heart,
  other: MoreHorizontal,
};
export function CategoryIcon({ category, size = 20 }: { category: CategoryId; size?: number }) {
  const Icon = icons[category];
  return <Icon size={size} strokeWidth={1.7} />;
}
export function EmptyState({
  title = 'Một trang mới, thật nhẹ nhàng',
  detail = 'Ghi khoản chi đầu tiên để bắt đầu hiểu dòng tiền của mình.',
  onAdd,
}: {
  title?: string;
  detail?: string;
  onAdd?: () => void;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Coffee size={27} strokeWidth={1.3} />
      </span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {onAdd && (
        <button className="button soft small" onClick={onAdd}>
          <Plus size={16} />
          Ghi khoản chi đầu tiên
        </button>
      )}
    </div>
  );
}
export function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}) {
  return (
    <div className="transaction-list">
      {transactions.map((tx) => {
        const category = categoryFor(tx.category);
        return (
          <div className="transaction-row" key={tx.id}>
            <span
              className="category-icon"
              style={{ background: tx.kind === 'topup' ? '#e6f0e8' : category.background }}
            >
              {tx.kind === 'topup' ? (
                <ArrowDownLeft size={20} />
              ) : tx.kind === 'refund' ? (
                <ArrowUpRight size={20} />
              ) : (
                <CategoryIcon category={tx.category} />
              )}
            </span>
            <div className="transaction-description">
              <strong>
                {tx.note ||
                  (tx.kind === 'topup'
                    ? 'Thêm tiền vào kế hoạch'
                    : tx.kind === 'refund'
                      ? 'Hoàn tiền'
                      : category.name)}
              </strong>
              <span>
                {tx.kind === 'topup'
                  ? 'Bổ sung ngân sách'
                  : tx.kind === 'refund'
                    ? `Hoàn tiền · ${category.name}`
                    : category.name}
                <i>·</i>
                {niceDate(tx.date)}
              </span>
            </div>
            <strong className={`transaction-amount ${tx.kind !== 'expense' ? 'positive' : ''}`}>
              {tx.kind === 'expense' ? '−' : '+'}
              {money(tx.amount)}
            </strong>
            <div className="row-actions">
              <button
                className="icon-button"
                aria-label={`Sửa ${tx.note || category.name}`}
                onClick={() => onEdit(tx)}
              >
                <Pencil size={15} />
              </button>
              <button
                className="icon-button delete"
                aria-label={`Xóa ${tx.note || category.name}`}
                onClick={() => onDelete(tx)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
