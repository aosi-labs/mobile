import * as SQLite from 'expo-sqlite';
import type { Service } from './types';

const DB_NAME = 'aosi.db';
const META_KEY_LAST_SYNCED = 'last_synced';

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

export async function getLastSynced(): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    META_KEY_LAST_SYNCED
  );
  if (!row) return null;
  const n = Number(row.value);
  return Number.isFinite(n) ? n : null;
}

export async function setLastSynced(ts: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
    META_KEY_LAST_SYNCED,
    String(ts)
  );
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

export async function replaceAllServices(rows: Service[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM services');
    const stmt = await db.prepareAsync(`
      INSERT INTO services (
        id, name, description, category, address, suburb, state, postcode,
        latitude, longitude, phone, email, website, hours, eligibility, cost,
        source_id, source_name, source_organisation, source_jurisdiction,
        source_license, source_url, source_date, quality, location_precision, duplicate_of
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    try {
      for (const s of rows) {
        await stmt.executeAsync([
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
        ]);
      }
    } finally {
      await stmt.finalizeAsync();
    }
  });
}
