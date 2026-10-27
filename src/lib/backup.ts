import { db, TABLES } from './db';
import type { Recording } from './types';

export const BACKUP_VERSION = 1;
type SerializedRecording = Omit<Recording, 'blob'> & { blobBase64: string };
export type Backup = {
  app: 'hoc-cum-tu';
  version: number;
  exportedAt: number;
  tables: Record<string, unknown[]>;
};

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function exportBackup(): Promise<Backup> {
  const tables: Record<string, unknown[]> = {};
  for (const name of TABLES) {
    if (name === 'recordings') continue;
    tables[name] = await db.table(name).toArray();
  }
  const recs = await db.recordings.toArray();
  tables.recordings = await Promise.all(
    recs.map(async ({ blob, ...rest }): Promise<SerializedRecording> => ({
      ...rest,
      blobBase64: bytesToBase64(new Uint8Array(await blob.arrayBuffer())),
    })),
  );
  return { app: 'hoc-cum-tu', version: BACKUP_VERSION, exportedAt: Date.now(), tables };
}

export function checkBackup(data: unknown): data is Backup {
  const b = data as Backup;
  return !!b && b.app === 'hoc-cum-tu' && typeof b.version === 'number' && b.version <= BACKUP_VERSION && typeof b.tables === 'object';
}

/** Replaces all local data with the backup's contents in one transaction. */
export async function importBackup(backup: Backup) {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const name of TABLES) {
      const rows = backup.tables[name] ?? [];
      const table = db.table(name);
      await table.clear();
      if (name === 'recordings') {
        await table.bulkAdd(
          (rows as SerializedRecording[]).map(({ blobBase64, ...rest }) => ({
            ...rest,
            blob: new Blob([base64ToBytes(blobBase64)], { type: rest.mime }),
          })),
        );
      } else {
        await table.bulkAdd(rows);
      }
    }
  });
}

export async function wipeAll() {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const name of TABLES) await db.table(name).clear();
  });
}
