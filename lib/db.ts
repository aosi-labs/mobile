import * as SQLite from 'expo-sqlite';
import type { Service } from './types';

const DB_NAME = 'aosi.db';
const META_KEY_LAST_SYNCED = 'last_synced';
const META_KEY_SYNC_SIGNATURE = 'sync_signature';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      category TEXT,
      address TEXT,
      suburb TEXT,
      state TEXT,
      postcode TEXT,
      latitude REAL,
      longitude REAL,
      phone TEXT,
      email TEXT,
      website TEXT,
      hours TEXT,
      eligibility TEXT,
      cost TEXT,
      source_id TEXT,
      source_name TEXT,
      source_organisation TEXT,
      source_jurisdiction TEXT,
      source_license TEXT,
      source_url TEXT,
      source_date TEXT,
      quality TEXT,
      location_precision TEXT,
      duplicate_of TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_services_state ON services(state);
    CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
    CREATE INDEX IF NOT EXISTS idx_services_suburb ON services(suburb);
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', key, value);
}

export async function getLastSynced(): Promise<number | null> {
  const value = await getMeta(META_KEY_LAST_SYNCED);
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function setLastSynced(ts: number): Promise<void> {
  await setMeta(META_KEY_LAST_SYNCED, String(ts));
}

export async function getSyncSignature(): Promise<string | null> {
  return getMeta(META_KEY_SYNC_SIGNATURE);
}

export async function setSyncSignature(signature: string): Promise<void> {
  await setMeta(META_KEY_SYNC_SIGNATURE, signature);
}

export async function countServices(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM services');
  return row?.n ?? 0;
}

export async function loadAllServices(): Promise<Service[]> {
  const db = await getDb();
  return db.getAllAsync<Service>('SELECT * FROM services');
}

const INSERT_COLUMNS = [
  'id', 'name', 'description', 'category', 'address', 'suburb', 'state', 'postcode',
  'latitude', 'longitude', 'phone', 'email', 'website', 'hours', 'eligibility', 'cost',
  'source_id', 'source_name', 'source_organisation', 'source_jurisdiction',
  'source_license', 'source_url', 'source_date', 'quality', 'location_precision', 'duplicate_of',
] as const;

// 400 rows x 26 columns = 10,400 bound variables, well under SQLite's 32,766 cap.
const INSERT_CHUNK = 400;

function toRow(s: Service): (string | number | null)[] {
  return [
    s.id,
    s.name ?? '',
    s.description ?? '',
    s.category ?? '',
    s.address ?? '',
    s.suburb ?? '',
    s.state ?? '',
    s.postcode ?? '',
    s.latitude ?? null,
    s.longitude ?? null,
    s.phone ?? '',
    s.email ?? '',
    s.website ?? '',
    s.hours ?? '',
    s.eligibility ?? '',
    s.cost ?? '',
    s.source_id ?? '',
    s.source_name ?? '',
    s.source_organisation ?? '',
    s.source_jurisdiction ?? '',
    s.source_license ?? '',
    s.source_url ?? '',
    s.source_date ?? '',
    s.quality ?? '',
    s.location_precision ?? '',
    s.duplicate_of ?? '',
  ];
}

export async function replaceAllServices(rows: Service[]): Promise<void> {
  const db = await getDb();
  const rowPlaceholder = `(${INSERT_COLUMNS.map(() => '?').join(', ')})`;
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM services');
    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      const chunk = rows.slice(i, i + INSERT_CHUNK);
      const params: (string | number | null)[] = [];
      for (const s of chunk) params.push(...toRow(s));
      await db.runAsync(
        `INSERT INTO services (${INSERT_COLUMNS.join(', ')}) VALUES ${chunk
          .map(() => rowPlaceholder)
          .join(', ')}`,
        params
      );
    }
  });
}
