import { SaleOrder, InventoryItem, StoreSettings, Customer } from '../types/optical';
import { initialOrders, initialInventory, defaultSettings } from '../data/initialData';

const ORDERS_KEY = 'yazir_optik_orders_v1';
const INVENTORY_KEY = 'yazir_optik_inventory_v1';
const CUSTOMERS_KEY = 'yazir_optik_customers_v1';
const SETTINGS_KEY = 'yazir_optik_settings_v1';
const LENS_BRANDS_KEY = 'yazir_optik_lens_brands_v1';
const LENS_MODELS_KEY = 'yazir_optik_lens_models_v1';
const FRAME_MODELS_KEY = 'yazir_optik_frame_models_v1';

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


const initialCustomers: Customer[] = initialOrders.map((o) => o.customer);

export const storage = {
  getOrders(): SaleOrder[] {
    try {
      const data = localStorage.getItem(ORDERS_KEY);
      let list: SaleOrder[] = initialOrders;
      if (data) {
        list = JSON.parse(data);
      } else {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(initialOrders));
      }
      // Normalize statuses strictly to 'hazirlaniyor' or 'teslim_edildi'
      return list.map((o) => ({
        ...o,
        status: o.status === 'teslim_edildi' ? 'teslim_edildi' : 'hazirlaniyor',
      }));
    } catch (e) {
      console.error('Error reading orders from localStorage', e);
      return initialOrders;
    }
  },

  saveOrders(orders: SaleOrder[]): void {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders to localStorage', e);
    }
  },

  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(CUSTOMERS_KEY);
      if (!data) {
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(initialCustomers));
        return initialCustomers;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading customers from localStorage', e);
      return initialCustomers;
    }
  },

  saveCustomers(customers: Customer[]): void {
    try {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    } catch (e) {
      console.error('Error saving customers to localStorage', e);
    }
  },

  getInventory(): InventoryItem[] {
    try {
      const data = localStorage.getItem(INVENTORY_KEY);
      if (!data) {
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(initialInventory));
        return initialInventory;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading inventory from localStorage', e);
      return initialInventory;
    }
  },

  saveInventory(items: InventoryItem[]): void {
    try {
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving inventory to localStorage', e);
    }
  },

  getSettings(): StoreSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
        return defaultSettings;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading settings from localStorage', e);
      return defaultSettings;
    }
  },

  saveSettings(settings: StoreSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings to localStorage', e);
    }
  },

  // Cam Markaları Yönetimi
  getLensBrands(): string[] {
    try {
      const data = localStorage.getItem(LENS_BRANDS_KEY);
      if (!data) {
        localStorage.setItem(LENS_BRANDS_KEY, JSON.stringify(DEFAULT_LENS_BRANDS));
        return DEFAULT_LENS_BRANDS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LENS_BRANDS;
    } catch {
      return DEFAULT_LENS_BRANDS;
    }
  },

  saveLensBrands(brands: string[]): void {
    try {
      localStorage.setItem(LENS_BRANDS_KEY, JSON.stringify(brands));
    } catch (e) {
      console.error('Error saving lens brands', e);
    }
  },

  addLensBrand(brand: string): string[] {
    const trimmed = brand.trim();
    if (!trimmed) return this.getLensBrands();
    const current = this.getLensBrands();
    if (!current.some((b) => b.toLocaleLowerCase('tr-TR') === trimmed.toLocaleLowerCase('tr-TR'))) {
      const updated = [...current, trimmed];
      this.saveLensBrands(updated);
      return updated;
    }
    return current;
  },

  // Cam Modelleri Yönetimi
  getLensModels(): string[] {
    try {
      const data = localStorage.getItem(LENS_MODELS_KEY);
      if (!data) {
        localStorage.setItem(LENS_MODELS_KEY, JSON.stringify(DEFAULT_LENS_MODELS));
        return DEFAULT_LENS_MODELS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LENS_MODELS;
    } catch {
      return DEFAULT_LENS_MODELS;
    }
  },

  saveLensModels(models: string[]): void {
    try {
      localStorage.setItem(LENS_MODELS_KEY, JSON.stringify(models));
    } catch (e) {
      console.error('Error saving lens models', e);
    }
  },

  addLensModel(model: string): string[] {
    const trimmed = model.trim();
    if (!trimmed) return this.getLensModels();
    const current = this.getLensModels();
    if (!current.some((m) => m.toLocaleLowerCase('tr-TR') === trimmed.toLocaleLowerCase('tr-TR'))) {
      const updated = [...current, trimmed];
      this.saveLensModels(updated);
      return updated;
    }
    return current;
  },

  // Gözlük / Çerçeve Modelleri Yönetimi
  getFrameModels(): string[] {
    try {
      const data = localStorage.getItem(FRAME_MODELS_KEY);
      if (!data) {
        localStorage.setItem(FRAME_MODELS_KEY, JSON.stringify(DEFAULT_FRAME_MODELS));
        return DEFAULT_FRAME_MODELS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FRAME_MODELS;
    } catch {
      return DEFAULT_FRAME_MODELS;
    }
  },

  saveFrameModels(models: string[]): void {
    try {
      localStorage.setItem(FRAME_MODELS_KEY, JSON.stringify(models));
    } catch (e) {
      console.error('Error saving frame models', e);
    }
  },

  addFrameModel(model: string): string[] {
    const trimmed = model.trim();
    if (!trimmed) return this.getFrameModels();
    const current = this.getFrameModels();
    if (!current.some((m) => m.toLocaleLowerCase('tr-TR') === trimmed.toLocaleLowerCase('tr-TR'))) {
      const updated = [...current, trimmed];
      this.saveFrameModels(updated);
      return updated;
    }
    return current;
  },

  exportAllData(): string {
    const backup = {
      version: '1.2',
      exportDate: new Date().toISOString(),
      storeName: 'Yazır Optik',
      orders: this.getOrders(),
      customers: this.getCustomers(),
      inventory: this.getInventory(),
      settings: this.getSettings(),
      lensBrands: this.getLensBrands(),
      lensModels: this.getLensModels(),
      frameModels: this.getFrameModels(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importAllData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.orders)) {
        this.saveOrders(parsed.orders);
      }
      if (Array.isArray(parsed.customers)) {
        this.saveCustomers(parsed.customers);
      }
      if (Array.isArray(parsed.inventory)) {
        this.saveInventory(parsed.inventory);
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        this.saveSettings(parsed.settings);
      }
      if (Array.isArray(parsed.lensBrands)) {
        this.saveLensBrands(parsed.lensBrands);
      }
      if (Array.isArray(parsed.lensModels)) {
        this.saveLensModels(parsed.lensModels);
      }
      if (Array.isArray(parsed.frameModels)) {
        this.saveFrameModels(parsed.frameModels);
      }
      return true;
    } catch (e) {
      console.error('Invalid JSON import', e);
      return false;
    }
  },

  resetToDefault(): void {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(initialOrders));
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(initialCustomers));
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(initialInventory));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    localStorage.setItem(LENS_BRANDS_KEY, JSON.stringify(DEFAULT_LENS_BRANDS));
    localStorage.setItem(LENS_MODELS_KEY, JSON.stringify(DEFAULT_LENS_MODELS));
    localStorage.setItem(FRAME_MODELS_KEY, JSON.stringify(DEFAULT_FRAME_MODELS));
  },
};
