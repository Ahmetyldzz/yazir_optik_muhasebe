import React, { useState } from 'react';
import { 
  TrendingUp, DollarSign, Wallet, AlertCircle, Banknote, CreditCard, 
  ArrowUpRight, Clock, CheckCircle2, ChevronRight, Eye, ShieldCheck, 
  Glasses, Boxes, BarChart3, ArrowDownRight 
} from 'lucide-react';
import { SaleOrder, InventoryItem } from '../types/optical';
import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';

interface DashboardViewProps {
  orders: SaleOrder[];
  inventory: InventoryItem[];
  onAddPayment: (orderId: string, amount: number) => void;
  onNavigateToOrders: (filter?: string) => void;
  onNavigateToInventory: () => void;
  onSelectOrder: (order: SaleOrder) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  inventory,
  onAddPayment,
  onNavigateToOrders,
  onNavigateToInventory,
  onSelectOrder,
}) => {
  const [selectedDebtOrder, setSelectedDebtOrder] = useState<SaleOrder | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');

  // Calculations
  const totalSales = orders.reduce((sum, o) => sum + o.salePrice, 0);
  const totalCost = orders.reduce((sum, o) => sum + o.costPrice, 0);
  const totalProfit = totalSales - totalCost;
  const profitMargin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;

  const totalCollected = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalReceivable = orders.reduce((sum, o) => sum + o.remainingAmount, 0);

  // Today's stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.orderDate === todayStr || o.createdAt?.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + o.salePrice, 0);
  const todayProfit = todayOrders.reduce((sum, o) => sum + (o.salePrice - o.costPrice), 0);

  // Payment Breakdown
  const cashTotal = orders.filter((o) => o.paymentMethod === 'nakit').reduce((sum, o) => sum + o.paidAmount, 0);
  const cardTotal = orders.filter((o) => o.paymentMethod === 'kredi_karti').reduce((sum, o) => sum + o.paidAmount, 0);
  const transferTotal = orders.filter((o) => o.paymentMethod === 'havale').reduce((sum, o) => sum + o.paidAmount, 0);
  const partialTotal = orders.filter((o) => o.paymentMethod === 'parcali').reduce((sum, o) => sum + o.paidAmount, 0);

  // Workshop & Inventory stats
  const inWorkshopCount = orders.filter((o) => (o.status as string) === 'atolye' || o.status === 'hazirlaniyor').length;
  const readyCount = orders.filter((o) => (o.status as string) === 'hazir').length;
  const deliveredCount = orders.filter((o) => o.status === 'teslim_edildi').length;
  const criticalStockItems = inventory.filter((i) => i.quantity <= i.minQuantity);

  // Debtors
  const debtorOrders = orders.filter((o) => o.remainingAmount > 0);

  // Top brands sold
  const brandCountMap = new Map<string, { count: number; totalSale: number }>();
  orders.forEach((o) => {
    const brand = o.frame.brand || 'Diğer';
    const curr = brandCountMap.get(brand) || { count: 0, totalSale: 0 };
    brandCountMap.set(brand, { count: curr.count + 1, totalSale: curr.totalSale + o.salePrice });
  });
  const topBrands = Array.from(brandCountMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const handlePayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtOrder) return;
    const val = parseFloat(payAmount);
    if (!isNaN(val) && val > 0) {
      onAddPayment(selectedDebtOrder.id, val);
      setSelectedDebtOrder(null);
      setPayAmount('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Welcome Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              Kasa & Finans Yönetim Paneli
            </span>
            <span className="text-xs text-slate-400">
              Bugün: {formatDate(todayStr)}
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white font-mono">
            YAZIR OPTİK GENEL DURUM & CİRO
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Tüm satış ciroları, alış maliyetleri, net kâr marjları ve bekleyen açık hesap alacakları bu ekranda toplanmıştır. Tezgah ekranında müşterilere bu finansal detaylar gösterilmez.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bugünkü Ciro</span>
            <span className="text-lg font-black text-cyan-400">{formatCurrency(todaySales)}</span>
            <span className="text-[10px] text-emerald-400 block font-medium">
              +{formatCurrency(todayProfit)} Net Kâr ({todayOrders.length} satış)
            </span>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TOPLAM CİRO */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Toplam Satış Cirosu</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalSales)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Toplam {orders.length} işlem</span>
            <span className="font-semibold text-slate-700">Ort. {formatCurrency(orders.length ? Math.round(totalSales / orders.length) : 0)} / gözlük</span>
          </div>
        </div>

        {/* ALIŞ MALİYETLERİ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Alış Maliyeti</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-700 tracking-tight">
            {formatCurrency(totalCost)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Çerçeve + Cam toplamı</span>
            <span className="text-slate-600 font-mono text-[11px]">%{totalSales > 0 ? Math.round((totalCost / totalSales) * 100) : 0} pay</span>
          </div>
        </div>

        {/* NET KÂR VE MARJ */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs bg-emerald-50/20 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Net Kâr Tutarı</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(totalProfit)}
          </div>
          <div className="flex items-center justify-between text-xs text-emerald-800 mt-2 pt-2 border-t border-emerald-100 font-medium">
            <span>Kâr Marjı:</span>
            <span className="font-bold text-sm bg-emerald-100 px-2 py-0.5 rounded text-emerald-900">
              %{profitMargin}
            </span>
          </div>
        </div>

        {/* BEKLEYEN ALACAKLAR (AÇIK HESAP) */}
        <div 
          onClick={() => onNavigateToOrders('debt')}
          className="bg-white rounded-2xl p-5 border border-amber-300 shadow-xs bg-amber-50/20 hover:border-amber-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Açık Hesap / Alacak</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
            {formatCurrency(totalReceivable)}
          </div>
          <div className="flex items-center justify-between text-xs text-amber-900 mt-2 pt-2 border-t border-amber-200 font-medium">
            <span>{debtorOrders.length} müşteride bakiye var</span>
            <span className="text-amber-800 font-bold hover:underline flex items-center gap-0.5">
              İncele <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Operational Highlights (Atölye & Stok & Kasa) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KASA ÖDEME YÖNTEMLERİ DAĞILIMI */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Kasa & Tahsilat Dağılımı</span>
              </h4>
              <span className="text-xs font-black text-slate-900">
                {formatCurrency(totalCollected)}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">Nakit Tahsilat</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(cashTotal)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-700">POS / Kredi Kartı</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(cardTotal)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-slate-700">Banka Havale / EFT</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(transferTotal)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-slate-700">Parçalı / Kapora</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(partialTotal)}</span>
              </div>
            </div>
          </div>
          
          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            Kasaya anlık giren toplam nakit ve kart akışı
          </p>
        </div>

        {/* ATÖLYE & SİPARİŞ DURUM ÖZETİ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-600" />
                <span>Atölye & Teslimat Durumu</span>
              </h4>
              <button
                onClick={() => onNavigateToOrders('all')}
                className="text-xs text-cyan-700 font-bold hover:underline"
              >
                Tümünü Gör →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div 
                onClick={() => onNavigateToOrders('atolye')}
                className="p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Atölyede</span>
                <span className="text-xl font-black text-amber-700">{inWorkshopCount}</span>
                <span className="text-[10px] text-amber-600 block">Cam kesimi</span>
              </div>

              <div 
                onClick={() => onNavigateToOrders('hazir')}
                className="p-3 rounded-xl bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <span className="text-[10px] uppercase font-bold text-blue-800 block">Hazır</span>
                <span className="text-xl font-black text-blue-700">{readyCount}</span>
                <span className="text-[10px] text-blue-600 block">Bekleyen</span>
              </div>

              <div 
                onClick={() => onNavigateToOrders('teslim_edildi')}
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Teslim</span>
                <span className="text-xl font-black text-emerald-700">{deliveredCount}</span>
                <span className="text-[10px] text-emerald-600 block">Tamamlandı</span>
              </div>
            </div>

            {/* Top Brands list */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                En Çok Satılan Markalar
              </span>
              {topBrands.map(([brand, data]) => (
                <div key={brand} className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">{brand}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">{data.count} adet</span>
                    <span className="font-bold text-slate-900">{formatCurrency(data.totalSale)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STOK & ENVANTER ANALİZİ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-cyan-600" />
                <span>Stok Envanter Değeri</span>
              </h4>
              <button
                onClick={onNavigateToInventory}
                className="text-xs text-cyan-700 font-bold hover:underline"
              >
                Stoka Git →
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Maliyet Değeri:</span>
                <strong className="text-slate-800 font-bold">
                  {formatCurrency(inventory.reduce((sum, i) => sum + i.costPrice * i.quantity, 0))}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Etiket Satış Değeri:</span>
                <strong className="text-cyan-700 font-bold">
                  {formatCurrency(inventory.reduce((sum, i) => sum + i.salePrice * i.quantity, 0))}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Toplam Ürün Adedi:</span>
                <strong className="text-slate-900 font-bold">
                  {inventory.reduce((sum, i) => sum + i.quantity, 0)} adet
                </strong>
              </div>
            </div>

            {/* Critical stock items */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                  Kritik Stok Uyarısı ({criticalStockItems.length})
                </span>
              </div>
              {criticalStockItems.length === 0 ? (
                <p className="text-xs text-emerald-700">Tüm ürünlerin stoku yeterli seviyede.</p>
              ) : (
                <div className="space-y-1 text-xs">
                  {criticalStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-1.5 rounded bg-rose-50 border border-rose-200">
                      <span className="font-semibold text-rose-950 truncate max-w-[150px]">
                        {item.brand} {item.model}
                      </span>
                      <span className="text-[11px] font-bold text-rose-700">
                        {item.quantity} adet kaldı!
                      </span>
                    </div>
                  ))}
                  {criticalStockItems.length > 3 && (
                    <p className="text-[10px] text-slate-500 text-right">
                      +{criticalStockItems.length - 3} diğer kritik ürün
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AÇIK HESAP & ALACAK DEFTERİ (VERESİYE) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>Açık Hesap / Bekleyen Alacak Defteri</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {debtorOrders.length} müşteri
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Müşterilerden teslimatta veya vadeli olarak tahsil edilecek kalan bakiyeler
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Toplam Açık Alacak:</span>
            <span className="text-xl font-black text-amber-600 font-mono">
              {formatCurrency(totalReceivable)}
            </span>
          </div>
        </div>

        {debtorOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            Harika! Şu an mağazanızda hiçbir müşteriden bekleyen bakiye bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Sipariş No & Tarih</th>
                  <th className="py-3 px-4">Müşteri Bilgileri</th>
                  <th className="py-3 px-4">Gözlük & Çerçeve</th>
                  <th className="py-3 px-4 text-right">Anlaşılan Fiyat</th>
                  <th className="py-3 px-4 text-right">Alınan Kapora</th>
                  <th className="py-3 px-4 text-right">Kalan Borç</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-right">Tahsilat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {debtorOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-slate-900 block">{ord.orderNo}</span>
                      <span className="text-[11px] text-slate-500">{formatDate(ord.orderDate)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 text-sm block">
                        {ord.customer.fullName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        TC: {ord.customer.tcNo || '-'} • Tel: {formatPhone(ord.customer.phone)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {ord.frame.brand} {ord.frame.model}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {ord.prescription.lensType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {formatCurrency(ord.salePrice)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                      {formatCurrency(ord.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {formatCurrency(ord.remainingAmount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {ord.status === 'teslim_edildi' ? 'Teslim Edildi' : 'Hazırlanıyor'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedDebtOrder(ord);
                            setPayAmount(ord.remainingAmount.toString());
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-xs"
                        >
                          Tahsil Et
                        </button>
                        <button
                          onClick={() => onSelectOrder(ord)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Debt Collection Modal */}
      {selectedDebtOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h4 className="font-bold text-sm">Tahsilat Girişi</h4>
              <button
                onClick={() => setSelectedDebtOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePayDebt} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block">Müşteri:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedDebtOrder.customer.fullName}</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  Sipariş No: {selectedDebtOrder.orderNo}
                </span>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-slate-600 block">Kalan Toplam Borç:</span>
                <span className="text-xl font-black text-amber-700">
                  {formatCurrency(selectedDebtOrder.remainingAmount)}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Şimdi Tahsil Edilen Tutar (₺)
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedDebtOrder.remainingAmount}
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDebtOrder(null)}
                  className="flex-1 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Tahsilatı Onayla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
