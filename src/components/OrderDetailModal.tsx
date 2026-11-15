import React, { useState } from 'react';
import {
  X, Printer, Edit3, Trash2, Phone, MessageSquare, Copy, Check, Glasses, Plus
} from 'lucide-react';
import { SaleOrder, OrderStatus, StoreSettings, Customer, EyeValues } from '../types/optical';
import { ConfirmDialog } from './ConfirmDialog';
import {
  formatCurrency, formatDate, formatDateTime, formatPhone, getOrderIndexForCustomer
} from '../utils/formatters';

interface OrderDetailModalProps {
  order: SaleOrder;
  orders?: SaleOrder[];
  settings: StoreSettings;
  onClose: () => void;
  onEdit: (order: SaleOrder) => void;
  onDelete: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => void;
  onAddPayment?: (orderId: string, additionalAmount: number) => void;
  onPrint: (order: SaleOrder) => void;
  onSelectOrder?: (order: SaleOrder) => void;
  onNewOrderForCustomer?: (customer: Customer) => void;
}

const DiopterTable: React.FC<{ title?: string; accent?: 'blue' | 'amber'; rightEye?: EyeValues; leftEye?: EyeValues }> = ({
  title,
  accent = 'blue',
  rightEye,
  leftEye,
}) => {
  const isAmber = accent === 'amber';
  return (
    <div className="space-y-1.5">
      {title && (
        <span className={`text-xs font-black uppercase tracking-wider block ${isAmber ? 'text-amber-900' : 'text-blue-900'}`}>
          {title}
        </span>
      )}
      <div className={`overflow-x-auto border rounded-lg ${isAmber ? 'border-amber-200' : 'border-slate-200'}`}>
        <table className="w-full text-center text-xs">
          <thead>
            <tr className={`font-bold border-b ${isAmber ? 'bg-amber-50 text-amber-950 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              <th className="py-2 px-3 text-left">Göz</th>
              <th className="py-2 px-3">SPH (Küre)</th>
              <th className="py-2 px-3">CYL (Silindir)</th>
              <th className="py-2 px-3">AKS (Açı)</th>
              <th className="py-2 px-3">PD (Pupilla)</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isAmber ? 'divide-amber-100' : 'divide-slate-200'}`}>
            <tr className={isAmber ? 'hover:bg-amber-50/40' : 'hover:bg-slate-50'}>
              <td className={`py-2 px-3 text-left font-bold ${isAmber ? 'text-amber-900' : 'text-blue-700'}`}>SAĞ (OD)</td>
              <td className="py-2 px-3 font-mono font-bold text-slate-900">{rightEye?.sph || '0.00'}</td>
              <td className="py-2 px-3 font-mono text-slate-800">{rightEye?.cyl || '0.00'}</td>
              <td className="py-2 px-3 font-mono text-slate-800">{rightEye?.axis ? `${rightEye.axis}°` : '-'}</td>
              <td className="py-2 px-3 font-mono text-slate-800">{rightEye?.pd ? `${rightEye.pd} mm` : '-'}</td>
            </tr>
            <tr className={isAmber ? 'hover:bg-amber-50/40' : 'hover:bg-slate-50'}>
              <td className={`py-2 px-3 text-left font-bold ${isAmber ? 'text-orange-900' : 'text-indigo-700'}`}>SOL (OS)</td>
              <td className="py-2 px-3 font-mono font-bold text-slate-900">{leftEye?.sph || '0.00'}</td>
              <td className="py-2 px-3 font-mono text-slate-800">{leftEye?.cyl || '0.00'}</td>
              <td className="py-2 px-3 font-mono text-slate-800">{leftEye?.axis ? `${leftEye.axis}°` : '-'}</td>
              <td className="py-2 px-3 font-mono text-slate-800">{leftEye?.pd ? `${leftEye.pd} mm` : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  orders = [],
  onClose,
  onEdit,
  onDelete,
  onPrint,
  onSelectOrder,
  onNewOrderForCustomer,
}) => {
  const [copiedTC, setCopiedTC] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { index, total, allOrders } = getOrderIndexForCustomer(orders, order);
  const rx = order.prescription;

  const isBothUzakYakin =
    (rx.usageTypes?.includes('uzak') && rx.usageTypes?.includes('yakin')) ||
    rx.usageType === 'uzak_yakin';
  const isProgresif = rx.usageTypes?.includes('progresif') || rx.usageType === 'progresif';
  const isOnlyYakin =
    (rx.usageTypes?.length === 1 && rx.usageTypes[0] === 'yakin') ||
    rx.usageType === 'yakin';

  const distRight = rx.distanceRx?.rightEye || rx.rightEye;
  const distLeft = rx.distanceRx?.leftEye || rx.leftEye;
  const nearRight = rx.nearRx?.rightEye || (isOnlyYakin ? rx.rightEye : undefined);
  const nearLeft = rx.nearRx?.leftEye || (isOnlyYakin ? rx.leftEye : undefined);

  const handleCopyTC = () => {
    if (!order.customer.tcNo) return;
    navigator.clipboard.writeText(order.customer.tcNo);
    setCopiedTC(true);
    setTimeout(() => setCopiedTC(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 mid:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-bold px-2.5 py-1 rounded bg-slate-800 text-sm border border-slate-700">
              {order.orderNo}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {order.customer.fullName}
                </h3>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  total > 1 ? 'bg-amber-400 text-slate-950' : 'bg-cyan-500 text-slate-950'
                }`}>
                  {index}. Gözlük (Toplam {total})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kayıt Tarihi: {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(order)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fiş Yazdır</span>
            </button>
            <button
              onClick={() => onEdit(order)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Düzenle</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Glasses Quick Switcher Tabs */}
        {total > 1 && (
          <div className="bg-amber-50/70 border-b border-amber-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-black text-amber-950 uppercase whitespace-nowrap mr-1">
                Gözlükleri:
              </span>
              {allOrders.map((ord, i) => {
                const isCurrent = ord.id === order.id;
                return (
                  <button
                    key={ord.id}
                    onClick={() => {
                      if (onSelectOrder) onSelectOrder(ord);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-amber-100 border border-amber-300'
                    }`}
                  >
                    <Glasses className="w-3.5 h-3.5" />
                    <span>{i + 1}. Gözlük ({formatDate(ord.orderDate)})</span>
                    {isCurrent && <span className="text-[10px] uppercase font-black ml-0.5">• Açık</span>}
                  </button>
                );
              })}
            </div>

            {onNewOrderForCustomer && (
              <button
                onClick={() => {
                  onClose();
                  onNewOrderForCustomer(order.customer);
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+{total + 1}. Gözlüğü Ver</span>
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Pricing Box */}
          <div className="p-4 bg-cyan-50/60 rounded-xl border-2 border-cyan-200 flex flex-col mid:flex-row mid:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                TOPLAM SATIŞ FİYATI
              </span>
              <span className="text-3xl font-black text-slate-950">
                {formatCurrency(order.salePrice)}
              </span>
            </div>

            <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-cyan-200 space-y-1">
              <p><strong>Gözlük (Çerçeve) Fiyatı:</strong> {formatCurrency(order.framePrice || 0)}</p>
              <p><strong>Cam Fiyatı:</strong> {formatCurrency(order.lensPrice || 0)}</p>
              <p className="text-[11px] text-slate-500"><strong>Sipariş Tarihi:</strong> {formatDate(order.orderDate)}</p>
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm">Müşteri Bilgileri (T.C. Eşleşmesi)</h4>
              <div className="flex items-center gap-2">
                {order.customer.phone && (
                  <>
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="p-1.5 rounded-md text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                      title="Ara"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://wa.me/90${order.customer.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 mid:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Ad Soyad</span>
                <span className="font-bold text-slate-800 text-sm">{order.customer.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">T.C. Kimlik No</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-800">{order.customer.tcNo || '-'}</span>
                  {order.customer.tcNo && (
                    <button
                      onClick={handleCopyTC}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="TC No Kopyala"
                    >
                      {copiedTC ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block">Telefon</span>
                <span className="font-medium text-slate-800">{formatPhone(order.customer.phone)}</span>
              </div>
            </div>
          </div>

          {/* Verdiğim Cam Detayları */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
            <div className="border-b border-slate-100 pb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold text-slate-900 text-sm">
                Verdiğim Cam Bilgileri ({index}. Gözlük)
              </h4>
              <div className="flex gap-1.5">
                {isBothUzakYakin ? (
                  <>
                    <span className="px-2.5 py-0.5 rounded text-xs font-black bg-blue-100 text-blue-900 border border-blue-200">Uzak</span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">Yakın (Okuma)</span>
                  </>
                ) : (
                  <span className="px-2.5 py-0.5 rounded text-xs font-black bg-blue-100 text-blue-900 border border-blue-200">
                    {isOnlyYakin ? 'Yakın (Okuma)' : isProgresif ? 'Progresif' : 'Uzak'}
                  </span>
                )}
              </div>
            </div>

            {isBothUzakYakin ? (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200 space-y-3">
                  <div className="grid grid-cols-1 mid:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Uzak Cam Markası</span>
                      <span className="font-black text-slate-950 text-sm">{rx.lensBrand || 'Zeiss'}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Uzak Cam Modeli</span>
                      <span className="font-bold text-slate-900 text-sm">{rx.lensModel || rx.lensType || '-'}</span>
                    </div>
                  </div>
                  <DiopterTable title="UZAK GÖZLÜK NUMARALARI" accent="blue" rightEye={distRight} leftEye={distLeft} />
                </div>

                <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200 space-y-3">
                  <div className="grid grid-cols-1 mid:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Yakın Cam Markası</span>
                      <span className="font-black text-slate-950 text-sm">{rx.nearLensBrand || rx.lensBrand || 'Zeiss'}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Yakın Cam Modeli</span>
                      <span className="font-bold text-slate-900 text-sm">{rx.nearLensModel || '-'}</span>
                    </div>
                  </div>
                  <DiopterTable title="YAKIN GÖZLÜK NUMARALARI" accent="amber" rightEye={nearRight} leftEye={nearLeft} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 mid:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Cam Markası</span>
                    <span className="font-black text-slate-950 text-base">{rx.lensBrand || 'Zeiss'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Cam Modeli</span>
                    <span className="font-bold text-slate-900 text-sm">{rx.lensModel || rx.lensType || '-'}</span>
                  </div>
                </div>

                {isProgresif ? (
                  <div className="space-y-3">
                    <DiopterTable title="UZAK GÖZLÜK NUMARALARI" accent="blue" rightEye={distRight} leftEye={distLeft} />
                    {nearRight || nearLeft ? (
                      <DiopterTable title="YAKIN GÖZLÜK NUMARALARI" accent="amber" rightEye={nearRight} leftEye={nearLeft} />
                    ) : null}
                  </div>
                ) : isOnlyYakin ? (
                  <DiopterTable title="YAKIN GÖZLÜK NUMARALARI" accent="amber" rightEye={nearRight} leftEye={nearLeft} />
                ) : (
                  <DiopterTable title="UZAK GÖZLÜK NUMARALARI" accent="blue" rightEye={distRight} leftEye={distLeft} />
                )}
              </div>
            )}
          </div>

          {/* Frame Details */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h4 className="font-bold text-slate-900 text-sm mb-3 border-b border-slate-100 pb-2">
              Verdiğim Gözlük (Çerçeve)
            </h4>
            <div className="grid grid-cols-2 mid:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Marka</span>
                <span className="font-bold text-slate-900 text-sm">{order.frame.brand}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Model</span>
                <span className="font-bold text-slate-900">{order.frame.model || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Renk Kodu</span>
                <span className="text-slate-800">{order.frame.colorCode || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ekartman</span>
                <span className="font-mono text-slate-800">{order.frame.size || '-'}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-0.5">Not / Açıklama:</span>
              <p className="text-slate-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Siparişi Sil</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Gözlük Kaydını Sil"
        message={`${order.customer.fullName} adına kayıtlı bu siparişi (${order.orderNo}) silmek istediğinizden emin misiniz?`}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(order.id);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
