import type { Service } from './types';

const BASE_URL = 'https://oa-sa.vercel.app/services/services.json';
const PAGE_SIZE = 1000;

type Page = { rows: Service[]; next_url: string | null };

export async function fetchAllServices(
  onBatch?: (rows: Service[], total: number) => void
): Promise<Service[]> {
  const all: Service[] = [];
  let url: string | null = `${BASE_URL}?_size=${PAGE_SIZE}&_shape=objects`;
  while (url) {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`API ${resp.status}: ${resp.statusText}`);
    }
    const json = (await resp.json()) as Page;
    const rows = json.rows || [];
    all.push(...rows);
    onBatch?.(rows, all.length);
    url = json.next_url || null;
  }
  return all;
}
