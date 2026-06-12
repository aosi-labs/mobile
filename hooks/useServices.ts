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
  lastSynced: number | null;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useServices(): ServicesState {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
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
      const now = Date.now();
      if (count > 0 && prevSignature === first.signature) {
        await setLastSynced(now);
        setLastSyncedState(now);
        return;
      }
      const rows = await fetchRemainingServices(first, (_batch, total) => {
        setSyncProgress(total);
      });
      await replaceAllServices(rows);
      await setSyncSignature(first.signature);
      await setLastSynced(now);
      setServices(rows);
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
    lastSynced,
    error,
    refresh: sync,
  };
}
