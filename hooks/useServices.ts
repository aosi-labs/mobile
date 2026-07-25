import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFirstPage, fetchRemainingServices } from '../lib/api';
import {
  countServices,
  getLastSynced,
  getSyncSignature,
  initDb,
  loadAllServices,
  replaceAllServices,
  setLastSynced,
  setSyncSignature,
} from '../lib/db';
import type { Service } from '../lib/types';

const STALE_MS = 24 * 60 * 60 * 1000;

export type ServicesState = {
  services: Service[];
  isLoading: boolean;
  isSyncing: boolean;
  syncProgress: number;
  syncTotal: number | null;
  lastSynced: number | null;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useServices(): ServicesState {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncTotal, setSyncTotal] = useState<number | null>(null);
  const [lastSynced, setLastSyncedState] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const syncingRef = useRef(false);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    setSyncProgress(0);
    setError(null);
    try {
      // One-request probe first: if the dataset signature matches the last
      // successful sync, skip downloading the remaining ~24 pages.
      const first = await fetchFirstPage();
      const [prevSignature, count] = await Promise.all([getSyncSignature(), countServices()]);
      const firstRun = count === 0;
      setSyncTotal(first.totalCount);
      const now = Date.now();
      if (count > 0 && prevSignature === first.signature) {
        await setLastSynced(now);
        setLastSyncedState(now);
        return;
      }
      // On first run, stream pages into the UI as they arrive so a user on a
      // slow connection sees their nearby services within seconds instead of
      // after the whole download. If the download dies partway, the streamed
      // rows stay usable in memory; SQLite only ever gets the complete set,
      // so the cache is never corrupted. Re-syncs never stream, so an
      // existing cached list is never replaced by a partial one.
      let streamed: Service[] = [];
      const rows = await fetchRemainingServices(first, (batch, total) => {
        setSyncProgress(total);
        if (firstRun) {
          streamed = streamed.concat(batch.filter((r) => !r.duplicate_of));
          setServices(streamed);
        }
      });
      await replaceAllServices(rows);
      await setSyncSignature(first.signature);
      await setLastSynced(now);
      setServices(rows.filter((r) => !r.duplicate_of));
      setLastSyncedState(now);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sync failed';
      setError(msg);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDb();
        const [count, last] = await Promise.all([countServices(), getLastSynced()]);
        if (cancelled) return;
        if (count > 0) {
          const cached = await loadAllServices();
          if (cancelled) return;
          setServices(cached);
          setLastSyncedState(last);
          setIsLoading(false);
          if (!last || Date.now() - last > STALE_MS) {
            void sync();
          }
        } else {
          setIsLoading(false);
          await sync();
        }
      } catch (e) {
        if (cancelled) return;
        setIsLoading(false);
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sync]);

  return {
    services,
    isLoading,
    isSyncing,
    syncProgress,
    syncTotal,
    lastSynced,
    error,
    refresh: sync,
  };
}
