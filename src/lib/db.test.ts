import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db, loadSnapshot, saveSnapshot } from './db';
import { emptySnapshot } from './model';

afterEach(async () => {
  await db.snapshots.clear();
});
describe('persistent data', () => {
  it('restores a validated snapshot from IndexedDB', async () => {
    const state = emptySnapshot();
    state.settings.petName = 'Bơ';
    await saveSnapshot(state);
    expect(await loadSnapshot()).toEqual(state);
  });
  it('rejects stale tab writes atomically instead of overwriting newer data', async () => {
    const original = emptySnapshot();
    await saveSnapshot(original);
    const newer = { ...original, settings: { ...original.settings, petName: 'Bơ' } };
    await saveSnapshot(newer, original);
    const stale = { ...original, settings: { ...original.settings, petName: 'Mít' } };
    await expect(saveSnapshot(stale, original)).rejects.toThrow('tab khác');
    expect((await loadSnapshot()).settings.petName).toBe('Bơ');
  });
});
