import React from 'react';
import { TrendingUp, Clock, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { SaleOrder } from '../types/optical';
import { formatCurrency } from '../utils/formatters';

interface MetricsCardsProps {
  orders: SaleOrder[];
  onFilterByStatus?: (status: string) => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ orders, onFilterByStatus }) => {
  const totalSales = orders.reduce((sum, o) => sum + o.salePrice, 0);
  const totalCost = orders.reduce((sum, o) => sum + o.costPrice, 0);
  const totalProfit = totalSales - totalCost;
  const profitMargin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;

  const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalRemaining = orders.reduce((sum, o) => sum + o.remainingAmount, 0);

  const pendingWorkshopCount = orders.filter((o) => (o.status as string) === 'atolye' || o.status === 'hazirlaniyor').length;
  const readyCount = orders.filter((o) => (o.status as string) === 'hazir').length;
  const debtCount = orders.filter((o) => o.remainingAmount > 0).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {/* Toplam Satış / Ciro */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Toplam Ciro</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {formatCurrency(totalSales)}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {orders.length} işlem kaydı
        </p>
      </div>

      {/* Net Kâr & Marj */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Net Kâr</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight">
          {formatCurrency(totalProfit)}
        </div>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <span className="font-medium text-emerald-700">%{profitMargin}</span> kâr marjı
        </p>
      </div>

      {/* Bekleyen Alacak / Kalan Bakiye */}
      <div 
        onClick={() => onFilterByStatus?.('debt')}
        className={`bg-white rounded-xl p-4 border transition-all cursor-pointer ${
          totalRemaining > 0 
            ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300' 
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">Bekleyen Alacak</span>
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-amber-600 tracking-tight">
          {formatCurrency(totalRemaining)}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {debtCount} müşteride açık bakiye
        </p>
      </div>

      {/* Atölyede / Cam Kesiminde */}
      <div 
        onClick={() => onFilterByStatus?.('atolye')}
        className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Atölyede</span>
          <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {pendingWorkshopCount} adet
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Cam kesimi & montajda
        </p>
      </div>

      {/* Teslimata Hazır */}
      <div 
        onClick={() => onFilterByStatus?.('hazir')}
        className={`bg-white rounded-xl p-4 border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
          readyCount > 0 ? 'border-blue-200 bg-blue-50/20 hover:border-blue-300' : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-900">Teslimata Hazır</span>
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-blue-600 tracking-tight">
          {readyCount} adet
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Müşteri bekleyen sipariş
        </p>
      </div>
    </div>
  );
};
