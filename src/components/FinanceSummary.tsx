import React from 'react';
import { DollarSign, Eye, Glasses, Calendar, CheckCircle2 } from 'lucide-react';
import { SaleOrder } from '../types/optical';
import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';

interface FinanceSummaryProps {
  orders: SaleOrder[];
  onSelectOrder: (order: SaleOrder) => void;
}

export const FinanceSummary: React.FC<FinanceSummaryProps> = ({
  orders,
  onSelectOrder,
}) => {
  const totalSales = orders.reduce((sum, o) => sum + o.salePrice, 0);

  // Today's stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.orderDate === todayStr || o.createdAt?.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + o.salePrice, 0);

  // Most popular lenses
  const lensCountMap = new Map<string, number>();
  orders.forEach((o) => {
    const lens = o.prescription.lensType || 'Tek Odaklı';
    lensCountMap.set(lens, (lensCountMap.get(lens) || 0) + 1);
  });
  const topLenses = Array.from(lensCountMap.entries()).sort((a, b) => b[1] - a[1]);

  // Most popular frame brands
  const brandCountMap = new Map<string, { count: number; total: number }>();
  orders.forEach((o) => {
    const b = o.frame.brand || 'Diğer';
    const curr = brandCountMap.get(b) || { count: 0, total: 0 };
    brandCountMap.set(b, { count: curr.count + 1, total: curr.total + o.salePrice });
  });
  const topBrands = Array.from(brandCountMap.entries()).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 desk:p-6 shadow-md border border-slate-800 flex flex-col mid:flex-row items-start mid:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
            Kasa & Satış Hasılatı
          </span>
          <h2 className="text-xl desk:text-2xl font-black tracking-tight text-white font-mono mt-1">
            YAZIR OPTİK CİRO ÖZETİ
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Müşterilere verilen gözlük ve camların toplam ciro özeti
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-3 px-5 border border-slate-700 mid:text-right w-full mid:w-auto">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bugünkü Ciro</span>
          <span className="text-xl font-black text-cyan-400">{formatCurrency(todaySales)}</span>
          <span className="text-[10px] text-slate-300 block font-medium">
            {todayOrders.length} adet gözlük
          </span>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 mid:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Toplam Satış Cirosu</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl desk:text-3xl font-black text-slate-950 tracking-tight">
            {formatCurrency(totalSales)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Toplam {orders.length} adet gözlük satışı
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ortalama Gözlük Fiyatı</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Glasses className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl desk:text-3xl font-black text-slate-800 tracking-tight">
            {formatCurrency(orders.length ? Math.round(totalSales / orders.length) : 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sipariş başına ortalama tutar
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bugünkü Satışlar</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl desk:text-3xl font-black text-emerald-600 tracking-tight">
            {todayOrders.length} Adet
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bugün kaydedilen gözlük sayısı
          </p>
        </div>
      </div>

      {/* Top Lenses & Brands */}
      <div className="grid grid-cols-1 mid:grid-cols-2 gap-4">
        {/* En Çok Verilen Cam Türleri */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span>En Çok Verilen Cam Türleri</span>
          </h4>
          <div className="space-y-2 text-xs">
            {topLenses.map(([lens, count]) => (
              <div key={lens} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">{lens}</span>
                <span className="font-black text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  {count} Adet
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* En Çok Satılan Çerçeveler */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span>En Çok Verilen Gözlük Markaları</span>
          </h4>
          <div className="space-y-2 text-xs">
            {topBrands.map(([brand, data]) => (
              <div key={brand} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">{brand}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{data.count} adet</span>
                  <span className="font-bold text-slate-900">{formatCurrency(data.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Son Satış Kayıtları */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h4 className="font-bold text-slate-900 text-sm">Tüm Satış & Ciro Geçmişi ({orders.length} Kayıt)</h4>
        </div>

        {/* Tablo (>= 680px) */}
        <div className="hidden mid:block">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Müşteri</th>
                <th className="py-3 px-4">Verdiğim Gözlük</th>
                <th className="py-3 px-4">Verdiğim Cam</th>
                <th className="py-3 px-4 text-right">Kaça Verdim</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{formatDate(ord.orderDate)}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {ord.customer.fullName}
                    <span className="block text-[11px] font-normal text-slate-500 font-mono">
                      TC: {ord.customer.tcNo || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    {ord.frame.brand} {ord.frame.model}
                  </td>
                  <td className="py-3 px-4 text-slate-900 font-semibold">
                    {ord.prescription.lensBrand || 'Zeiss'} {ord.prescription.lensModel || ord.prescription.lensType ? `- ${ord.prescription.lensModel || ord.prescription.lensType}` : ''}
                    {ord.prescription.nearLensBrand && (
                      <span className="block text-[11px] text-amber-800">
                        Yakın: {ord.prescription.nearLensBrand} {ord.prescription.nearLensModel ? `- ${ord.prescription.nearLensModel}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-950 text-sm whitespace-nowrap">
                    {formatCurrency(ord.salePrice)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectOrder(ord)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Detay Gör"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kartlar (< 680px) */}
        <div className="block mid:hidden divide-y divide-slate-100">
          {orders.map((ord) => (
            <div key={ord.id} className="p-4 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 min-w-0">
                <div className="font-bold text-slate-900 truncate">{ord.customer.fullName}</div>
                <div className="text-[11px] text-slate-500 font-mono">{formatDate(ord.orderDate)} • TC: {ord.customer.tcNo || '-'}</div>
                <div className="text-slate-700 truncate">{ord.frame.brand} {ord.frame.model}</div>
                <div className="text-slate-800 font-semibold truncate">
                  {ord.prescription.lensBrand || 'Zeiss'} {ord.prescription.lensModel || ord.prescription.lensType ? `- ${ord.prescription.lensModel || ord.prescription.lensType}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-black text-slate-950 text-sm">{formatCurrency(ord.salePrice)}</span>
                <button
                  onClick={() => onSelectOrder(ord)}
                  className="p-2 text-slate-500 hover:text-slate-900 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  title="Detay Gör"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
