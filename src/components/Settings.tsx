import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Cat as CatIcon,
  Check,
  Download,
  HardDrive,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { money, niceDate, parseBackup, toCsv, type Snapshot } from '../lib/model';

export function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Settings({
  data,
  today,
  isDemo,
  onSave,
  onEditPlan,
  onImport,
  onReset,
  notify,
}: {
  data: Snapshot;
  today: string;
  isDemo: boolean;
  onSave: (settings: Snapshot['settings']) => Promise<void>;
  onEditPlan: () => void;
  onImport: (data: Snapshot) => void;
  onReset: () => void;
  notify: (message: string) => void;
}) {
  const [settings, setSettings] = useState(data.settings);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave(settings);
      notify('Đã lưu tùy chọn của bạn.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Chưa lưu được tùy chọn.');
    } finally {
      setBusy(false);
    }
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (isDemo) {
      notify('Thoát bản mẫu trước khi khôi phục dữ liệu thật.');
      return;
    }
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Tệp sao lưu tối đa 10 MB.');
      onImport(parseBackup(await file.text(), today));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không đọc được tệp.');
    }
  }
  return (
    <div className="settings-grid">
      <section className="panel">
        <div className="section-heading">
          <h2>Kế hoạch của bạn</h2>
          <span className="mini-icon peach">
            <HardDrive size={18} />
          </span>
        </div>
        <h3 className="plan-name">{data.plan!.name}</h3>
        <p className="muted">
          {niceDate(data.plan!.startDate)} — {niceDate(data.plan!.endDate, { year: 'numeric' })}
        </p>
        <dl className="plan-details">
          <div>
            <dt>Số tiền đầu kỳ</dt>
            <dd>{money(data.plan!.amount)}</dd>
          </div>
          <div>
            <dt>Khoản giữ lại</dt>
            <dd>{money(data.plan!.reserve)}</dd>
          </div>
          <div>
            <dt>Tiền tệ · Múi giờ</dt>
            <dd>VND · Việt Nam (UTC+7)</dd>
          </div>
        </dl>
        <button className="button soft full" onClick={onEditPlan}>
          Điều chỉnh kế hoạch
        </button>
      </section>
      <section className="panel">
        <div className="section-heading">
          <h2>Người bạn nhỏ</h2>
          <span className="mini-icon lavender">
            <CatIcon size={19} />
          </span>
        </div>
        <form className="form-stack" onSubmit={submit}>
          <label>
            Tên thú cưng
            <input
              value={settings.petName}
              required
              maxLength={24}
              onChange={(e) => setSettings({ ...settings, petName: e.target.value })}
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Hiển thị thú cưng</strong>
              <small>Một lời nhắc nhẹ nhàng mỗi ngày</small>
            </span>
            <input
              type="checkbox"
              checked={settings.showPet}
              onChange={(e) => setSettings({ ...settings, showPet: e.target.checked })}
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Giảm chuyển động</strong>
              <small>Giữ giao diện yên tĩnh hơn</small>
            </span>
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => setSettings({ ...settings, reduceMotion: e.target.checked })}
            />
          </label>
          <button type="submit" className="button soft full" disabled={busy}>
            <Check size={16} />
            {busy ? 'Đang lưu…' : 'Lưu tùy chọn'}
          </button>
        </form>
      </section>
      <section className="panel backup-panel">
        <div className="section-heading">
          <h2>Dữ liệu & sao lưu</h2>
          <span className="mini-icon mint">
            <ShieldCheck size={19} />
          </span>
        </div>
        <div className="info-box">
          <ShieldCheck size={20} />
          <span>
            Dữ liệu nằm trong trình duyệt trên thiết bị này. Chưa có đồng bộ giữa điện thoại và
            laptop. Xóa dữ liệu trang có thể làm mất giao dịch; hãy giữ một bản sao lưu riêng.
          </span>
        </div>
        <div className="backup-actions">
          <button
            className="backup-action"
            onClick={() =>
              downloadFile(
                JSON.stringify(data, null, 2),
                `${isDemo ? 'ban-mau-' : ''}mo-backup-${today}.json`,
                'application/json',
              )
            }
          >
            <ArrowDownToLine size={22} />
            <strong>Sao lưu JSON</strong>
            <small>Giữ toàn bộ kế hoạch và giao dịch</small>
          </button>
          <button
            className="backup-action"
            disabled={isDemo}
            onClick={() => fileRef.current?.click()}
          >
            <ArrowUpFromLine size={22} />
            <strong>Khôi phục JSON</strong>
            <small>Xem trước trước khi thay thế dữ liệu</small>
          </button>
          <button
            className="backup-action"
            onClick={() =>
              downloadFile(
                toCsv(data.transactions),
                `${isDemo ? 'ban-mau-' : ''}mo-giao-dich-${today}.csv`,
                'text/csv;charset=utf-8',
              )
            }
          >
            <Download size={22} />
            <strong>Xuất giao dịch CSV</strong>
            <small>Mở bằng Excel hoặc Google Sheets</small>
          </button>
        </div>
        <input
          ref={fileRef}
          className="sr-only"
          aria-label="Tệp sao lưu JSON"
          type="file"
          accept="application/json,.json"
          onChange={importFile}
        />
        <div className="delete-data">
          <div>
            <strong>Bắt đầu lại từ đầu</strong>
            <p>Xóa kế hoạch, giao dịch và tùy chọn trên thiết bị này.</p>
          </div>
          <button className="button danger-outline" disabled={isDemo} onClick={onReset}>
            <Trash2 size={16} />
            Xóa dữ liệu
          </button>
        </div>
      </section>
      <p className="settings-note">
        Mơ 0.1 · Không quảng cáo, không theo dõi, không cần kết nối tài khoản ngân hàng.
      </p>
    </div>
  );
}
