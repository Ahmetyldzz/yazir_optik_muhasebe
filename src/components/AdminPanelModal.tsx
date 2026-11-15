import React, { useState } from 'react';
import { ShieldCheck, X, Plus, Trash2, Eye, Check } from 'lucide-react';
import { storage } from '../services/storage';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminPanelModalProps {
  onClose: () => void;
  onCatalogUpdated?: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  onClose,
  onCatalogUpdated,
}) => {
  const [lensBrands, setLensBrands] = useState<string[]>(() => storage.getLensBrands());
  const [newBrandInput, setNewBrandInput] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [pendingDeleteBrand, setPendingDeleteBrand] = useState<string | null>(null);

  const notify = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
    onCatalogUpdated?.();
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandInput.trim()) return;
    const updated = storage.addLensBrand(newBrandInput.trim());
    setLensBrands(updated);
    setNewBrandInput('');
    notify(`"${newBrandInput.trim()}" markası eklendi.`);
  };

  const confirmDeleteBrand = () => {
    if (!pendingDeleteBrand) return;
    const brand = pendingDeleteBrand;
    const updated = lensBrands.filter((b) => b !== brand);
    storage.saveLensBrands(updated);
    setLensBrands(updated);
    setPendingDeleteBrand(null);
    notify(`"${brand}" markası silindi.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 mid:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Yazır Optik - Cam Markaları Yönetimi</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Admin Paneli
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Satış formunda kullanılacak cam markalarını buradan ekleyip yönetebilirsiniz.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Header */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-bold">
          <div className="py-3.5 px-4 border-b-2 border-cyan-500 text-cyan-950 bg-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-600" />
            <span>Cam Markaları ({lensBrands.length})</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {successToast && (
            <div className="flex items-center gap-2 p-3 bg-emerald-100 text-emerald-950 rounded-xl font-bold border border-emerald-300 transition-all">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>{successToast}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="p-4 bg-cyan-50/50 rounded-xl border border-cyan-200">
              <h4 className="font-black text-cyan-950 text-sm mb-1">
                Yeni Cam Markası Ekle
              </h4>
              <p className="text-slate-600 mb-3">
                Buraya ekleyeceğiniz cam markaları, satış ekranında doğrudan açılır listede görünür.
              </p>
              <form onSubmit={handleAddBrand} className="flex gap-2">
                <input
                  type="text"
                  value={newBrandInput}
                  onChange={(e) => setNewBrandInput(e.target.value)}
                  placeholder="Marka adı girin (örn: Zeiss, Prolight, Novax...)"
                  className="flex-1 bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Markayı Ekle</span>
                </button>
              </form>
            </div>

            <div>
              <h5 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
                Kayıtlı Cam Markaları ({lensBrands.length})
              </h5>
              <div className="grid grid-cols-1 mid:grid-cols-2 gap-2">
                {lensBrands.map((brand) => (
                  <div
                    key={brand}
                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span className="font-bold text-slate-900 text-sm">{brand}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteBrand(brand)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Markayı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-between items-center">
          <p className="text-[11px] text-slate-500">
            Eklediğiniz tüm markalar anında satış formunda kullanılabilir.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
          >
            Tamamla & Kapat
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteBrand)}
        title="Cam Markasını Sil"
        message={
          pendingDeleteBrand
            ? `"${pendingDeleteBrand}" markasını listeden silmek istediğinize emin misiniz?`
            : ''
        }
        onConfirm={confirmDeleteBrand}
        onCancel={() => setPendingDeleteBrand(null)}
      />
    </div>
  );
};
