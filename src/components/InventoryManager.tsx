import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, AlertTriangle, ArrowUpDown, Trash2, Edit3, Check, Barcode } from 'lucide-react';
import { InventoryItem } from '../types/optical';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[]) => void;
  onOpenNewOrderWithFrame?: (item: InventoryItem) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onUpdateInventory,
  onOpenNewOrderWithFrame,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form states for new/edit
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [size, setSize] = useState('');
  const [category, setCategory] = useState<'cerceve' | 'gunes' | 'hazir_cam' | 'lens' | 'aksesuar'>('cerceve');
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('5');
  const [minQuantity, setMinQuantity] = useState('2');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setBrand('');
    setModel('');
    setColorCode('');
    setSize('');
    setCategory('cerceve');
    setBarcode('');
    setQuantity('5');
    setMinQuantity('2');
    setCostPrice('');
    setSalePrice('');
    setSupplier('');
    setNotes('');
    setShowAddModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setBrand(item.brand);
    setModel(item.model);
    setColorCode(item.colorCode);
    setSize(item.size);
    setCategory(item.category);
    setBarcode(item.barcode);
    setQuantity(item.quantity.toString());
    setMinQuantity(item.minQuantity.toString());
    setCostPrice(item.costPrice.toString());
    setSalePrice(item.salePrice.toString());
    setSupplier(item.supplier || '');
    setNotes(item.notes || '');
    setShowAddModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim()) {
      alert('Lütfen marka giriniz.');
      return;
    }

    const newItem: InventoryItem = {
      id: editingItem ? editingItem.id : `inv-${Date.now()}`,
      brand: brand.trim(),
      model: model.trim(),
      colorCode: colorCode.trim(),
      size: size.trim(),
      category,
      barcode: barcode.trim() || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      quantity: parseInt(quantity) || 0,
      minQuantity: parseInt(minQuantity) || 2,
      costPrice: parseFloat(costPrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      supplier: supplier.trim(),
      notes: notes.trim(),
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (editingItem) {
      onUpdateInventory(inventory.map((i) => (i.id === editingItem.id ? newItem : i)));
    } else {
      onUpdateInventory([newItem, ...inventory]);
    }
    setShowAddModal(false);
  };

  const adjustQuantity = (id: string, delta: number) => {
    onUpdateInventory(
      inventory.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty, updatedAt: new Date().toISOString().split('T')[0] };
        }
        return item;
      })
    );
  };

  const deleteItem = (id: string) => {
    if (confirm('Bu stok kartını silmek istediğinizden emin misiniz?')) {
      onUpdateInventory(inventory.filter((i) => i.id !== id));
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.brand.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.colorCode.toLowerCase().includes(q) ||
        item.barcode.includes(q) ||
        item.supplier?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'critical') return item.quantity <= item.minQuantity;
      return item.category === categoryFilter;
    });
  }, [inventory, searchQuery, categoryFilter]);

  const totalQuantity = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalCostValue = inventory.reduce((sum, i) => sum + i.costPrice * i.quantity, 0);
  const totalSaleValue = inventory.reduce((sum, i) => sum + i.salePrice * i.quantity, 0);
  const lowStockCount = inventory.filter((i) => i.quantity <= i.minQuantity).length;

  return (
    <div className="space-y-4">
      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Toplam Stok Adedi</span>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalQuantity} adet</span>
          <p className="text-xs text-slate-500 mt-1">{inventory.length} farklı model/ürün</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Maliyet Envanter Değeri</span>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(totalCostValue)}</span>
          <p className="text-xs text-slate-500 mt-1">Dükkandaki alış maliyeti</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Etiket Satış Değeri</span>
          <span className="text-2xl font-bold text-cyan-600 tracking-tight">{formatCurrency(totalSaleValue)}</span>
          <p className="text-xs text-slate-500 mt-1">Raf liste toplamı</p>
        </div>

        <div 
          onClick={() => setCategoryFilter(categoryFilter === 'critical' ? 'all' : 'critical')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            lowStockCount > 0 ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900 uppercase tracking-wider block">Kritik Stok</span>
            {lowStockCount > 0 && <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />}
          </div>
          <span className="text-2xl font-bold text-rose-600 tracking-tight">{lowStockCount} ürün</span>
          <p className="text-xs text-rose-800 mt-1">Eşiğin altına düşenler</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Marka, model, renk, barkod veya tedarikçi ile ara..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 focus:bg-white focus:border-cyan-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Tüm Ürünler' },
            { id: 'cerceve', label: 'Çerçeveler' },
            { id: 'gunes', label: 'Güneş Gözlükleri' },
            { id: 'hazir_cam', label: 'Hazır Camlar' },
            { id: 'lens', label: 'Kontakt Lens' },
            { id: 'critical', label: `Kritik (${lowStockCount})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Ürün Ekle</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Barkod & Kategori</th>
                <th className="py-3 px-4">Marka & Model</th>
                <th className="py-3 px-4">Renk & Ekartman</th>
                <th className="py-3 px-4 text-center">Stok Adedi</th>
                <th className="py-3 px-4 text-right">Alış / Satış</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item) => {
                const isCritical = item.quantity <= item.minQuantity;

                return (
                  <tr key={item.id} className={`hover:bg-slate-50/70 ${isCritical ? 'bg-rose-50/20' : ''}`}>
                    {/* Barcode & Category */}
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                        <Barcode className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.barcode}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 inline-block mt-1">
                        {item.category === 'cerceve' && 'Numaralı Çerçeve'}
                        {item.category === 'gunes' && 'Güneş Gözlüğü'}
                        {item.category === 'hazir_cam' && 'Hazır Cam'}
                        {item.category === 'lens' && 'Kontakt Lens'}
                        {item.category === 'aksesuar' && 'Aksesuar'}
                      </span>
                    </td>

                    {/* Brand & Model */}
                    <td className="py-3 px-4 align-top">
                      <span className="font-bold text-slate-900 text-sm block">
                        {item.brand}
                      </span>
                      <span className="text-slate-600 text-xs block">
                        {item.model}
                      </span>
                      {item.supplier && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Tedarik: {item.supplier}
                        </span>
                      )}
                    </td>

                    {/* Color & Size */}
                    <td className="py-3 px-4 align-top">
                      <span className="text-slate-700 block font-medium">
                        {item.colorCode || '-'}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px] block">
                        {item.size || '-'}
                      </span>
                    </td>

                    {/* Quantity & Quick Adjust */}
                    <td className="py-3 px-4 align-top text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => adjustQuantity(item.id, -1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer transition-colors"
                          title="1 Azalt"
                        >
                          -
                        </button>
                        <span
                          className={`font-black text-sm px-2.5 py-0.5 rounded ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => adjustQuantity(item.id, 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer transition-colors"
                          title="1 Ekle"
                        >
                          +
                        </button>
                      </div>
                      {isCritical && (
                        <span className="text-[10px] text-rose-700 font-bold block mt-1">
                          Kritik Stok! (Min: {item.minQuantity})
                        </span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 align-top text-right">
                      <span className="font-black text-slate-900 text-sm block">
                        {formatCurrency(item.salePrice)}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Maliyet: {formatCurrency(item.costPrice)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                        Kâr: {formatCurrency(item.salePrice - item.costPrice)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit3 className="w-4 h-4 text-amber-600" />
                        </button>

                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Stock Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingItem ? 'Stok Kartını Düzenle' : 'Yeni Stok Kartı Ekle'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Ürün Kategorisi
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  >
                    <option value="cerceve">Numaralı Optik Çerçeve</option>
                    <option value="gunes">Güneş Gözlüğü</option>
                    <option value="hazir_cam">Hazır Kesim Cam</option>
                    <option value="lens">Kontakt Lens & Solüsyon</option>
                    <option value="aksesuar">Kılıf, İp ve Aksesuar</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Marka *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ray-Ban, Osse, Vogue vb."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Model Kodu
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="RB5154, OS3218 vb."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Renk / Kaplama
                  </label>
                  <input
                    type="text"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    placeholder="Parlak Siyah, Altın"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Ekartman / Ölçü
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="51-21-145"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Mevcut Stok Adedi
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Kritik Stok Uyarısı (Min Adet)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Alış Maliyeti (₺)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="1200"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Liste / Satış Fiyatı (₺)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="2800"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Barkod / Seri Numarası
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Boş bırakılırsa otomatik üretilir"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tedarikçi Firma
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Luxottica, Merve Gözlük, İşbir vb."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-bold"
                >
                  {editingItem ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
