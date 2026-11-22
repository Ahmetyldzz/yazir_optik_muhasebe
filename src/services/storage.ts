import { initialOrders, initialInventory, defaultSettings, defaultAccounts, initialTransactions } from '../data/initialData';

const ORDERS_KEY = 'yazir_optik_orders_v1';
const INVENTORY_KEY = 'yazir_optik_inventory_v1';
const CUSTOMERS_KEY = 'yazir_optik_customers_v1';
const SETTINGS_KEY = 'yazir_optik_settings_v1';
const LENS_BRANDS_KEY = 'yazir_optik_lens_brands_v1';
const LENS_MODELS_KEY = 'yazir_optik_lens_models_v1';
const FRAME_MODELS_KEY = 'yazir_optik_frame_models_v1';
const ACCOUNTS_KEY = 'yazir_optik_accounts_v1';
const TRANSACTIONS_KEY = 'yazir_optik_transactions_v1';
const FINANCE_UNLOCK_KEY = 'yazir_optik_finance_unlock_until_v1';
const FINANCE_UNLOCK_DURATION_MS = 60 * 60 * 1000; // 1 saat

export const DEFAULT_LENS_BRANDS = [
  'Zeiss',
  'Prolight',
  'Essilor',
  'Hoya',
  'Seiko',
  'Novax',
  'Kodak',
  'VisionArt',
  'Shamir',
  'Tora',
  'Rodenstock',
  'Standart / Diğer',
];

export const DEFAULT_LENS_MODELS = [
  'ClearView',
  'SmartLife',
  'DriveSafe',
  'EnergizeMe',
  'Prolight Drive',
  'Prolight Blue',
  'Prolight Eco',
  'Prolight Relax',
  'Crizal Alize',
  'Crizal Prevencia',
  'Eyezen',
  'Varilux Comfort',
  'Hilux',
  'Nulux',
  'Tek Odaklı Standart',
  'Progresif (Uzak+Yakın)',
  'Mavi Işık (Blue-Cut)',
  'Fotokromik (Kararan)',
  'Numaralı Güneş (Polarize)',
  'Okuma / Yakın',
];

export const DEFAULT_FRAME_MODELS = [
  'RB5154 Clubmaster',
  'RB2140 Wayfarer',
  'RB3025 Aviator',
  'RB3447 Round',
  'Osse Titanyum Klasik',
  'Osse Klipsli Magnet',
  'Hawk Dinamik Seri',
  'Vogue Geometrik Metal',
  'Mustang Polarize',
  'Klasik Dikdörtgen',
  'Yuvarlak Asetat',
  'Çerçevesiz (Nilor)',
];


const legacyKeys = {
  orders: ORDERS_KEY,
  customers: CUSTOMERS_KEY,
  inventory: INVENTORY_KEY,
  settings: SETTINGS_KEY,
  lensBrands: LENS_BRANDS_KEY,
  lensModels: LENS_MODELS_KEY,
  frameModels: FRAME_MODELS_KEY,
  accounts: ACCOUNTS_KEY,
  transactions: TRANSACTIONS_KEY,
};

export const storage = {
  getFinanceUnlockUntil(): number {
    return Number(localStorage.getItem(FINANCE_UNLOCK_KEY)) || 0;
  },

  isFinanceSessionValid(): boolean {
    return Date.now() < this.getFinanceUnlockUntil();
  },

  unlockFinanceSession(): void {
    localStorage.setItem(FINANCE_UNLOCK_KEY, String(Date.now() + FINANCE_UNLOCK_DURATION_MS));
  },

  lockFinanceSession(): void {
    localStorage.removeItem(FINANCE_UNLOCK_KEY);
  },

  hasLegacyData(): boolean {
    return Object.values(legacyKeys).some(key => localStorage.getItem(key) !== null);
  },

  exportLegacyData(): string {
    const backup: Record<string, unknown> = { version: '1.3', exportDate: new Date().toISOString() };
    for (const [field, key] of Object.entries(legacyKeys)) {
      const raw = localStorage.getItem(key);
      if (raw !== null) backup[field] = JSON.parse(raw);
    }
    return JSON.stringify(backup, null, 2);
  },

  getDemoBackup() {
    return {
      orders: initialOrders, customers: initialOrders.map(order => order.customer), inventory: initialInventory,
      settings: defaultSettings, accounts: defaultAccounts, transactions: initialTransactions,
      lensBrands: DEFAULT_LENS_BRANDS, lensModels: DEFAULT_LENS_MODELS, frameModels: DEFAULT_FRAME_MODELS,
    };
  },
};
