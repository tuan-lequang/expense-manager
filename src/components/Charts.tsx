import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  addDays,
  budgetForDay,
  categories,
  dayCount,
  niceDate,
  shortMoney,
  money,
  type Plan,
  type Transaction,
} from '../lib/model';

export function SpendingChart({
  plan,
  transactions,
  start,
  end,
  reduceMotion,
}: {
  plan: Plan;
  transactions: Transaction[];
  start: string;
  end: string;
  reduceMotion: boolean;
}) {
  const length = Math.max(0, Math.min(31, dayCount(start, end)));
  const data = Array.from({ length }, (_, i) => {
    const date = addDays(end, i - length + 1);
    const day = budgetForDay(plan, transactions, date);
    return { date: niceDate(date), spent: day.todayNet, limit: day.allowance };
  });
  return (
    <div
      className="spending-chart"
      role="img"
      aria-label={`Biểu đồ chi ròng và hạn mức mỗi ngày từ ${niceDate(start)} đến ${niceDate(end)}. Chi tiết số tiền có trong danh sách giao dịch.`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ComposedChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="spending-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9bb79e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#9bb79e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#efeee8" vertical={false} strokeDasharray="4 4" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#66725e', fontSize: 11 }}
            minTickGap={20}
            dy={9}
          />
          <YAxis
            tickFormatter={shortMoney}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#66725e', fontSize: 11 }}
          />
          <Tooltip
            formatter={(value, name) => [
              money(Number(value)),
              name === 'spent' ? 'Chi ròng' : 'Hạn mức',
            ]}
            contentStyle={{ borderRadius: 14, border: '1px solid #e6e8df', fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="spent"
            stroke="#709578"
            strokeWidth={2.5}
            fill="url(#spending-fill)"
            isAnimationActive={!reduceMotion}
          />
          <Line
            type="monotone"
            dataKey="limit"
            stroke="#b9a4ce"
            strokeDasharray="5 5"
            dot={false}
            strokeWidth={1.8}
            isAnimationActive={!reduceMotion}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({
  transactions,
  reduceMotion,
}: {
  transactions: Transaction[];
  reduceMotion: boolean;
}) {
  const data = categories
    .map((c) => ({
      ...c,
      value: transactions
        .filter((t) => t.category === c.id && t.kind !== 'topup')
        .reduce((sum, t) => sum + (t.kind === 'expense' ? t.amount : -t.amount), 0),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = data.reduce((sum, c) => sum + c.value, 0);
  if (!total) return <p className="chart-empty">Chưa có nhóm chi ròng dương trong khoảng này.</p>;
  return (
    <div className="category-chart">
      <div
        className="donut-wrap"
        role="img"
        aria-label={`Chi ròng dương theo danh mục, tổng ${money(total)}`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={52}
              outerRadius={70}
              paddingAngle={5}
              cornerRadius={5}
              stroke="none"
              isAnimationActive={!reduceMotion}
            >
              {data.map((c) => (
                <Cell key={c.id} fill={c.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => money(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <small>Chi ròng</small>
          <strong>{shortMoney(total)}</strong>
        </div>
      </div>
      <div className="category-legend">
        {data.map((c) => (
          <div key={c.id}>
            <span>
              <i style={{ background: c.color }} />
              {c.name}
            </span>
            <strong>{Math.round((c.value / total) * 100)}%</strong>
            <small>{money(c.value)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
