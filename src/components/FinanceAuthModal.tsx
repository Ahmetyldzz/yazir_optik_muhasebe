import React, { useState, useEffect, useRef } from 'react';
import { Lock, AlertTriangle, Eye, EyeOff, X, ShieldCheck } from 'lucide-react';

interface FinanceAuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const FinanceAuthModal: React.FC<FinanceAuthModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'admin' && password === 'admin123') {
      setError(null);
      onSuccess();
    } else {
      setError('Kullanıcı adı (ID) veya şifre yanlış! Lütfen tekrar deneyiniz.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 mid:p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Ciro & Kasa Özeti Girişi</h3>
              <p className="text-[11px] text-slate-400">Yetkili erişim doğrulaması</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Ciro, kasa bakiyeleri ve gider hareketlerini görüntülemek için ID ve şifrenizi giriniz. Doğrulama 1 saat boyunca geçerli kalır.
          </p>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-800 flex items-start gap-2.5 shadow-2xs"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-bold leading-snug">{error}</div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Kullanıcı Adı (ID)
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="ID giriniz"
              autoComplete="username"
              className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:bg-white transition-colors ${
                error ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-cyan-500'
              }`}
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Şifre
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Şifre giriniz"
                autoComplete="current-password"
                className={`w-full bg-slate-50 border rounded-xl pl-3 pr-10 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:bg-white transition-colors ${
                  error ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-cyan-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold cursor-pointer transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-xs cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Giriş Yap</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
