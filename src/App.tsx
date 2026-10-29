import { useEffect, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Flower2,
  Heart,
  LayoutDashboard,
  Leaf,
  ListFilter,
  LoaderCircle,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  WifiOff,
  X,
} from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Cat from './components/Cat';
import { PlanForm, TransactionForm } from './components/Forms';
import Modal from './components/Modal';
import { EmptyState, TransactionList } from './components/Shared';
import { SpendingChart } from './components/Charts';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import Settings from './components/Settings';
import BackupImport from './components/BackupImport';
import { loadSnapshot, saveSnapshot } from './lib/db';
import {
  addDays,
  assertUnchanged,
  budgetForDay,
  dayCount,
  emptySnapshot,
  money,
  niceDate,
  snapshotSchema,
  todayInZone,
  type Plan,
  type Snapshot,
  type Transaction,
} from './lib/model';
import { demoSnapshot } from './lib/demo';
import { useInstall, type OfflineState } from './lib/useInstall';

type Page = 'today' | 'transactions' | 'reports' | 'settings';
const navigation = [
  { id: 'today', label: 'Hôm nay', icon: LayoutDashboard },
  { id: 'transactions', label: 'Giao dịch', icon: ListFilter },
  { id: 'reports', label: 'Phân tích', icon: TrendingUp },
  { id: 'settings', label: 'Cài đặt', icon: Settings2 },
] as const;
type ActiveModal =
  | { type: 'transaction'; transaction?: Transaction }
  | { type: 'plan' }
  | { type: 'delete'; transaction: Transaction }
  | { type: 'import'; data: Snapshot }
  | { type: 'reset' }
  | null;

function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark">
        <Flower2 size={27} strokeWidth={1.7} />
      </span>
      <span>
        mơ<span className="logo-period">.</span>
      </span>
    </span>
  );
}

