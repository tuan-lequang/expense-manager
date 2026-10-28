import { useState } from 'react';
import { ArrowDownRight, ChartNoAxesCombined, CircleHelp, Coins, Wallet } from 'lucide-react';
import {
  addDays,
  budgetForDay,
  dayCount,
  isDate,
  money,
  niceDate,
  planForecast,
  type Snapshot,
} from '../lib/model';
import { CategoryChart, SpendingChart } from './Charts';
import { EmptyState } from './Shared';

export default function Reports({
  data,
  today,
  reduceMotion,
}: {
  data: Snapshot;
  today: string;
  reduceMotion: boolean;
}) {
  const plan = data.plan!;
  const [range, setRange] = useState('period');
  const [customStart, setCustomStart] = useState(plan.startDate);
  const [customEnd, setCustomEnd] = useState(today < plan.endDate ? today : plan.endDate);
  const [showTable, setShowTable] = useState(false);
  const end = range === 'custom' ? customEnd : today < plan.endDate ? today : plan.endDate;
  const candidate =
    range === 'period'
      ? plan.startDate
      : range === 'custom'
        ? customStart
        : addDays(end, range === '7' ? -6 : -29);
  const start = candidate < plan.startDate ? plan.startDate : candidate;
  const invalid =
    !isDate(start) ||
    !isDate(end) ||
    start > end ||
    (range === 'custom' && customStart < plan.startDate) ||
    end > today ||
    end > plan.endDate;
  const transactions = invalid
    ? []
    : data.transactions.filter((t) => t.date >= start && t.date <= end);
  const expenses = transactions
    .filter((t) => t.kind === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const refunds = transactions.filter((t) => t.kind === 'refund').reduce((s, t) => s + t.amount, 0);
  const net = expenses - refunds;
  const days = invalid ? 0 : dayCount(start, end);
  const forecast = planForecast(plan, data.transactions, today);
  const chartStart = !invalid && dayCount(start, end) > 31 ? addDays(end, -30) : start;
  const rows = invalid
    ? []
    : Array.from({ length: dayCount(chartStart, end) }, (_, i) => {
        const date = addDays(chartStart, i);
        return { date, ...budgetForDay(plan, data.transactions, date) };
      });
  return (
    <>
      <div className="report-toolbar">
        <div>
          <span className="eyebrow">NHÌN LẠI MỘT CHÚT</span>
          <p>Hiểu thói quen, chọn điều mình muốn ưu tiên.</p>
        </div>
        <select
          aria-label="Khoảng thời gian phân tích"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="period">Từ đầu kế hoạch</option>
          <option value="7">7 ngày gần đây</option>
          <option value="30">30 ngày gần đây</option>
          <option value="custom">Tùy chọn ngày</option>
        </select>
      </div>
      {range === 'custom' && (
        <div className="date-filters">
          <label>
            Từ ngày
            <input
              type="date"
              min={plan.startDate}
              max={end}
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </label>
          <label>
            Đến ngày
            <input
              type="date"
              min={customStart}
              max={today < plan.endDate ? today : plan.endDate}
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </label>
        </div>
      )}
      {invalid ? (
        <p className="form-error" role="alert">
          Chọn khoảng ngày hợp lệ trong thời gian kế hoạch, đến tối đa hôm nay.
        </p>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="mini-icon peach">
                <Wallet size={20} />
              </span>
              <span>Tổng chi ròng</span>
              <strong>{money(net)}</strong>
              <small>
                Chi {money(expenses)} · hoàn {money(refunds)}
              </small>
            </div>
            <div className="stat-card">
              <span className="mini-icon mint">
                <Coins size={20} />
              </span>
              <span>Trung bình mỗi ngày</span>
              <strong>{money(Math.round(net / days))}</strong>
              <small>Trong {days} ngày, kể cả ngày không chi</small>
            </div>
            <div className="stat-card">
              <span className="mini-icon lavender">
                <ChartNoAxesCombined size={20} />
              </span>
              <span>Giao dịch trong khoảng</span>
              <strong>
                {transactions.length}
                <em> giao dịch</em>
              </strong>
              <small>
                {niceDate(start)} — {niceDate(end)}
              </small>
            </div>
          </div>
          <div className="report-grid">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Nhịp chi tiêu</h2>
                  <p>
                    {niceDate(chartStart)} — {niceDate(end)}
                    {chartStart !== start ? ' · 31 ngày cuối của khoảng chọn' : ''}
                  </p>
                </div>
                <span className="mini-icon mint">
                  <ArrowDownRight size={18} />
                </span>
              </div>
              <div className="chart-legend">
                <span>
                  <i className="green-dot" />
                  Chi ròng
                </span>
                <span>
                  <i className="purple-dot" />
                  Hạn mức
                </span>
              </div>
              <SpendingChart
                plan={plan}
                transactions={data.transactions}
                start={chartStart}
                end={end}
                reduceMotion={reduceMotion}
              />
              <button className="text-button" onClick={() => setShowTable((v) => !v)}>
                {showTable ? 'Ẩn bảng số liệu' : 'Xem bảng số liệu theo ngày'}
              </button>
              {showTable && (
                <div className="data-table">
                  <table>
                    <caption>Chi ròng và hạn mức trong khoảng biểu đồ</caption>
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Chi ròng</th>
                        <th>Hạn mức</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.date}>
                          <td>{niceDate(row.date)}</td>
                          <td>{money(row.todayNet)}</td>
                          <td>{money(row.allowance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Tiền đã đi đâu?</h2>
                  <p>Chi tiêu theo danh mục</p>
                </div>
              </div>
              {transactions.some((t) => t.kind !== 'topup') ? (
                <>
                  <CategoryChart transactions={transactions} reduceMotion={reduceMotion} />
                  <p className="chart-footnote">
                    Tỷ trọng chỉ tính các nhóm có chi ròng dương; đã trừ hoàn tiền trong khoảng
                    chọn.
                  </p>
                </>
              ) : (
                <EmptyState
                  title="Chưa có chi tiêu trong khoảng này"
                  detail="Chọn khoảng khác hoặc ghi khoản chi đầu tiên."
                />
              )}
            </section>
          </div>
          <section className="forecast-card">
            <span className="mini-icon lavender">
              <CircleHelp size={21} />
            </span>
            <div>
              <h3>Một góc nhìn về cuối kỳ</h3>
              <p>
                {forecast === null
                  ? 'Cần ít nhất 3 ngày và một khoản chi để có ước tính hữu ích.'
                  : `Nếu giữ mức chi trung bình từ đầu kế hoạch, cuối kỳ bạn ${forecast >= 0 ? 'có thể còn' : 'có thể thiếu'} ${money(Math.abs(forecast))}.`}
              </p>
              <small>
                Đây là ước tính từ dữ liệu đã ghi, chưa bao gồm các khoản chi tương lai bạn chưa
                nhập.
              </small>
            </div>
          </section>
        </>
      )}
    </>
  );
}
