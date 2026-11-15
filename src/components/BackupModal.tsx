import React, { useRef, useState } from 'react';
import { Download, Upload, RefreshCw, X, Check, AlertCircle, Database } from 'lucide-react';
import { storage } from '../services/storage';
import { ConfirmDialog } from './ConfirmDialog';

interface BackupModalProps {
  onClose: () => void;
  onDataRestored: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ onClose, onDataRestored }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleDownloadBackup = () => {
    const dataStr = storage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yazir_optik_yedek_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('Veri yedeği başarıyla bilgisayarınıza indirildi.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importAllData(content);
      if (success) {
        setSuccessMsg('Yedek başarıyla yüklendi ve tüm veriler güncellendi!');
        onDataRestored();
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1500);
      } else {
        setErrorMsg('Dosya geçersiz veya bozuk. Lütfen geçerli bir Yazır Optik JSON yedeği yükleyin.');
        setTimeout(() => setErrorMsg(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const confirmResetToDemo = () => {
    setShowResetConfirm(false);
    storage.resetToDefault();
    onDataRestored();
    setSuccessMsg('Örnek veriler başarıyla yüklendi.');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm">Veri Yedekleme & Geri Yükleme</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-slate-600">
            Tüm müşteri kayıtlarınızı, gözlük numaralarını, stoklarınızı ve kasa işlemlerinizi tek dosyada güvenle yedekleyebilir veya başka bir bilgisayara aktarabilirsiniz.
          </p>

          <div className="space-y-3 pt-2">
            {/* Download Backup */}
            <button
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Tam Yedek İndir (JSON Dosyası)</span>
            </button>

            {/* Restore Backup */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Yedekten Geri Yükle (Dosya Seç)</span>
            </button>

            {/* Reset to demo */}
            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Örnek Demo Verileri Yeniden Yükle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Demo Verilerini Yükle"
        message="Tüm mevcut veriler başlangıç örnek demo verileriyle değiştirilecek. Emin misiniz?"
        confirmLabel="Evet, Yükle"
        onConfirm={confirmResetToDemo}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
