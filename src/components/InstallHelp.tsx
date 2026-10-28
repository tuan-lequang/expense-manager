import { Check, Download, Smartphone, WifiOff } from 'lucide-react';
import type { InstallState, OfflineState } from '../lib/useInstall';

export default function InstallHelp({
  installation,
  offline,
}: {
  installation: InstallState;
  offline: OfflineState;
}) {
  return (
    <section className="panel install-panel">
      <div className="section-heading">
        <div>
          <h2>Mang Mơ theo bên mình</h2>
          <p>Mở từ biểu tượng ứng dụng, không cần chạy VS Code.</p>
        </div>
        <span className="mini-icon lavender">
          <Smartphone size={20} />
        </span>
      </div>
      <div className="install-summary">
        <div>
          <strong>
            {installation.installed
              ? 'Mơ đã được cài trên thiết bị này'
              : 'Cài Mơ như một ứng dụng'}
          </strong>
          <p>
            {installation.installed
              ? 'Bạn có thể mở Mơ từ màn hình chính hoặc danh sách ứng dụng.'
              : 'Dùng link HTTPS công khai trong Chrome hoặc Safari, rồi thêm Mơ vào màn hình chính.'}
          </p>
        </div>
        {installation.canInstall && !installation.installed && (
          <button
            className="button primary"
            disabled={installation.busy}
            onClick={installation.install}
          >
            <Download size={17} />
            {installation.busy ? 'Đang mở…' : 'Cài Mơ trên thiết bị'}
          </button>
        )}
        {installation.installed && (
          <span className="install-badge">
            <Check size={15} />
            Đã cài
          </span>
        )}
      </div>
      {installation.message && (
        <p className="info-box" role="status">
          {installation.message}
        </p>
      )}
      {!installation.installed && (
        <details className="install-instructions">
          <summary>Hướng dẫn cho Chrome, Android và iPhone</summary>
          <ul>
            <li>
              <strong>Chrome trên laptop:</strong> mở menu ⋮ → Truyền, lưu và chia sẻ → Cài đặt
              trang dưới dạng ứng dụng, hoặc dùng biểu tượng cài đặt trên thanh địa chỉ khi có.
            </li>
            <li>
              <strong>Android:</strong> mở link bằng Chrome → menu ⋮ → Cài đặt ứng dụng / Thêm vào
              màn hình chính → xác nhận.
            </li>
            <li>
              <strong>iPhone/iPad:</strong> mở link bằng Safari → Chia sẻ → Thêm vào Màn hình chính
              → bật Mở dưới dạng ứng dụng web nếu có → Thêm.
            </li>
          </ul>
          <p>
            Tên menu tùy phiên bản trình duyệt. Nếu đang mở trong Zalo/Facebook, hãy chọn mở bằng
            Chrome hoặc Safari trước.
          </p>
        </details>
      )}
      <div className="offline-readiness">
        <WifiOff size={17} />
        <div>
          <strong>
            {offline === 'ready'
              ? 'Đã sẵn sàng dùng offline'
              : offline === 'preparing'
                ? 'Đang chuẩn bị để dùng offline…'
                : 'Chưa sẵn sàng dùng offline'}
          </strong>
          <p>
            {offline === 'ready'
              ? 'Bạn có thể mở lại app, ghi giao dịch và xem dữ liệu trên thiết bị khi mất mạng.'
              : offline === 'error'
                ? 'Lần tải đầu chưa hoàn tất. Giữ kết nối và thử tải lại trang; bạn vẫn có thể dùng khi có mạng.'
                : 'Giữ kết nối trong lần mở đầu qua link HTTPS để app tải đủ dữ liệu cần thiết.'}
          </p>
        </div>
      </div>
      <p className="install-footnote">
        Cài app không tự đồng bộ với thiết bị khác. Hãy xuất JSON trước khi chuyển từ bản chạy trên
        máy sang link công khai, rồi khôi phục trên thiết bị muốn dùng.
      </p>
    </section>
  );
}
