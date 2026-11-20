export interface EyeValues {
  sph: string; // Küre (+2.50, -1.75, vb.)
  cyl: string; // Silindir (-0.75, +1.00)
  axis: string; // Aks (0° - 180°)
  add?: string; // Adisyon (+1.75 yakın)
  pd?: string; // Pupilla Mesafesi (örn. 31.5 mm)
}

export interface EyePairValues {
  rightEye: EyeValues; // OD (Oculus Dexter)
  leftEye: EyeValues;  // OS (Oculus Sinister)
}

export type UsageOption = 'uzak' | 'yakin' | 'progresif';
export type GlassesUsageType = 'uzak' | 'yakin' | 'uzak_yakin' | 'progresif';

export interface Prescription {
  doctorName?: string;
  hospital?: string;
  prescriptionDate?: string;
  prescriptionNo?: string;
  rightEye: EyeValues; // OD (Oculus Dexter) - Uzak veya birincil
  leftEye: EyeValues;  // OS (Oculus Sinister) - Uzak veya birincil
  distanceRx?: EyePairValues; // Uzak numaraları
  nearRx?: EyePairValues;     // Yakın numaraları
  usageTypes?: UsageOption[]; // Aynı anda ['uzak', 'yakin'] seçilebilir
  usageType?: GlassesUsageType; // 'uzak' | 'yakin' | 'uzak_yakin' | 'progresif'
  lensType: string;    // Tek Odaklı, vb.
  lensFeatures: string[]; // Antirefle, vb.
  lensBrand: string;   // Uzak / birincil cam markası
  lensModel?: string;  // Uzak / birincil cam modeli
  nearLensBrand?: string; // Yakın cam markası (Uzak + Yakın birlikte seçildiğinde)
  nearLensModel?: string; // Yakın cam modeli (Uzak + Yakın birlikte seçildiğinde)
  lensIndex: string;   // Opsiyonel / eski kayıt uyumu
  thinning?: string;   // Eski kayıt uyumu
}

export interface Customer {
  id: string;
  fullName: string;
  tcNo: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface FrameItem {
  brand: string;
  model: string;
  colorCode: string;
  size: string; // Ekartman (örn: 53-18-140)
  type: 'numarali' | 'gunes' | 'cocuk' | 'klipsli';
  barcode?: string;
}

export type OrderStatus = 'hazirlaniyor' | 'teslim_edildi';
export type PaymentMethod = 'nakit' | 'kredi_karti' | 'havale' | 'parcali';

export interface CashAccount {
  id: string;
  name: string;
  color: 'cyan' | 'indigo' | 'amber' | 'emerald';
}

export type CashTransactionType = 'in' | 'out';

export interface CashTransaction {
  id: string;
  type: CashTransactionType;
  accountId: string;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface SaleOrder {
  id: string;
  orderNo: string; // örn: YO-2026-104
  customer: Customer;
  prescription: Prescription;
  frame: FrameItem;
  framePrice?: number;  // Çerçeve (Gözlük) Fiyatı ₺
  lensPrice?: number;   // Cam Fiyatı ₺
  costPrice: number;    // Alış Maliyeti ₺
  listPrice: number;    // Liste Fiyatı ₺
  salePrice: number;    // Toplam Satış Fiyatı ₺ (framePrice + lensPrice)
  paidAmount: number;   // Tahsil Edilen
  remainingAmount: number;
  paymentMethod?: PaymentMethod;
  accountId?: string;   // Tahsilatın işlendiği kişi hesabı
  status: OrderStatus;
  orderDate: string;
  deliveryDate?: string;
  warrantyMonths: number;
  notes?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  brand: string;
  model: string;
  colorCode: string;
  size: string;
  category: 'cerceve' | 'gunes' | 'hazir_cam' | 'lens' | 'aksesuar';
  barcode: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  salePrice: number;
  supplier?: string;
  notes?: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  ownerName: string;
  phone: string;
  address: string;
  city: string;
  taxNumber?: string;
  taxOffice?: string;
  receiptNote: string;
}
