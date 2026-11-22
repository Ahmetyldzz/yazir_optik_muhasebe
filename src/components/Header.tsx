import React from 'react';
import { Glasses, Plus, Users, LayoutDashboard, BarChart3, Settings, Database, ShieldCheck, Lock } from 'lucide-react';
import { StoreSettings } from '../types/optical';

export type ActiveTabType = 'orders' | 'customers' | 'finance' | 'inventory';

interface HeaderProps {
  settings: StoreSettings;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  isFinanceUnlocked?: boolean;
  onOpenNewOrder: () => void;
  onOpenAdminPanel: () => void;
  onOpenBackup: () => void;
  onOpenSettings: () => void;
  ordersCount: number;
  customersCount: number;
  pendingDeliveriesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab,
  setActiveTab,
  isFinanceUnlocked = false,
  onOpenNewOrder,
  onOpenAdminPanel,
  onOpenBackup,
  onOpenSettings,
  ordersCount,
  customersCount,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md no-print sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 mid:px-5 desk:px-8">
        {/* Top Row: 3 discrete tiers (<680px stacked, 680-1119px compact row, >=1120px full row) */}
        <div className="py-3 mid:py-0 mid:h-20 flex flex-col mid:flex-row mid:items-center mid:justify-between gap-3">
          {/* Brand Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 desk:gap-3 min-w-0">
              <div className="w-10 h-10 desk:w-12 desk:h-12 rounded-xl desk:rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/30 shrink-0">
                <Glasses className="w-5 h-5 desk:w-7 desk:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg desk:text-xl font-bold tracking-tight text-white font-mono truncate">
                    {settings.storeName || 'YAZIR OPTİK'}
                  </h1>
                  <span className="hidden desk:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 shrink-0">
                    Gözlük & Cam Takip
                  </span>
                </div>
                <p className="text-[11px] desk:text-xs text-slate-400 truncate">
                  {settings.city || 'Selçuklu / Konya'} • {settings.phone || '0 (332) 241 19 82'}
                </p>
              </div>
            </div>

            {/* Utility icons shown inline on narrow band (<680px) */}
            <div className="flex items-center gap-1 mid:hidden shrink-0">
              <button
                onClick={onOpenBackup}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Yedek Al / İçe Aktar"
              >
                <Database className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Mağaza Ayarları"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 mid:flex items-center gap-2 desk:gap-2.5">
            <button
              onClick={onOpenAdminPanel}
              className="flex items-center justify-center gap-1.5 px-3 desk:px-3.5 py-2 desk:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer shadow-xs whitespace-nowrap"
              title="Cam markalarını yönet"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="desk:hidden">Cam Markaları</span>
              <span className="hidden desk:inline">Admin Paneli (Cam Markaları)</span>
            </button>

            <button
              onClick={onOpenNewOrder}
              className="flex items-center justify-center gap-1.5 desk:gap-2 px-3 desk:px-4 py-2 desk:py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs desk:text-sm transition-all shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[3] shrink-0" />
              <span>Yeni Gözlük & Cam Ver</span>
            </button>

            <div className="hidden mid:block h-6 w-px bg-slate-800 mx-0.5 desk:mx-1" />

            <button
              onClick={onOpenBackup}
              className="hidden mid:flex p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Yedek Al / İçe Aktar"
            >
              <Database className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className="hidden mid:flex p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Mağaza Ayarları"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-800/80 -mb-px overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 desk:gap-2 px-3 mid:px-4 desk:px-5 py-2.5 text-xs desk:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'orders'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Hazırlanan Gözlükler</span>
            <span className="ml-0.5 text-[11px] desk:text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-bold">
              {ordersCount} Kayıt
            </span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-1.5 desk:gap-2 px-3 mid:px-4 desk:px-5 py-2.5 text-xs desk:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'customers'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Müşteri Bilgi Defteri</span>
            <span className="ml-0.5 text-[11px] desk:text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {customersCount} Müşteri
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            aria-current={activeTab === 'inventory' ? 'page' : undefined}
            className={'px-3 mid:px-4 desk:px-5 py-2.5 text-xs desk:text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 ' +
              (activeTab === 'inventory' ? 'border-cyan-400 text-cyan-300 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-slate-200')}
          >
            Stok
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`flex items-center gap-1.5 desk:gap-2 px-3 mid:px-4 desk:px-5 py-2.5 text-xs desk:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'finance'
                ? 'border-cyan-400 text-cyan-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Ciro & Kasa Özeti</span>
            {!isFinanceUnlocked && (
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
