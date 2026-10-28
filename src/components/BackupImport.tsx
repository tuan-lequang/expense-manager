import { useRef, type ChangeEvent } from 'react';
import { ArrowUpFromLine } from 'lucide-react';
import { parseBackup, type Snapshot } from '../lib/model';

export default function BackupImport({
  today,
  onImport,
  notify,
  disabled = false,
  compact = false,
}: {
  today: string;
  onImport: (data: Snapshot) => void;
  notify: (message: string) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || disabled) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Tệp sao lưu tối đa 10 MB.');
      onImport(parseBackup(await file.text(), today));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không đọc được tệp.');
    }
  }
  return (
    <>
      <button
        type="button"
        className={compact ? 'text-button' : 'backup-action'}
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        <ArrowUpFromLine size={compact ? 15 : 22} />
        {compact ? (
          'Khôi phục bản sao lưu'
        ) : (
          <>
            <strong>Khôi phục JSON</strong>
            <small>Xem trước trước khi thay thế dữ liệu</small>
          </>
        )}
      </button>
      <input
        ref={input}
        className="sr-only"
        aria-label="Tệp sao lưu JSON"
        type="file"
        accept="application/json,.json"
        disabled={disabled}
        onChange={importFile}
      />
    </>
  );
}
