import React, { useState } from 'react';
import { Settings, Save, X, Glasses, Plus, Trash2, Eye, Tag } from 'lucide-react';
import { StoreSettings } from '../types/optical';
import type { CatalogKey, Catalogs } from '../services/api';

interface SettingsModalProps {
  settings: StoreSettings;
  catalogs: Catalogs;
  onSaveCatalog: (key: CatalogKey, values: string[]) => Promise<boolean>;
  onSave: (settings: StoreSettings) => Promise<boolean>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, catalogs, onSaveCatalog, onSave, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'catalog'>('store');

  // Store settings
  const [storeName, setStoreName] = useState(settings.storeName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [taxOffice, setTaxOffice] = useState(settings.taxOffice || '');
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber || '');
  const [receiptNote, setReceiptNote] = useState(settings.receiptNote);

  const { lensBrands, lensModels, frameModels } = catalogs;
  const [newBrandInput, setNewBrandInput] = useState('');
  const [newLensModelInput, setNewLensModelInput] = useState('');
  const [newFrameModelInput, setNewFrameModelInput] = useState('');

  async function addEntry(event: React.FormEvent, key: CatalogKey, values: string[], input: string, clear: (value: string) => void) {
    event.preventDefault();
    const value = input.trim();
    if (value && await onSaveCatalog(key, [...values, value])) clear('');
  }

  const handleAddBrand = (event: React.FormEvent) => addEntry(event, 'lens-brands', lensBrands, newBrandInput, setNewBrandInput);
  const handleAddLensModel = (event: React.FormEvent) => addEntry(event, 'lens-models', lensModels, newLensModelInput, setNewLensModelInput);
  const handleAddFrameModel = (event: React.FormEvent) => addEntry(event, 'frame-models', frameModels, newFrameModelInput, setNewFrameModelInput);
  const handleDeleteBrand = (value: string) => onSaveCatalog('lens-brands', lensBrands.filter(entry => entry !== value));
  const handleDeleteLensModel = (value: string) => onSaveCatalog('lens-models', lensModels.filter(entry => entry !== value));
  const handleDeleteFrameModel = (value: string) => onSaveCatalog('frame-models', frameModels.filter(entry => entry !== value));

  const handleSubmitStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await onSave({
      storeName: storeName.trim() || 'Yazır Optik',
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      taxOffice: taxOffice.trim(),
      taxNumber: taxNumber.trim(),
      receiptNote: receiptNote.trim(),
    });
    if (saved) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 mid:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-white">Ayarlar & Katalog Yönetimi</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab('store')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'store'
                ? 'border-cyan-500 text-cyan-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Mağaza & Fiş Bilgileri
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('catalog')}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'catalog'
                ? 'border-cyan-500 text-cyan-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-600" />
            <span>Cam Markaları & Modelleri</span>
          </button>
        </div>

        {/* Tab 1: Mağaza Bilgileri */}
        {activeSubTab === 'store' && (
          <form onSubmit={handleSubmitStore} className="p-6 overflow-y-auto space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Optik Mağaza Adı
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Yazır Optik"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Yetkili / Optisyen Adı
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Yazır Optisyenlik"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  İletişim Telefonu
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0 (332) 241 19 82"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  Mağaza Adresi
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Yazır Mah. Cadde No:42"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  İlçe / İl
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Selçuklu / Konya"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Müşteri Fişi Alt Notu
              </label>
              <textarea
                rows={3}
                value={receiptNote}
                onChange={(e) => setReceiptNote(e.target.value)}
                placeholder="Gözlükleriniz 2 yıl garantilidir..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-bold cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Cam Markaları & Modelleri Yönetimi */}
        {activeSubTab === 'catalog' && (
          <div className="p-6 overflow-y-auto space-y-6 text-xs">
            {/* 1. Cam Markaları */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Cam Markaları ({lensBrands.length})</h4>
                  <p className="text-slate-500 text-[11px]">Yeni gözlük verirken seçim listesinde çıkan markalar</p>
                </div>
              </div>

              <form onSubmit={handleAddBrand} className="flex gap-2">
                <input
                  type="text"
                  value={newBrandInput}
                  onChange={(e) => setNewBrandInput(e.target.value)}
                  placeholder="Yeni marka adı yazın (örn: Zeiss, Prolight, Novax)"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Ekle</span>
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-1">
                {lensBrands.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    <span>{b}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteBrand(b)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                      title="Sil"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 2. Cam Modelleri */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Cam Modelleri ({lensModels.length})</h4>
                  <p className="text-slate-500 text-[11px]">ClearView, SmartLife, Prolight Drive, vb.</p>
                </div>
              </div>

              <form onSubmit={handleAddLensModel} className="flex gap-2">
                <input
                  type="text"
                  value={newLensModelInput}
                  onChange={(e) => setNewLensModelInput(e.target.value)}
                  placeholder="Yeni cam modeli yazın (örn: ClearView, Prolight Eco)"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Ekle</span>
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-1 max-h-40 overflow-y-auto">
                {lensModels.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 shadow-2xs"
                  >
                    <span>{m}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLensModel(m)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                      title="Sil"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 3. Gözlük / Çerçeve Modelleri */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Gözlük / Çerçeve Modelleri ({frameModels.length})</h4>
                  <p className="text-slate-500 text-[11px]">Clubmaster, Wayfarer, Aviator, vb.</p>
                </div>
              </div>

              <form onSubmit={handleAddFrameModel} className="flex gap-2">
                <input
                  type="text"
                  value={newFrameModelInput}
                  onChange={(e) => setNewFrameModelInput(e.target.value)}
                  placeholder="Yeni çerçeve modeli yazın (örn: Clubmaster, Wayfarer)"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Ekle</span>
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-1 max-h-40 overflow-y-auto">
                {frameModels.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 shadow-2xs"
                  >
                    <span>{m}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFrameModel(m)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                      title="Sil"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 text-white rounded-lg font-bold cursor-pointer"
              >
                Tamam
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
