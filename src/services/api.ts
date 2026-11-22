import type { CashAccount, CashTransaction, Customer, InventoryItem, SaleOrder, StoreSettings } from '../types/optical';

export type CatalogKey = 'lens-brands' | 'lens-models' | 'frame-models';
export interface Catalogs { lensBrands: string[]; lensModels: string[]; frameModels: string[] }
export interface StoreData extends Catalogs {
  orders: SaleOrder[];
  customers: Customer[];
  inventory: InventoryItem[];
  accounts: CashAccount[];
  transactions: CashTransaction[];
  settings: StoreSettings;
}
export async function api<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch('/api' + path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => { throw new Error('API bağlantısı kurulamadı. Backend sunucusunu kontrol edin.'); });
  if (response.status === 204) return undefined as T;
  const json = await response.json().catch(() => null);
  if (!response.ok || json === null) throw new Error(json?.error || 'API yanıtı alınamadı. HTTP ' + response.status);
  return json as T;
}
export const recordPath = (collection: string, id: string) => '/' + collection + '/' + encodeURIComponent(id);