export default function App() {
  const [saved, setSaved] = useState<Snapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [demo, setDemo] = useState<Snapshot | null>(null);
  const [page, setPage] = useState<Page>('today');
  const [modal, setModal] = useState<ActiveModal>(null);
  const [today, setToday] = useState(todayInZone);
  const [toast, setToast] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [saving, setSaving] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [systemReduce, setSystemReduce] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const mutation = useRef(false);
  const mainRef = useRef<HTMLElement>(null);
  const installation = useInstall();
  const [offlineState, setOfflineState] = useState<OfflineState>(
    import.meta.env.DEV || !('serviceWorker' in navigator) ? 'unavailable' : 'preparing',
  );
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration?.active) setOfflineState('ready');
    },
    onOfflineReady() {
      setOfflineState('ready');
    },
    onRegisterError() {
      setOfflineState('error');
    },
  });
  const data = demo ?? saved;
  const isDemo = demo !== null;
  const reduceMotion = systemReduce || data.settings.reduceMotion;

  useEffect(() => {
    setModal(null);
  }, [data.plan?.id, isDemo]);

  useEffect(() => {
    const subscription = liveQuery(loadSnapshot).subscribe({
      next: (value) => {
        setSaved(value);
        setLoading(false);
      },
      error: () => {
        setLoadError(true);
        setLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const updateDate = () => setToday(todayInZone());
    const updateOnline = () => setOnline(navigator.onLine);
    const interval = setInterval(updateDate, 30_000);
    window.addEventListener('focus', updateDate);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setSystemReduce(media.matches);
    media.addEventListener('change', updateMotion);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', updateDate);
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      media.removeEventListener('change', updateMotion);
    };
  }, []);
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(''), 6000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);
  useEffect(() => {
    document.documentElement.dataset.motion = reduceMotion ? 'reduce' : 'normal';
  }, [reduceMotion]);

  async function update(next: Snapshot) {
    if (mutation.current) throw new Error('Đang lưu thay đổi trước, bạn chờ một chút nhé.');
    const parsed = snapshotSchema.safeParse(next);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);
    mutation.current = true;
    setSaving(true);
    try {
      if (demo) setDemo(parsed.data);
      else {
        await saveSnapshot(parsed.data, saved);
        setSaved(parsed.data);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('tab khác')) throw error;
      throw new Error(
        'Chưa lưu được trên thiết bị. Kiểm tra dung lượng và quyền lưu trữ của trình duyệt, rồi thử lại.',
      );
    } finally {
      mutation.current = false;
      setSaving(false);
    }
  }
  function navigate(next: Page) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      mainRef.current?.focus({ preventScroll: true });
    });
  }
  function openModal(value: ActiveModal) {
    setConfirmError('');
    setConfirmText('');
    setModal(value);
  }
  async function savePlan(plan: Plan, petName: string, expected: Plan | null) {
    assertUnchanged(expected, data.plan, 'Kế hoạch');
    await update({
      ...data,
      plan,
      settings: expected ? data.settings : { ...data.settings, petName },
    });
    setModal(null);
    if (!expected) navigate('today');
    setToast('Kế hoạch đã sẵn sàng. Mình bắt đầu nhẹ nhàng nhé!');
  }
  async function saveTransaction(tx: Transaction) {
    if (modal?.type === 'transaction' && modal.transaction) {
      assertUnchanged(
        modal.transaction,
        data.transactions.find((t) => t.id === tx.id),
        'Giao dịch',
      );
    }
    await update({
      ...data,
      transactions: [...data.transactions.filter((t) => t.id !== tx.id), tx],
    });
    setModal(null);
    setToast(
      tx.date > today
        ? `Đã lưu giao dịch dự kiến ngày ${niceDate(tx.date, { year: 'numeric' })}.`
        : data.plan && (tx.date < data.plan.startDate || tx.date > data.plan.endDate)
          ? 'Đã lưu giao dịch vào lịch sử ngoài kỳ ngân sách.'
          : tx.kind === 'topup'
            ? 'Đã thêm tiền và tính lại hạn mức.'
            : tx.kind === 'refund'
              ? 'Đã ghi hoàn tiền vào ngân sách.'
              : 'Đã lưu khoản chi. Mỗi chút đều có ý nghĩa!',
    );
  }
  async function confirmAction(action: () => Promise<void>) {
    setConfirmError('');
    try {
      await action();
      setModal(null);
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : 'Thao tác chưa hoàn tất.');
    }
  }
  const addTransaction = () => openModal({ type: 'transaction' });
  const editTransaction = (transaction: Transaction) =>
    openModal({ type: 'transaction', transaction });
  const deleteTransaction = (transaction: Transaction) =>
    openModal({ type: 'delete', transaction });
  const budget = data.plan ? budgetForDay(data.plan, data.transactions, today) : null;
  const heroValue = budget
    ? budget.expired || budget.upcoming
      ? budget.remaining
      : Math.abs(budget.todayRemaining)
    : 0;

  if (loading)
    return (
      <div className="loading-screen">
        <Logo />
        <LoaderCircle className="spin" size={25} />
        <p>Chuẩn bị một góc nhỏ cho bạn…</p>
      </div>
    );
  if (loadError)
    return (
      <div className="loading-screen">
        <Logo />
        <h1>Chưa mở được dữ liệu trên thiết bị</h1>
        <p>
          Thử cho phép lưu trữ trang hoặc mở bằng trình duyệt thông thường. Mơ chưa thay thế dữ liệu
          hiện có của bạn.
        </p>
        <button className="button primary" onClick={() => location.reload()}>
          Thử tải lại
        </button>
      </div>
    );

  return (
    <>
      <a href="#main-content" className="skip-link">
        Đến nội dung chính
      </a>
      {!data.plan ? (
        <div className="onboarding">
          <div className="onboarding-story">
            <Logo />
            <span className="pill">
              <Sparkles size={13} />
              MỘT CHÚT MỖI NGÀY
            </span>
            <h1>
              Nhẹ ví.
              <br />
              Nhẹ lòng.
              <br />
              <span>Thêm một chút vui.</span>
            </h1>
            <p>
              Biết hôm nay mình có thể tiêu bao nhiêu.
              <br />
              Để dành tâm trí cho những điều bạn yêu.
            </p>
            <Cat className="onboarding-cat" />
            <div className="onboarding-promise">
              <ShieldCheck size={19} />
              <span>Không cần tài khoản · Dữ liệu ở trên thiết bị của bạn</span>
            </div>
          </div>
          <main id="main-content" className="onboarding-form" ref={mainRef} tabIndex={-1}>
            <div className="onboarding-form-inner">
              <span className="eyebrow">CHÀO BẠN, MÌNH LÀ MƠ</span>
              <h2>Mình bắt đầu từ đây nhé.</h2>
              <p className="muted intro-copy">Một kế hoạch nhỏ, cho những ngày an tâm hơn.</p>
              <PlanForm today={today} onSave={savePlan} />
              <div className="demo-entry">
                <span>Muốn dạo một vòng trước?</span>
                <button
                  className="text-button"
                  onClick={() => {
                    setDemo(demoSnapshot(today));
                    navigate('today');
                  }}
                >
                  Khám phá bản mẫu
                  <ArrowRight size={15} />
                </button>
              </div>
              <div className="restore-entry">
                <span>Đã có dữ liệu từ thiết bị khác?</span>
                <BackupImport
                  compact
                  onImport={(imported) => openModal({ type: 'import', data: imported })}
                  notify={setToast}
                />
              </div>
            </div>
          </main>
        </div>
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <button
              className="logo-button"
              onClick={() => navigate('today')}
              aria-label="Mơ, về Hôm nay"
            >
              <Logo />
            </button>
            <p className="sidebar-caption">MỘT CHÚT MỖI NGÀY</p>
            <nav aria-label="Điều hướng chính">
              {navigation.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  aria-current={page === id ? 'page' : undefined}
                  className={`nav-item ${page === id ? 'active' : ''}`}
                  onClick={() => navigate(id)}
                >
                  <Icon size={20} strokeWidth={1.7} />
                  <span>{label}</span>
                  {page === id && <span className="active-dot" />}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-note">
                <Leaf size={23} strokeWidth={1.4} />
                <p>
                  Chậm một chút.
                  <br />
                  An tâm nhiều hơn.
                </p>
                <span>Mỗi bước nhỏ đều đáng quý.</span>
              </div>
              <div className="profile">
                <span className="avatar">B</span>
                <div>
                  <strong>Góc nhỏ của bạn</strong>
                  <span>
                    <i />
                    {isDemo ? 'Đang xem bản mẫu' : 'Chỉ trên thiết bị này'}
                  </span>
                </div>
                <Heart size={15} />
              </div>
            </div>
          </aside>
          <div className="app-main">
            <header className="topbar">
              <span className="breadcrumb">
                Không gian của bạn
                <ChevronRight size={13} />
                <strong>{navigation.find((n) => n.id === page)!.label}</strong>
              </span>
              <span className="mobile-logo">
                <Logo />
              </span>
              <div className="topbar-right">
                <span className="save-status">
                  {saving ? (
                    <>
                      <LoaderCircle size={12} className="spin" />
                      Đang lưu
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={13} />
                      {isDemo ? 'Dữ liệu mẫu' : 'Lưu trên thiết bị'}
                    </>
                  )}
                </span>
                <span className="topbar-divider" />
                <span className="date-display">
                  <CalendarDays size={15} />
                  {niceDate(today, { weekday: 'short', year: 'numeric' })}
                </span>
                <span className="avatar small-avatar">B</span>
                <button className="button primary add-transaction" onClick={addTransaction}>
                  <Plus size={18} />
                  Thêm giao dịch
                </button>
              </div>
            </header>
            {isDemo && (
              <div className="demo-banner">
                <span>
                  <Sparkles size={15} />
                  Bạn đang khám phá dữ liệu mẫu. Thay đổi ở đây không ảnh hưởng dữ liệu thật.
                </span>
                <button
                  onClick={() => {
                    setDemo(null);
                    setModal(null);
                    navigate('today');
                  }}
                >
                  Thoát bản mẫu
                  <X size={14} />
                </button>
              </div>
            )}
            {!online && (
              <div className="offline-banner">
                <WifiOff size={15} />
                Bạn đang offline. Vẫn có thể ghi chi và xem dữ liệu trên thiết bị.
              </div>
            )}
            <main id="main-content" className="main-content" ref={mainRef} tabIndex={-1}>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    {page === 'today'
                      ? 'MỘT NGÀY MỚI, MỘT CHÚT AN TÂM'
                      : page === 'transactions'
                        ? 'TỪNG KHOẢN NHỎ ĐỀU CÓ CÂU CHUYỆN'
                        : page === 'reports'
                          ? 'HIỂU MÌNH HƠN QUA NHỮNG CON SỐ'
                          : 'GÓC NHỎ, THEO CÁCH CỦA BẠN'}
                  </span>
                  <h1>
                    {page === 'today' ? (
                      <>
                        Chào bạn, <span>hôm nay ổn chứ?</span>
                        <span className="greeting-sparkle">✳</span>
                      </>
                    ) : page === 'transactions' ? (
                      'Những khoản đã ghi'
                    ) : page === 'reports' ? (
                      'Bức tranh chi tiêu'
                    ) : (
                      'Một chút tùy chỉnh'
                    )}
                  </h1>
                  <p>
                    {page === 'today'
                      ? 'Cùng Mơ chăm chút chiếc ví, từng ngày một.'
                      : page === 'transactions'
                        ? 'Ghi lại để hiểu mình, không phải để khắt khe với mình.'
                        : page === 'reports'
                          ? 'Những con số nhỏ kể câu chuyện về thói quen của bạn.'
                          : 'Để Mơ trở thành người bạn phù hợp hơn với bạn.'}
                  </p>
                </div>
              </div>
              {page === 'today' && budget && (
                <>
                  <div className={`hero-grid ${!data.settings.showPet ? 'without-pet' : ''}`}>
                    <section className="budget-card">
                      <div className="budget-card-top">
                        <span className="pill">
                          <span className="status-dot" />
                          {budget.expired
                            ? 'KẾ HOẠCH ĐÃ KẾT THÚC'
                            : budget.upcoming
                              ? 'KẾ HOẠCH SẮP BẮT ĐẦU'
                              : 'CHIẾC VÍ HÔM NAY'}
                        </span>
                        <span>{niceDate(today, { weekday: 'long' })}</span>
                      </div>
                      <p className="budget-label">
                        {budget.expired
                          ? 'Số tiền còn lại cuối kỳ'
                          : budget.upcoming
                            ? 'Ngân sách sẵn sàng'
                            : budget.todayRemaining < 0
                              ? 'Bạn đã vượt hạn mức hôm nay'
                              : 'Hôm nay bạn còn có thể tiêu'}
                      </p>
                      <div
                        className={`hero-amount ${budget.todayRemaining < 0 ? 'over-budget' : ''}`}
                      >
                        <strong
                          className={`hero-value ${Math.abs(heroValue) >= 1_000_000_000 ? 'large-money' : ''}`}
                        >
                          {money(heroValue)}
                        </strong>
                        <span>{budget.active ? '/ hôm nay' : '/ kế hoạch'}</span>
                      </div>
                      {budget.active ? (
                        <>
                          <div className="budget-progress">
                            <span
                              style={{
                                width: `${Math.min(100, Math.max(0, budget.allowance > 0 ? (budget.todayNet / budget.allowance) * 100 : budget.todayNet > 0 ? 100 : 0))}%`,
                              }}
                            />
                          </div>
                          <div className="budget-progress-labels">
                            <span>
                              Đã chi ròng <strong>{money(budget.todayNet)}</strong>
                            </span>
                            <span>
                              Hạn mức <strong>{money(budget.allowance)}</strong>
                            </span>
                          </div>
                          <div className="budget-tip">
                            <span>
                              <Leaf size={15} />
                              {budget.todayRemaining < 0
                                ? 'Mình điều chỉnh những ngày tới, từng chút một nhé.'
                                : budget.todayNet === 0
                                  ? 'Một khởi đầu mới. Hãy ưu tiên những điều bạn cần.'
                                  : 'Mỗi khoản được ghi lại là một bước hiểu mình hơn.'}
                            </span>
                            {budget.daysLeft > 1 && (
                              <small>
                                Nếu dừng chi hôm nay: {money(budget.nextAllowance)}/ngày còn lại
                              </small>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="muted">
                            {budget.expired
                              ? 'Bạn có thể ghi bổ sung khoản chi trong kỳ hoặc điều chỉnh ngày kết thúc.'
                              : `Bắt đầu từ ${niceDate(data.plan.startDate)}.`}
                          </p>
                          <button
                            className="button soft"
                            onClick={() => openModal({ type: 'plan' })}
                          >
                            Điều chỉnh kế hoạch
                            <ArrowRight size={16} />
                          </button>
                        </>
                      )}
                    </section>
                    {data.settings.showPet && (
                      <section className="pet-card">
                        <div className="pet-topline">
                          <span className="pill">
                            <Sparkles size={12} />
                            GÓC CỦA {data.settings.petName.toLocaleUpperCase('vi-VN')}
                          </span>
                          <span className="pet-flower">✿</span>
                        </div>
                        <div className="pet-content">
                          <div>
                            <h2>
                              {budget.todayRemaining < 0
                                ? 'Mình cùng cân bằng lại nhé.'
                                : 'Tích một chút nhỏ,\nvui một chút to.'}
                            </h2>
                            <p>
                              {budget.expired
                                ? 'Một chặng đường đã khép lại. Cảm ơn bạn đã chăm chút cho mình.'
                                : budget.todayRemaining < 0
                                  ? 'Có những ngày cần chi nhiều hơn. Ghi đúng thực tế là điều tốt rồi.'
                                  : `Mình là ${data.settings.petName}, ở đây cùng bạn chăm chút những dự định nhỏ.`}
                            </p>
                          </div>
                          <Cat />
                        </div>
                        <div className="pet-footer">
                          <Heart size={13} />
                          Không cần hoàn hảo, chỉ cần đều đặn.
                        </div>
                      </section>
                    )}
                  </div>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="mini-icon mint">
                        <Wallet size={20} />
                      </span>
                      <span>Ngân sách còn lại</span>
                      <strong>{money(budget.remaining)}</strong>
                      <small>Trong {data.plan.name.toLocaleLowerCase('vi-VN')}</small>
                    </div>
                    <div className="stat-card">
                      <span className="mini-icon peach">
                        <ArrowDownRight size={20} />
                      </span>
                      <span>Đã chi trong kỳ</span>
                      <strong>{money(budget.netSpent)}</strong>
                      <small>Đã trừ các khoản hoàn tiền</small>
                    </div>
                    <div className="stat-card">
                      <span className="mini-icon lavender">
                        <CalendarDays size={20} />
                      </span>
                      <span>Chặng đường còn lại</span>
                      <strong>
                        {budget.daysLeft}
                        <em> ngày</em>
                      </strong>
                      <small>
                        Đến {niceDate(data.plan.endDate, { year: 'numeric' })} · gồm hôm nay
                      </small>
                    </div>
                  </div>
                  <div className="home-bottom-grid">
                    <section className="panel">
                      <div className="section-heading">
                        <div>
                          <h2>Nhịp chi tiêu của bạn</h2>
                          <p>Chậm lại một chút, nhìn rõ hơn một chút.</p>
                        </div>
                        <button className="text-button" onClick={() => navigate('reports')}>
                          Phân tích
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      {data.transactions.some(
                        (t) =>
                          t.kind !== 'topup' &&
                          t.date <= today &&
                          t.date >= data.plan!.startDate &&
                          t.date <= data.plan!.endDate,
                      ) ? (
                        <>
                          <div className="chart-legend">
                            <span>
                              <i className="green-dot" />
                              Chi ròng
                            </span>
                            <span>
                              <i className="purple-dot" />
                              Hạn mức mỗi ngày
                            </span>
                          </div>
                          <SpendingChart
                            plan={data.plan}
                            transactions={data.transactions}
                            start={
                              data.plan.startDate > addDays(today, -6)
                                ? data.plan.startDate
                                : data.plan.endDate < today
                                  ? dayCount(data.plan.startDate, data.plan.endDate) < 7
                                    ? data.plan.startDate
                                    : addDays(data.plan.endDate, -6)
                                  : addDays(today, -6)
                            }
                            end={today < data.plan.endDate ? today : data.plan.endDate}
                            reduceMotion={reduceMotion}
                          />
                        </>
                      ) : (
                        <EmptyState
                          title="Những nhịp đầu tiên"
                          detail="Biểu đồ sẽ xuất hiện khi bạn ghi lại khoản chi đầu tiên."
                          onAdd={addTransaction}
                        />
                      )}
                    </section>
                    <section className="panel recent-panel">
                      <div className="section-heading">
                        <div>
                          <h2>Vừa mới ghi</h2>
                          <p>Những điều nhỏ trong ngày</p>
                        </div>
                        <button className="text-button" onClick={() => navigate('transactions')}>
                          Tất cả
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      {data.transactions.length ? (
                        <TransactionList
                          today={today}
                          plan={data.plan}
                          transactions={[...data.transactions]
                            .sort(
                              (a, b) =>
                                b.date.localeCompare(a.date) ||
                                b.createdAt.localeCompare(a.createdAt),
                            )
                            .slice(0, 4)}
                          onEdit={editTransaction}
                          onDelete={deleteTransaction}
                        />
                      ) : (
                        <EmptyState
                          title="Chiếc sổ còn thơm mùi mới"
                          detail="Một ly cà phê, một bữa ăn… bắt đầu từ khoản nhỏ nhất nhé."
                        />
                      )}
                    </section>
                  </div>
                  <div className="gentle-note">
                    <span>✳</span>
                    <p>Quản lý tiền cũng là một cách chăm sóc bản thân.</p>
                    <Heart size={14} />
                  </div>
                </>
              )}
              {page === 'transactions' && (
                <Transactions
                  data={data}
                  today={today}
                  onAdd={addTransaction}
                  onEdit={editTransaction}
                  onDelete={deleteTransaction}
                />
              )}
              {page === 'reports' && (
                <Reports data={data} today={today} reduceMotion={reduceMotion} />
              )}
              {page === 'settings' && (
                <Settings
                  key={`${data.plan.id}-${isDemo}`}
                  data={data}
                  today={today}
                  isDemo={isDemo}
                  onSave={async (settings, expected) => {
                    assertUnchanged(expected, data.settings, 'Tùy chọn');
                    await update({ ...data, settings });
                  }}
                  onEditPlan={() => openModal({ type: 'plan' })}
                  onImport={(imported) => openModal({ type: 'import', data: imported })}
                  onReset={() => openModal({ type: 'reset' })}
                  notify={setToast}
                  installation={installation}
                  offline={offlineState}
                />
              )}
              <footer className="page-footer">
                <span>
                  <Flower2 size={13} />
                  Một chút mỗi ngày, an tâm cả tháng.
                </span>
                <span>Được làm với sự dịu dàng.</span>
              </footer>
            </main>
          </div>
          <nav className="mobile-nav" aria-label="Điều hướng trên điện thoại">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                aria-current={page === id ? 'page' : undefined}
                className={page === id ? 'active' : ''}
                onClick={() => navigate(id)}
              >
                <Icon size={21} strokeWidth={1.7} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
      {modal?.type === 'transaction' && data.plan && (
        <Modal
          title={modal.transaction ? 'Chỉnh một khoản đã ghi' : 'Ghi một khoản nhỏ'}
          subtitle="Chỉ vài giây, để chiếc ví rõ ràng hơn."
          onClose={() => !saving && setModal(null)}
        >
          <TransactionForm
            data={data}
            today={today}
            initial={modal.transaction}
            onSave={saveTransaction}
          />
        </Modal>
      )}
      {modal?.type === 'plan' && data.plan && (
        <Modal
          title="Chăm chút lại kế hoạch"
          subtitle="Các giao dịch đã ghi được giữ nguyên. Hạn mức sẽ tính lại theo kế hoạch mới."
          onClose={() => !saving && setModal(null)}
        >
          <PlanForm
            initial={data.plan!}
            today={today}
            petName={data.settings.petName}
            onSave={savePlan}
          />
        </Modal>
      )}
      {modal?.type === 'delete' && (
        <Modal
          title="Xóa giao dịch này?"
          subtitle={`Khoản ${money(modal.transaction.amount)} sẽ được bỏ khỏi kế hoạch và hạn mức được tính lại.`}
          onClose={() => !saving && setModal(null)}
        >
          {data.transactions.some((t) => t.refundOf === modal.transaction.id) && (
            <p className="info-box">
              Các khoản hoàn tiền liên kết cũng sẽ được xóa cùng khoản chi gốc.
            </p>
          )}
          <div className="modal-actions">
            <button className="button soft" onClick={() => setModal(null)} disabled={saving}>
              Giữ lại
            </button>
            <button
              className="button danger"
              disabled={saving}
              onClick={() =>
                confirmAction(async () => {
                  assertUnchanged(
                    modal.transaction,
                    data.transactions.find((t) => t.id === modal.transaction.id),
                    'Giao dịch',
                  );
                  await update({
                    ...data,
                    transactions: data.transactions.filter(
                      (t) => t.id !== modal.transaction.id && t.refundOf !== modal.transaction.id,
                    ),
                  });
                  setToast('Đã xóa giao dịch và tính lại ngân sách.');
                })
              }
            >
              Xóa giao dịch
            </button>
          </div>
          {confirmError && (
            <p role="alert" className="form-error">
              {confirmError}
            </p>
          )}
        </Modal>
      )}
      {modal?.type === 'import' && (
        <Modal
          title="Khôi phục bản sao lưu?"
          subtitle="Dữ liệu hiện tại sẽ được thay thế sau khi bạn xác nhận. Hãy xuất bản sao lưu hiện tại trước nếu cần giữ lại."
          onClose={() => !saving && setModal(null)}
        >
          <div className="import-summary">
            <strong>{modal.data.plan?.name ?? 'Chưa có kế hoạch'}</strong>
            <span>{modal.data.transactions.length} giao dịch · Định dạng phiên bản 1</span>
            {modal.data.plan && (
              <span>
                {niceDate(modal.data.plan.startDate)} —{' '}
                {niceDate(modal.data.plan.endDate, { year: 'numeric' })}
              </span>
            )}
          </div>
          <div className="modal-actions">
            <button className="button soft" onClick={() => setModal(null)} disabled={saving}>
              Hủy
            </button>
            <button
              className="button primary"
              disabled={saving}
              onClick={() =>
                confirmAction(async () => {
                  await update(modal.data);
                  navigate('today');
                  setToast('Đã khôi phục dữ liệu từ bản sao lưu.');
                })
              }
            >
              Thay thế và khôi phục
            </button>
          </div>
          {confirmError && (
            <p role="alert" className="form-error">
              {confirmError}
            </p>
          )}
        </Modal>
      )}
      {modal?.type === 'reset' && (
        <Modal
          title="Bắt đầu một trang mới?"
          subtitle="Thao tác này xóa toàn bộ dữ liệu Mơ trên thiết bị này. Bạn nên xuất bản sao lưu JSON trước khi tiếp tục."
          onClose={() => !saving && setModal(null)}
        >
          <label>
            Nhập XÓA để xác nhận
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </label>
          <div className="modal-actions">
            <button className="button soft" onClick={() => setModal(null)} disabled={saving}>
              Giữ dữ liệu
            </button>
            <button
              className="button danger"
              disabled={confirmText !== 'XÓA' || saving}
              onClick={() =>
                confirmAction(async () => {
                  await update(emptySnapshot());
                  navigate('today');
                  setToast('Đã xóa dữ liệu trên thiết bị này.');
                })
              }
            >
              Xóa toàn bộ dữ liệu
            </button>
          </div>
          {confirmError && (
            <p role="alert" className="form-error">
              {confirmError}
            </p>
          )}
        </Modal>
      )}
      {needRefresh && (
        <div className="update-banner" role="status">
          <span>
            <Sparkles size={18} />
            Mơ có phiên bản mới.
          </span>
          <button
            className="text-button"
            disabled={saving || !!modal}
            onClick={() => updateServiceWorker(true)}
          >
            Cập nhật
          </button>
          <button className="icon-button" aria-label="Để sau" onClick={() => setNeedRefresh(false)}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            <Check size={18} />
            <span>{toast}</span>
            <button
              aria-label="Đóng thông báo"
              className="icon-button"
              onClick={() => setToast('')}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
