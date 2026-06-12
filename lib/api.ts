import type { Service } from './types';

const BASE_URL = 'https://oa-sa.vercel.app/services/services.json';
const PAGE_SIZE = 1000;

type Page = {
  rows: Service[];
  next_url: string | null;
  filtered_table_rows_count?: number;
};

// djb2 over the serialised rows; cheap and stable for change detection.
function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return String(h >>> 0);
}

export type FirstPage = {
  rows: Service[];
  nextUrl: string | null;
  // Total row count + first-page content hash. If this matches the signature
  // stored at the last successful sync, the dataset is assumed unchanged and
  // the remaining ~24 pages are skipped.
  signature: string;
};

async function fetchPage(url: string): Promise<Page> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`API ${resp.status}: ${resp.statusText}`);
  }
  return (await resp.json()) as Page;
}

export async function fetchFirstPage(): Promise<FirstPage> {
  const json = await fetchPage(`${BASE_URL}?_size=${PAGE_SIZE}&_shape=objects`);
  const rows = json.rows || [];
  const count = json.filtered_table_rows_count ?? 'na';
  return {
    rows,
    nextUrl: json.next_url || null,
    signature: `${count}:${rows.length}:${hashString(JSON.stringify(rows))}`,
  };
}

export async function fetchRemainingServices(
  firstPage: FirstPage,
  onBatch?: (rows: Service[], total: number) => void
): Promise<Service[]> {
  const all: Service[] = [...firstPage.rows];
  onBatch?.(firstPage.rows, all.length);
  let url = firstPage.nextUrl;
  while (url) {
    const json = await fetchPage(url);
    const rows = json.rows || [];
    all.push(...rows);
    onBatch?.(rows, all.length);
    url = json.next_url || null;
  }
  return all;
}

export async function fetchAllServices(
  onBatch?: (rows: Service[], total: number) => void
): Promise<Service[]> {
  return fetchRemainingServices(await fetchFirstPage(), onBatch);
}
