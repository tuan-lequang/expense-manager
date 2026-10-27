import Dexie, { type Table } from 'dexie';
import { emptySnapshot, snapshotSchema, type Snapshot } from './model';

class MoDatabase extends Dexie {
  snapshots!: Table<{ id: string; value: Snapshot }, string>;
  constructor() {
    super('mo-expense-manager');
    this.version(1).stores({ snapshots: 'id' });
  }
}
export const db = new MoDatabase();
export async function loadSnapshot(): Promise<Snapshot> {
  const row = await db.snapshots.get('current');
  return row ? snapshotSchema.parse(row.value) : emptySnapshot();
}
export async function saveSnapshot(snapshot: Snapshot, expected?: Snapshot) {
  const parsed = snapshotSchema.parse(snapshot);
  await db.transaction('rw', db.snapshots, async () => {
    if (expected) {
      const previous = (await db.snapshots.get('current'))?.value ?? emptySnapshot();
      if (JSON.stringify(previous) !== JSON.stringify(expected))
        throw new Error('Dữ liệu vừa thay đổi ở tab khác. Hãy thử lại với dữ liệu mới.');
    }
    await db.snapshots.put({ id: 'current', value: parsed });
  });
}
