import React, { useState, useMemo } from 'react';
import {
  Search, Printer, MessageSquare, Edit3, Trash2, CheckCircle2,
  X, Plus, Glasses
} from 'lucide-react';
import { SaleOrder, OrderStatus, Customer, EyeValues } from '../types/optical';
import { ConfirmDialog } from './ConfirmDialog';
import {
  formatCurrency, formatDate, formatPhone, searchMatches,
  numberMatches, getOrderIndexForCustomer
} from '../utils/formatters';

interface OrderListProps {
  orders: SaleOrder[];
  filterStatus?: string;
  onSelectOrder: (order: SaleOrder) => void;
  onEditOrder: (order: SaleOrder) => void;
  onDeleteOrder: (orderId: string) => Promise<boolean>;
  onPrintOrder: (order: SaleOrder) => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => Promise<boolean>;
  onNewOrderForCustomer?: (customer: Customer) => void;
}

function hasAnyEyeValue(right?: EyeValues, left?: EyeValues): boolean {
  return Boolean(
    right?.sph || right?.cyl || right?.axis || right?.pd ||
    left?.sph || left?.cyl || left?.axis || left?.pd
  );
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  onSelectOrder,
  onEditOrder,
  onDeleteOrder,
  onPrintOrder,
  onUpdateStatus,
  onNewOrderForCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCustomerGlasses, setViewingCustomerGlasses] = useState<{
    customer: Customer;
    glasses: SaleOrder[];
  } | null>(null);
  const [pendingDeleteOrder, setPendingDeleteOrder] = useState<SaleOrder | null>(null);
  const [pendingDeliverOrder, setPendingDeliverOrder] = useState<SaleOrder | null>(null);

  const preparingOrders = useMemo(
    () => orders.filter((order) => order.status !== 'teslim_edildi'),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return preparingOrders;

    return preparingOrders.filter((order) => {
      const matchName = searchMatches(order.customer.fullName, q);
      const matchTC = numberMatches(order.customer.tcNo, q);
      const matchPhone = numberMatches(order.customer.phone, q);
      const matchBrand = searchMatches(order.frame.brand, q);
      const matchModel = searchMatches(order.frame.model, q);
      const matchLensBrand = searchMatches(order.prescription.lensBrand, q);
      const matchNearLensBrand = searchMatches(order.prescription.nearLensBrand, q);
      const matchLensModel = searchMatches(order.prescription.lensModel || order.prescription.lensType, q);
      const matchNearLensModel = searchMatches(order.prescription.nearLensModel, q);
      const matchOrderNo = searchMatches(order.orderNo, q);

      return (
        matchName || matchTC || matchPhone || matchBrand ||
        matchModel || matchLensBrand || matchNearLensBrand ||
        matchLensModel || matchNearLensModel || matchOrderNo
      );
    });
  }, [preparingOrders, searchQuery]);

  const handleWhatsApp = (order: SaleOrder) => {
    const cleanPhone = order.customer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0')
      ? '9' + cleanPhone
      : cleanPhone.startsWith('90')
        ? cleanPhone
        : '90' + cleanPhone;

    const message = encodeURIComponent(
      `Sayın ${order.customer.fullName}, Yazır Optik'ten ${order.frame.brand} gözlüğünüz hakkında bilgilendirmedir. Sipariş No: ${order.orderNo}.`
    );

    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  const renderUsageBadges = (rx: SaleOrder['prescription']) => {
    const types = rx.usageTypes && rx.usageTypes.length > 0
      ? rx.usageTypes
      : rx.usageType === 'uzak_yakin'
        ? ['uzak', 'yakin']
        : [rx.usageType || 'uzak'];

    return (
      <div className="flex flex-wrap items-center gap-1">
        {types.includes('uzak') && (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-950 border border-blue-300">
            Uzak
          </span>
        )}
        {types.includes('yakin') && (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300">
            Yakın (Okuma)
          </span>
        )}
        {types.includes('progresif') && (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-950 border border-purple-300">
            Progresif
          </span>
        )}
      </div>
    );
  };

  // Shared Lens & Prescription renderer (equal-sized Uzak & Yakın boxes, 3 stable tiers)
  const renderLensAndNumbers = (order: SaleOrder, isStackedMobile: boolean) => {
    const rx = order.prescription;
    const distRight = rx.distanceRx?.rightEye || rx.rightEye;
    const distLeft = rx.distanceRx?.leftEye || rx.leftEye;
    const nearRight = rx.nearRx?.rightEye;
    const nearLeft = rx.nearRx?.leftEye;

    const isBothUzakYakin =
      (rx.usageTypes?.includes('uzak') && rx.usageTypes?.includes('yakin')) ||
      rx.usageType === 'uzak_yakin';
    const isOnlyYakin =
      (rx.usageTypes?.length === 1 && rx.usageTypes[0] === 'yakin') ||
      rx.usageType === 'yakin';

    const hasDistNumbers = hasAnyEyeValue(distRight, distLeft);
    const hasNearNumbers = hasAnyEyeValue(nearRight, nearLeft);

    const isProgresif = rx.usageTypes?.includes('progresif') || rx.usageType === 'progresif';
    const hasTwoBoxes = (isBothUzakYakin || isProgresif) && hasDistNumbers && hasNearNumbers;

    const renderDistBox = (showTitle: boolean, forYakinOnly: boolean) => (
      <div className={`w-full h-full flex flex-col justify-between rounded-lg px-2.5 py-1.5 gap-1 border ${
        forYakinOnly
          ? 'bg-amber-50/70 border-amber-200'
          : 'bg-slate-50 border-slate-200'
      }`}>
        {showTitle && (
          <div className="text-[10px] font-sans font-black text-blue-900">
            Uzak Numaralar:
          </div>
        )}
        {(() => {
          const r = forYakinOnly ? (nearRight || distRight) : distRight;
          const l = forYakinOnly ? (nearLeft || distLeft) : distLeft;
          return (
            <div className="grid grid-cols-[52px_repeat(4,minmax(0,1fr))] gap-x-1 gap-y-0.5 items-center text-[11px] font-mono">
              <span className={`text-[9px] font-sans font-bold uppercase ${forYakinOnly ? 'text-amber-700/70' : 'text-slate-400'}`}>Göz</span>
              <span className={`text-[9px] font-sans font-bold uppercase text-center ${forYakinOnly ? 'text-amber-700/70' : 'text-slate-400'}`}>SPH</span>
              <span className={`text-[9px] font-sans font-bold uppercase text-center ${forYakinOnly ? 'text-amber-700/70' : 'text-slate-400'}`}>CYL</span>
              <span className={`text-[9px] font-sans font-bold uppercase text-center ${forYakinOnly ? 'text-amber-700/70' : 'text-slate-400'}`}>AKS</span>
              <span className={`text-[9px] font-sans font-bold uppercase text-center ${forYakinOnly ? 'text-amber-700/70' : 'text-slate-400'}`}>PD</span>

              <span className={`font-bold font-sans whitespace-nowrap ${forYakinOnly ? 'text-amber-900' : 'text-blue-700'}`}>Sağ (OD)</span>
              <span className="font-bold text-slate-900 text-center">{r?.sph || '0'}</span>
              <span className="text-slate-700 text-center">{r?.cyl || '0'}</span>
              <span className="text-slate-700 text-center">{r?.axis ? `${r.axis}°` : '-'}</span>
              <span className="text-slate-700 text-center">{r?.pd || '-'}</span>

              <span className={`font-bold font-sans whitespace-nowrap ${forYakinOnly ? 'text-orange-900' : 'text-indigo-700'}`}>Sol (OS)</span>
              <span className="font-bold text-slate-900 text-center">{l?.sph || '0'}</span>
              <span className="text-slate-700 text-center">{l?.cyl || '0'}</span>
              <span className="text-slate-700 text-center">{l?.axis ? `${l.axis}°` : '-'}</span>
              <span className="text-slate-700 text-center">{l?.pd || '-'}</span>
            </div>
          );
        })()}
      </div>
    );

    const renderNearBox = () => (
      <div className="w-full h-full flex flex-col justify-between bg-amber-50/70 border border-amber-200 rounded-lg px-2.5 py-1.5 gap-1">
        <div className="text-[10px] font-sans font-black text-amber-900">Yakın Numaralar:</div>
        <div className="grid grid-cols-[52px_repeat(4,minmax(0,1fr))] gap-x-1 gap-y-0.5 items-center text-[11px] font-mono">
          <span className="text-[9px] font-sans font-bold uppercase text-amber-700/70">Göz</span>
          <span className="text-[9px] font-sans font-bold uppercase text-amber-700/70 text-center">SPH</span>
          <span className="text-[9px] font-sans font-bold uppercase text-amber-700/70 text-center">CYL</span>
          <span className="text-[9px] font-sans font-bold uppercase text-amber-700/70 text-center">AKS</span>
          <span className="text-[9px] font-sans font-bold uppercase text-amber-700/70 text-center">PD</span>

          <span className="font-bold text-amber-900 font-sans whitespace-nowrap">Sağ (OD)</span>
          <span className="font-bold text-slate-900 text-center">{nearRight?.sph || '0'}</span>
          <span className="text-slate-700 text-center">{nearRight?.cyl || '0'}</span>
          <span className="text-slate-700 text-center">{nearRight?.axis ? `${nearRight.axis}°` : '-'}</span>
          <span className="text-slate-700 text-center">{nearRight?.pd || '-'}</span>

          <span className="font-bold text-orange-900 font-sans whitespace-nowrap">Sol (OS)</span>
          <span className="font-bold text-slate-900 text-center">{nearLeft?.sph || '0'}</span>
          <span className="text-slate-700 text-center">{nearLeft?.cyl || '0'}</span>
          <span className="text-slate-700 text-center">{nearLeft?.axis ? `${nearLeft.axis}°` : '-'}</span>
          <span className="text-slate-700 text-center">{nearLeft?.pd || '-'}</span>
        </div>
      </div>
    );

    if (isBothUzakYakin) {
      const uzakHeader = (
        <div className="flex flex-col gap-0.5 leading-tight min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-1 leading-tight">
            <span className="font-black text-blue-900 text-xs shrink-0">Uzak:</span>
            <span className="font-black text-slate-950 text-sm break-words">
              {rx.lensBrand || '-'}
            </span>
          </div>
          {(rx.lensModel || rx.lensType) && (
            <span className="text-slate-600 text-xs font-semibold break-words">
              ({rx.lensModel || rx.lensType})
            </span>
          )}
        </div>
      );

      const yakinHeader = (
        <div className="flex flex-col gap-0.5 leading-tight min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-1 leading-tight">
            <span className="font-black text-amber-900 text-xs shrink-0">Yakın:</span>
            <span className="font-black text-slate-950 text-sm break-words">
              {rx.nearLensBrand || rx.lensBrand || '-'}
            </span>
          </div>
          {rx.nearLensModel && (
            <span className="text-slate-600 text-xs font-semibold break-words">
              ({rx.nearLensModel})
            </span>
          )}
        </div>
      );

      if (isStackedMobile) {
        return (
          <div className="space-y-2.5">
            <div className="space-y-1">
              {uzakHeader}
              {hasDistNumbers && renderDistBox(true, false)}
            </div>
            <div className="space-y-1">
              {yakinHeader}
              {hasNearNumbers && renderNearBox()}
            </div>
          </div>
        );
      }

      return (
        <div className="w-full max-w-[580px]">
          <div className="hidden min-[840px]:grid grid-cols-2 gap-x-2.5 gap-y-1.5 items-stretch">
            <div className="flex items-start min-w-0">{uzakHeader}</div>
            <div className="flex items-start min-w-0">{yakinHeader}</div>
            {hasDistNumbers ? renderDistBox(true, false) : <div />}
            {hasNearNumbers ? renderNearBox() : <div />}
          </div>
          <div className="min-[840px]:hidden space-y-2.5">
            <div className="space-y-1">
              {uzakHeader}
              {hasDistNumbers && renderDistBox(true, false)}
            </div>
            <div className="space-y-1">
              {yakinHeader}
              {hasNearNumbers && renderNearBox()}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {renderUsageBadges(rx)}

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-black text-slate-950 text-sm">
              {rx.lensBrand || 'Zeiss'}
            </span>
            {(rx.lensModel || rx.lensType) && (
              <span className="text-slate-600 text-xs font-semibold">
                ({rx.lensModel || rx.lensType})
              </span>
            )}
          </div>

          <div className={`grid gap-2 w-full items-stretch ${
            isStackedMobile
              ? 'grid-cols-1'
              : hasTwoBoxes
                ? 'grid-cols-1 min-[840px]:grid-cols-2 max-w-[580px]'
                : 'grid-cols-1 max-w-[290px]'
          }`}>
            {(isOnlyYakin ? (hasNearNumbers || hasDistNumbers) : hasDistNumbers) &&
              renderDistBox(isProgresif, isOnlyYakin)}

            {isProgresif && hasNearNumbers && renderNearBox()}
          </div>
        </div>
      </div>
    );
  };

  const renderActionButtons = (order: SaleOrder, total: number, align: 'right' | 'split') => (
    <div className={align === 'split' ? 'flex items-center justify-between gap-2 flex-wrap' : 'space-y-2'}>
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : ''} gap-1.5`}>
        <button
          onClick={() => onPrintOrder(order)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
          title="Fiş / Reçete Yazdır"
        >
          <Printer className="w-4 h-4 text-cyan-700" />
        </button>

        <button
          onClick={() => onEditOrder(order)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
          title="Düzenle"
        >
          <Edit3 className="w-4 h-4 text-amber-700" />
        </button>

        {onUpdateStatus && (
          <button
            type="button"
            onClick={() => setPendingDeliverOrder(order)}
            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
            title="Teslim Edildi Onayı"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setPendingDeleteOrder(order)}
          className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          title="Sil"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {onNewOrderForCustomer && (
        <div className={align === 'right' ? 'text-right' : ''}>
          <button
            onClick={() => onNewOrderForCustomer(order.customer)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border border-cyan-200 text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
            title={`${order.customer.fullName} için yeni gözlük kaydet`}
          >
            <Plus className="w-3 h-3 stroke-[3]" />
            <span>+{total + 1}. Gözlüğü Ver</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Banner & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 desk:p-5 border border-slate-200/80 shadow-xs flex flex-col mid:flex-row mid:items-center mid:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>Hazırlanan Gözlükler</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-100 text-cyan-950 border border-cyan-300">
                {preparingOrders.length} Kayıt
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Müşterilere verilen tüm gözlük, çerçeve, cam marka/model ve numara kayıtları burada listelenir.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full mid:w-72 desk:w-80 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Müşteri Adı, T.C. No veya Telefon ile ara..."
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-cyan-500 outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              title="Aramayı Temizle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">
            {searchQuery ? `"${searchQuery}" için kayıt bulunamadı` : 'Henüz gözlük kaydı bulunmuyor'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Arama terimini değiştirip tekrar deneyebilirsiniz.'
              : 'Sağ üstteki "Yeni Gözlük & Cam Ver" butonuyla yeni kayıt ekleyebilirsiniz.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
            >
              Aramayı Temizle
            </button>
          )}
        </div>
      ) : (
        <>
          {/* BAND 1: TAM EKRAN (>= 1120px) - Sabit 5 Sütunlu Masaüstü Tablosu */}
          <div className="hidden desk:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-[22%]">Müşteri Bilgisi (TC / Tel)</th>
                  <th className="py-3.5 px-4 w-[16%]">Verdiğim Çerçeve</th>
                  <th className="py-3.5 px-4 w-[36%]">Verdiğim Cam & Numaraları</th>
                  <th className="py-3.5 px-4 w-[12%] text-right">Fiyat (Çerçeve + Cam)</th>
                  <th className="py-3.5 px-4 w-[14%] text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const { index, total, allOrders } = getOrderIndexForCustomer(orders, order);
                  const framePrice = order.framePrice || 0;
                  const lensPrice = order.lensPrice || 0;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Müşteri Bilgisi */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">
                            {order.customer.fullName}
                          </span>
                          {total > 1 ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                index === 1
                                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                  : 'bg-amber-100 text-amber-950 border border-amber-300'
                              }`}
                            >
                              <Glasses className="w-3 h-3 text-amber-700" />
                              {index}. Gözlük (Toplam {total})
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              1. Gözlük
                            </span>
                          )}
                        </div>

                        <div className="font-mono text-[11px] text-slate-700 mt-0.5">
                          TC: <strong className="text-slate-950 font-bold">{order.customer.tcNo || 'Yok'}</strong>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                          <span className="font-medium">{formatPhone(order.customer.phone)}</span>
                          {order.customer.phone && (
                            <button
                              onClick={() => handleWhatsApp(order)}
                              className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-0.5 font-bold cursor-pointer"
                              title="WhatsApp Mesajı Aç"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {order.orderNo} • {formatDate(order.orderDate)}
                          </span>

                          {total > 1 && (
                            <button
                              onClick={() => setViewingCustomerGlasses({ customer: order.customer, glasses: allOrders })}
                              className="text-[10px] text-cyan-700 hover:text-cyan-900 font-bold underline cursor-pointer"
                              title="Tüm gözlüklerini karşılaştır"
                            >
                              Diğer Gözlükleri ({total - 1})
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 2. Verdiğim Çerçeve */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-black text-slate-900 text-sm block">
                          {order.frame.brand}
                        </span>
                        <span className="font-medium text-slate-700 text-xs block">
                          {order.frame.model || 'Model Belirtilmedi'}
                        </span>
                        {order.frame.colorCode && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Renk: {order.frame.colorCode}
                          </span>
                        )}
                        {order.frame.size && (
                          <span className="text-[10px] font-mono text-slate-400 block">
                            Ölçü: {order.frame.size}
                          </span>
                        )}
                      </td>

                      {/* 3. Verdiğim Cam & Numaraları */}
                      <td className="py-3.5 px-4 align-top">
                        {renderLensAndNumbers(order, false)}
                      </td>

                      {/* 4. Fiyat Bilgisi */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <span className="text-base font-black text-slate-950 block whitespace-nowrap">
                          {formatCurrency(order.salePrice)}
                        </span>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {framePrice > 0 && <span>Çerçeve: {formatCurrency(framePrice)}</span>}
                          {framePrice > 0 && lensPrice > 0 && <span> + </span>}
                          {lensPrice > 0 && <span>Cam: {formatCurrency(lensPrice)}</span>}
                        </div>
                      </td>

                      {/* 5. İşlemler */}
                      <td className="py-3.5 px-4 align-top text-right">
                        {renderActionButtons(order, total, 'right')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* BAND 2: %65-70 BANDI (680px - 1119px) - Düzenli Orta Ekran Kartları */}
          <div className="hidden mid:block desk:hidden space-y-3">
            {filteredOrders.map((order) => {
              const { index, total, allOrders } = getOrderIndexForCustomer(orders, order);
              const framePrice = order.framePrice || 0;
              const lensPrice = order.lensPrice || 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3"
                >
                  {/* Card Header: Müşteri + Fiyat + İşlemler */}
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {order.customer.fullName}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          total > 1
                            ? 'bg-amber-100 text-amber-950 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          {index}. Gözlük {total > 1 ? `(Toplam ${total})` : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="font-mono">
                          TC: <strong className="text-slate-950">{order.customer.tcNo || 'Yok'}</strong>
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          {formatPhone(order.customer.phone)}
                          {order.customer.phone && (
                            <button
                              onClick={() => handleWhatsApp(order)}
                              className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                              title="WhatsApp Mesajı Aç"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {order.orderNo} • {formatDate(order.orderDate)}
                        </span>
                        {total > 1 && (
                          <button
                            onClick={() => setViewingCustomerGlasses({ customer: order.customer, glasses: allOrders })}
                            className="text-[11px] text-cyan-700 hover:text-cyan-900 font-bold underline cursor-pointer"
                          >
                            Diğer Gözlükleri ({total - 1})
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-base font-black text-slate-950 block whitespace-nowrap">
                          {formatCurrency(order.salePrice)}
                        </span>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {framePrice > 0 && <span>Çerçeve: {formatCurrency(framePrice)}</span>}
                          {framePrice > 0 && lensPrice > 0 && <span> + </span>}
                          {lensPrice > 0 && <span>Cam: {formatCurrency(lensPrice)}</span>}
                        </div>
                      </div>
                      {renderActionButtons(order, total, 'right')}
                    </div>
                  </div>

                  {/* Card Body: Çerçeve (Sol) + Cam & Numaralar (Sağ) */}
                  <div className="grid grid-cols-[165px_1fr] gap-4 items-start">
                    <div className="text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Verdiğim Çerçeve
                      </span>
                      <span className="font-black text-slate-900 text-sm block">
                        {order.frame.brand}
                      </span>
                      <span className="font-medium text-slate-700 block">
                        {order.frame.model || 'Model Belirtilmedi'}
                      </span>
                      {order.frame.colorCode && (
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Renk: {order.frame.colorCode}
                        </span>
                      )}
                      {order.frame.size && (
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Ölçü: {order.frame.size}
                        </span>
                      )}
                    </div>

                    <div>
                      {renderLensAndNumbers(order, false)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BAND 3: %35-40 BANDI (< 680px) - Tek Sütunlu Dar Ekran Kartları */}
          <div className="block mid:hidden space-y-3">
            {filteredOrders.map((order) => {
              const { index, total, allOrders } = getOrderIndexForCustomer(orders, order);
              const framePrice = order.framePrice || 0;
              const lensPrice = order.lensPrice || 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 space-y-3 text-xs"
                >
                  {/* 1. Müşteri Bilgisi */}
                  <div className="pb-2.5 border-b border-slate-100 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {order.customer.fullName}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        total > 1
                          ? 'bg-amber-100 text-amber-950 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}>
                        {index}. Gözlük {total > 1 ? `(${total})` : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600">
                      <span className="font-mono text-[11px]">
                        TC: <strong className="text-slate-950">{order.customer.tcNo || 'Yok'}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        {formatPhone(order.customer.phone)}
                        {order.customer.phone && (
                          <button
                            onClick={() => handleWhatsApp(order)}
                            className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            title="WhatsApp Mesajı Aç"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{order.orderNo} • {formatDate(order.orderDate)}</span>
                      {total > 1 && (
                        <button
                          onClick={() => setViewingCustomerGlasses({ customer: order.customer, glasses: allOrders })}
                          className="text-cyan-700 hover:text-cyan-900 font-sans font-bold underline cursor-pointer"
                        >
                          Diğer Gözlükleri ({total - 1})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Çerçeve & Fiyat Satırı */}
                  <div className="grid grid-cols-2 gap-2.5 pb-2.5 border-b border-slate-100">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Verdiğim Çerçeve</span>
                      <span className="font-black text-slate-900 text-sm block truncate">{order.frame.brand}</span>
                      <span className="text-slate-700 block truncate">{order.frame.model || 'Model Belirtilmedi'}</span>
                      {order.frame.colorCode && (
                        <span className="text-[10px] text-slate-500 block truncate">Renk: {order.frame.colorCode}</span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Toplam Fiyat</span>
                      <span className="text-base font-black text-slate-950 block">
                        {formatCurrency(order.salePrice)}
                      </span>
                      <div className="text-[10px] text-slate-500">
                        {framePrice > 0 && <span>Ç: {formatCurrency(framePrice)}</span>}
                        {framePrice > 0 && lensPrice > 0 && <span> + </span>}
                        {lensPrice > 0 && <span>C: {formatCurrency(lensPrice)}</span>}
                      </div>
                    </div>
                  </div>

                  {/* 3. Cam & Numaralar */}
                  <div>
                    {renderLensAndNumbers(order, true)}
                  </div>

                  {/* 4. İşlemler */}
                  <div className="pt-2.5 border-t border-slate-100">
                    {renderActionButtons(order, total, 'split')}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* MODAL: Tüm Gözlükleri Karşılaştır / Gör */}
      {viewingCustomerGlasses && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 mid:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Glasses className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {viewingCustomerGlasses.customer.fullName} - Tüm Gözlükleri ({viewingCustomerGlasses.glasses.length} Adet)
                  </h3>
                  <p className="text-xs text-slate-400">
                    T.C.: {viewingCustomerGlasses.customer.tcNo || 'Belirtilmedi'} • Çerçeve, cam ve numara geçmişi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingCustomerGlasses(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex flex-col mid:flex-row mid:items-center justify-between gap-2 p-3 bg-cyan-50 rounded-xl border border-cyan-200">
                <span className="text-xs font-bold text-cyan-950">
                  Bu müşteriye yeni bir gözlük ({viewingCustomerGlasses.glasses.length + 1}. Gözlük) vermek için:
                </span>
                {onNewOrderForCustomer && (
                  <button
                    onClick={() => {
                      const cust = viewingCustomerGlasses.customer;
                      setViewingCustomerGlasses(null);
                      onNewOrderForCustomer(cust);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+{viewingCustomerGlasses.glasses.length + 1}. Gözlüğü Ver</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 mid:grid-cols-2 gap-4">
                {viewingCustomerGlasses.glasses.map((ord, idx) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl border-2 border-slate-200 hover:border-cyan-400 bg-white transition-all space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-black text-xs text-cyan-900 bg-cyan-100/70 px-2.5 py-0.5 rounded-full">
                        {idx + 1}. GÖZLÜK
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {formatDate(ord.orderDate)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Verilen Çerçeve:</span>
                      <p className="text-sm font-bold text-slate-900">
                        {ord.frame.brand} {ord.frame.model} {ord.frame.colorCode ? `(${ord.frame.colorCode})` : ''}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Verilen Cam:</span>
                      <p className="text-xs font-bold text-slate-900">
                        {ord.prescription.lensBrand || 'Zeiss'} {ord.prescription.lensModel ? `- ${ord.prescription.lensModel}` : ''}
                      </p>
                      {ord.prescription.nearLensBrand && (
                        <p className="text-xs font-bold text-amber-900 mt-0.5">
                          Yakın: {ord.prescription.nearLensBrand} {ord.prescription.nearLensModel ? `- ${ord.prescription.nearLensModel}` : ''}
                        </p>
                      )}
                      <div className="mt-1">
                        {renderUsageBadges(ord.prescription)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="font-bold text-slate-500">Toplam Fiyat:</span>
                      <span className="font-black text-slate-950 text-sm">
                        {formatCurrency(ord.salePrice)}
                      </span>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => {
                          setViewingCustomerGlasses(null);
                          onSelectOrder(ord);
                        }}
                        className="text-xs text-cyan-700 hover:text-cyan-900 font-bold underline cursor-pointer"
                      >
                        Gözlük Detayını Aç →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDeliverOrder)}
        variant="confirm"
        title="Gözlük Teslim Onayı"
        message={
          pendingDeliverOrder
            ? `${pendingDeliverOrder.customer.fullName} adına kayıtlı bu gözlük (${pendingDeliverOrder.orderNo}) teslim edildi mi? Onaylandığında Hazırlanan Gözlükler listesinden kaldırılacaktır.`
            : ''
        }
        confirmLabel="Evet, Teslim Edildi"
        cancelLabel="Vazgeç"
        onConfirm={async () => {
          if (pendingDeliverOrder && onUpdateStatus) {
            if (!await onUpdateStatus(pendingDeliverOrder.id, 'teslim_edildi')) return;
            setPendingDeliverOrder(null);
          }
        }}
        onCancel={() => setPendingDeliverOrder(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteOrder)}
        title="Gözlük Kaydını Sil"
        message={
          pendingDeleteOrder
            ? `${pendingDeleteOrder.customer.fullName} adına kayıtlı gözlük siparişini (${pendingDeleteOrder.orderNo}) silmek istediğinize emin misiniz?`
            : ''
        }
        onConfirm={async () => {
          if (pendingDeleteOrder) {
            if (!await onDeleteOrder(pendingDeleteOrder.id)) return;
            setPendingDeleteOrder(null);
          }
        }}
        onCancel={() => setPendingDeleteOrder(null)}
      />
    </div>
  );
};
