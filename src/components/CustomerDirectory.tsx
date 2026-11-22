import React, { useState, useMemo } from 'react';
import {
  Users, Search, Phone, MessageSquare, Plus, Eye,
  Edit3, Check, UserPlus, Copy, X, CheckCircle2
} from 'lucide-react';
import { Customer, SaleOrder } from '../types/optical';
import { ConfirmDialog } from './ConfirmDialog';
import {
  formatCurrency, formatDate, formatPhone, searchMatches,
  numberMatches, getCustomerOrderList
} from '../utils/formatters';

interface CustomerDirectoryProps {
  customers: Customer[];
  orders: SaleOrder[];
  onSaveCustomer: (customer: Customer) => Promise<boolean>;
  onDeleteCustomer: (customerId: string) => Promise<boolean>;
  onNewOrderForCustomer: (customer: Customer) => void;
  onViewOrder: (order: SaleOrder) => void;
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  customers,
  orders,
  onSaveCustomer,
  onDeleteCustomer,
  onNewOrderForCustomer,
  onViewOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [copiedTC, setCopiedTC] = useState<string | null>(null);
  const [pendingDeleteCustomer, setPendingDeleteCustomer] = useState<Customer | null>(null);

  const [fullName, setFullName] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Only show delivered glasses; hide customers whose orders are all still undelivered
  const customersWithOrders = useMemo(() => {
    const list: { customer: Customer; custOrders: SaleOrder[]; latestDate: string }[] = [];

    customers.forEach((cust) => {
      const allCustOrders = getCustomerOrderList(orders, cust);
      const deliveredOrders = allCustOrders.filter((o) => o.status === 'teslim_edildi');
      if (deliveredOrders.length === 0 && allCustOrders.length > 0) {
        return;
      }
      const latestOrder = deliveredOrders[deliveredOrders.length - 1];
      const latestDate = latestOrder?.deliveryDate || latestOrder?.orderDate || latestOrder?.createdAt || cust.createdAt;
      list.push({ customer: cust, custOrders: deliveredOrders, latestDate });
    });

    list.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
    return list;
  }, [customers, orders]);

  const isSearching = searchQuery.trim().length > 0;

  const displayList = useMemo(() => {
    const q = searchQuery.trim();

    if (!q) {
      return customersWithOrders.slice(0, 10);
    }

    return customersWithOrders.filter(({ customer, custOrders }) => {
      const matchName = searchMatches(customer.fullName, q);
      const matchTC = numberMatches(customer.tcNo, q);
      const matchPhone = numberMatches(customer.phone, q);
      const matchNotes = searchMatches(customer.notes, q);

      const matchGlasses = custOrders.some((ord) =>
        searchMatches(ord.frame.brand, q) ||
        searchMatches(ord.frame.model, q) ||
        searchMatches(ord.prescription.lensBrand, q) ||
        searchMatches(ord.prescription.nearLensBrand, q) ||
        searchMatches(ord.prescription.lensModel, q) ||
        searchMatches(ord.prescription.nearLensModel, q)
      );

      return matchName || matchTC || matchPhone || matchNotes || matchGlasses;
    });
  }, [customersWithOrders, searchQuery]);

  const openAddCustomerModal = () => {
    setEditingCustomer(null);
    setFullName('');
    setTcNo('');
    setPhone('');
    setNotes('');
    setShowEditModal(true);
  };

  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFullName(customer.fullName);
    setTcNo(customer.tcNo || '');
    setPhone(customer.phone || '');
    setNotes(customer.notes || '');
    setShowEditModal(true);
  };

  const handleSaveCustomerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const saved: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      fullName: fullName.trim(),
      tcNo: tcNo.trim(),
      phone: phone.trim(),
      notes: notes.trim() || undefined,
      createdAt: editingCustomer?.createdAt || new Date().toISOString(),
    };

    if (!await onSaveCustomer(saved)) return;
    if (selectedCustomer && selectedCustomer.id === saved.id) {
      setSelectedCustomer(saved);
    }
    setShowEditModal(false);
  };

  const handleCopyTC = (tc: string) => {
    navigator.clipboard.writeText(tc);
    setCopiedTC(tc);
    setTimeout(() => setCopiedTC(null), 2000);
  };

  const handleWhatsApp = (custPhone: string, custName: string) => {
    const cleanPhone = custPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0') ? '9' + cleanPhone : '90' + cleanPhone;
    const msg = encodeURIComponent(`Merhaba Sayın ${custName}, Yazır Optik'ten selamlar.`);
    window.open(`https://wa.me/${phoneWithCountry}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header and Search */}
      <div className="bg-white rounded-2xl p-4 desk:p-5 border border-slate-200/80 shadow-xs flex flex-col mid:flex-row mid:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                Müşteri Bilgi Defteri
              </h3>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                {customersWithOrders.length} Kayıtlı Müşteri
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Yalnızca <strong>teslim edilen gözlükleri</strong> olan müşteriler burada listelenir (varsayılan son 10 müşteri); tüm kayıtlara T.C. veya isimle arayarak ulaşabilirsiniz.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 mid:w-64 desk:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="T.C. Kimlik No, İsim veya Telefon ara..."
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-cyan-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={openAddCustomerModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs whitespace-nowrap shadow-xs cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Müşteri Ekle</span>
          </button>
        </div>
      </div>

      {/* Notice info on list count */}
      {!isSearching && customersWithOrders.length > 10 && (
        <div className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 text-xs flex items-center justify-between border border-slate-200">
          <span>
            📋 Sayfada en son işlem yapılan <strong>son 10 müşteri</strong> gösteriliyor (Toplam {customersWithOrders.length} müşteri).
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            Diğer müşterileri görmek için yukarıdaki arama kutusuna T.C. veya İsim yazabilirsiniz.
          </span>
        </div>
      )}

      {/* Grid of Customers */}
      {displayList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">
            {isSearching ? `"${searchQuery}" ile eşleşen müşteri bulunamadı` : 'Henüz kayıtlı müşteri yok'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isSearching
              ? 'T.C. Kimlik numarasını kontrol edebilir veya arama kutusunu temizleyebilirsiniz.'
              : 'Yeni Gözlük & Cam Ver veya Müşteri Ekle butonuyla yeni müşteri ekleyebilirsiniz.'}
          </p>
          {isSearching && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
            >
              Aramayı Temizle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 mid:grid-cols-2 desk:grid-cols-3 gap-4">
          {displayList.map(({ customer, custOrders }) => {
            const totalSpent = custOrders.reduce((sum, o) => sum + o.salePrice, 0);
            const latestOrder = custOrders[custOrders.length - 1];
            const rx = latestOrder?.prescription;

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Customer Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {customer.fullName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                        <span className="font-mono font-bold text-slate-900">
                          TC: {customer.tcNo || 'Belirtilmedi'}
                        </span>
                        {customer.tcNo && (
                          <button
                            onClick={() => handleCopyTC(customer.tcNo)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="T.C. Kopyala"
                          >
                            {copiedTC === customer.tcNo ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      custOrders.length > 1
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : 'bg-cyan-100 text-cyan-950 border border-cyan-300'
                    }`}>
                      {custOrders.length} Gözlük
                    </span>
                  </div>

                  {/* Phone & WhatsApp */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{formatPhone(customer.phone)}</span>
                      <div className="flex items-center gap-1">
                        {customer.phone && (
                          <>
                            <a
                              href={`tel:${customer.phone}`}
                              className="p-1 text-slate-500 hover:text-blue-600 rounded"
                              title="Telefonla Ara"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleWhatsApp(customer.phone, customer.fullName)}
                              className="p-1 text-slate-500 hover:text-emerald-600 rounded cursor-pointer"
                              title="WhatsApp Mesajı"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {customer.notes && (
                      <p className="text-slate-600 text-[11px] italic truncate mt-1">
                        Not: {customer.notes}
                      </p>
                    )}
                  </div>

                  {/* Glasses Preview (Delivered Only) */}
                  {custOrders.length > 1 ? (
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 mb-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-amber-900 text-[11px] font-black uppercase">
                        <span>Teslim Edilen Gözlükler ({custOrders.length})</span>
                        <span>Son: {formatDate(latestOrder.deliveryDate || latestOrder.orderDate)}</span>
                      </div>
                      <div className="space-y-1">
                        {custOrders.map((ord, idx) => (
                          <div key={ord.id} className="flex items-center justify-between gap-2 bg-white px-2 py-1.5 rounded border border-amber-200 text-[11px]">
                            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 truncate">
                                {idx + 1}. Gözlük: {ord.frame.brand} ({ord.prescription.lensBrand || 'Zeiss'})
                              </span>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 text-[9px] font-black shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Teslim Edildi
                              </span>
                            </div>
                            <span className="font-semibold text-slate-700 shrink-0">
                              {formatCurrency(ord.salePrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : latestOrder && rx ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2 text-slate-500 text-[10px] uppercase font-bold">
                        <div className="flex items-center gap-1.5">
                          <span>1. Gözlük</span>
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black normal-case">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Teslim Edildi
                          </span>
                        </div>
                        <span>{formatDate(latestOrder.deliveryDate || latestOrder.orderDate)}</span>
                      </div>
                      <p className="font-bold text-slate-900">
                        Çerçeve: {latestOrder.frame.brand} {latestOrder.frame.model}
                      </p>
                      <div className="bg-white p-2 rounded border border-slate-200 space-y-0.5">
                        <span className="font-bold text-slate-900 block">
                          Cam: {rx.lensBrand || 'Zeiss'} {rx.lensModel || rx.lensType ? `(${rx.lensModel || rx.lensType})` : ''}
                        </span>
                        {rx.nearLensBrand && (
                          <span className="font-bold text-amber-900 block">
                            Yakın Cam: {rx.nearLensBrand} {rx.nearLensModel ? `(${rx.nearLensModel})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Pricing Summary */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Teslim Edilen:</span>
                      <span className="font-bold text-slate-800">{custOrders.length} Gözlük</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Toplam Tutar:</span>
                      <span className="font-black text-slate-900">{formatCurrency(totalSpent)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>Gözlükleri ({custOrders.length})</span>
                  </button>

                  <button
                    onClick={() => onNewOrderForCustomer(customer)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+{custOrders.length + 1}. Gözlüğü Ver</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Profile & All Delivered Glasses History Modal */}
      {selectedCustomer && (() => {
        const selectedDeliveredOrders = getCustomerOrderList(orders, selectedCustomer).filter(
          (o) => o.status === 'teslim_edildi'
        );
        return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 mid:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-white">
                    {selectedCustomer.fullName} - Müşteri Dosyası
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-cyan-500 text-slate-950">
                    {selectedDeliveredOrders.length} Teslim Edilen
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  T.C. Kimlik: {selectedCustomer.tcNo || 'Belirtilmedi'} • Telefon: {formatPhone(selectedCustomer.phone)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditCustomerModal(selectedCustomer)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Düzenle</span>
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 mid:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 block">Ad Soyad:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedCustomer.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">T.C. Kimlik No:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">{selectedCustomer.tcNo || '-'}</span>
                    {selectedCustomer.tcNo && (
                      <button
                        onClick={() => handleCopyTC(selectedCustomer.tcNo)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block">Telefon:</span>
                  <span className="font-bold text-slate-900">{formatPhone(selectedCustomer.phone)}</span>
                </div>
                {selectedCustomer.notes && (
                  <div className="mid:col-span-3 pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block font-semibold">Müşteri Notu:</span>
                    <p className="text-slate-700 italic">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border-2 border-cyan-300 shadow-xs">
                <div>
                  <h5 className="font-black text-cyan-950 text-sm">
                    Bu Müşteriye Yeni Bir Gözlük Ver
                  </h5>
                  <p className="text-xs text-cyan-800">
                    Önceki cam ve çerçeve bilgileri otomatik hazır gelir, tek tıkla yeni gözlük kaydı açabilirsiniz.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const cust = selectedCustomer;
                    setSelectedCustomer(null);
                    onNewOrderForCustomer(cust);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>
                    +{selectedDeliveredOrders.length + 1}. Gözlük Kaydını Aç
                  </span>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Teslim Edilen Tüm Gözlükler
                  </h4>
                  <span className="text-xs text-slate-400">Eskiden yeniye sıralı</span>
                </div>

                {selectedDeliveredOrders.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500">
                    Bu müşteriye henüz teslim edilmiş gözlük kaydı bulunmuyor.
                  </div>
                ) : (
                <div className="space-y-4">
                  {selectedDeliveredOrders.map((ord, idx) => {
                    const ordRx = ord.prescription;
                    const distR = ordRx.distanceRx?.rightEye || ordRx.rightEye;
                    const distL = ordRx.distanceRx?.leftEye || ordRx.leftEye;
                    const nearR = ordRx.nearRx?.rightEye;
                    const nearL = ordRx.nearRx?.leftEye;
                    const isBoth = (ordRx.usageTypes?.includes('uzak') && ordRx.usageTypes?.includes('yakin')) || ordRx.usageType === 'uzak_yakin';

                    return (
                      <div
                        key={ord.id}
                        className="p-4 rounded-xl border-2 border-slate-200 bg-white shadow-xs space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-xs px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-950 border border-cyan-300">
                              👓 {idx + 1}. GÖZLÜK
                            </span>
                            <span className="inline-flex items-center gap-1 font-black text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Teslim Edildi{ord.deliveryDate ? ` (${formatDate(ord.deliveryDate)})` : ''}
                            </span>
                            <span className="font-mono text-slate-500">{ord.orderNo}</span>
                            <span className="text-slate-500">• {formatDate(ord.orderDate)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Toplam Fiyat:</span>
                            <span className="font-black text-slate-950 text-sm">
                              {formatCurrency(ord.salePrice)}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 mid:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Verilen Çerçeve</span>
                            <span className="font-bold text-slate-900 text-sm">
                              {ord.frame.brand} {ord.frame.model}
                            </span>
                            {ord.frame.colorCode && (
                              <span className="text-slate-500 text-[11px] block">Renk: {ord.frame.colorCode}</span>
                            )}
                            {ord.framePrice ? (
                              <span className="text-[11px] font-semibold text-slate-700 block mt-1">
                                Çerçeve Fiyatı: {formatCurrency(ord.framePrice)}
                              </span>
                            ) : null}
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Verilen Cam</span>
                            <span className="font-bold text-slate-900 text-sm block">
                              {isBoth ? 'Uzak: ' : ''}
                              {ordRx.lensBrand || 'Zeiss'} {ordRx.lensModel || ordRx.lensType ? `- ${ordRx.lensModel || ordRx.lensType}` : ''}
                            </span>
                            {ordRx.nearLensBrand && (
                              <span className="font-bold text-amber-900 text-sm block mt-0.5">
                                Yakın: {ordRx.nearLensBrand} {ordRx.nearLensModel ? `- ${ordRx.nearLensModel}` : ''}
                              </span>
                            )}
                            {ord.lensPrice ? (
                              <span className="text-[11px] font-semibold text-slate-700 block mt-1">
                                Cam Fiyatı: {formatCurrency(ord.lensPrice)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {(distR?.sph || distR?.cyl || distR?.axis || distR?.pd || distL?.sph || distL?.cyl || distL?.axis || distL?.pd) && (
                          <div className="bg-white border border-slate-200 rounded-lg p-2 font-mono text-[11px] flex flex-col mid:flex-row mid:justify-between gap-1">
                            <span className="text-blue-700 font-bold">
                              {isBoth ? 'Uzak ' : ''}Sağ: SPH {distR?.sph || '0'} | CYL {distR?.cyl || '0'} | AKS {distR?.axis ? `${distR.axis}°` : '-'} | PD {distR?.pd ? `${distR.pd} mm` : '-'}
                            </span>
                            <span className="text-indigo-700 font-bold">
                              {isBoth ? 'Uzak ' : ''}Sol: SPH {distL?.sph || '0'} | CYL {distL?.cyl || '0'} | AKS {distL?.axis ? `${distL.axis}°` : '-'} | PD {distL?.pd ? `${distL.pd} mm` : '-'}
                            </span>
                          </div>
                        )}

                        {nearR && (nearR.sph || nearR.cyl || nearR.axis || nearR.pd || nearL?.sph || nearL?.cyl || nearL?.axis || nearL?.pd) && (
                          <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-2 font-mono text-[11px] flex flex-col mid:flex-row mid:justify-between gap-1">
                            <span className="text-amber-900 font-bold">
                              Yakın Sağ: SPH {nearR?.sph || '0'} | CYL {nearR?.cyl || '0'} | AKS {nearR?.axis ? `${nearR.axis}°` : '-'} | PD {nearR?.pd ? `${nearR.pd} mm` : '-'}
                            </span>
                            <span className="text-orange-900 font-bold">
                              Yakın Sol: SPH {nearL?.sph || '0'} | CYL {nearL?.cyl || '0'} | AKS {nearL?.axis ? `${nearL.axis}°` : '-'} | PD {nearL?.pd ? `${nearL.pd} mm` : '-'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-end text-xs pt-1">
                          <button
                            onClick={() => {
                              setSelectedCustomer(null);
                              onViewOrder(ord);
                            }}
                            className="text-cyan-700 font-bold hover:underline cursor-pointer"
                          >
                            Gözlüğü Detaylı İncele →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setPendingDeleteCustomer(selectedCustomer)}
                className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
              >
                Müşteriyi Sil
              </button>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Add / Edit Customer Form Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 mid:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                {editingCustomer ? 'Müşteri Bilgilerini Düzenle' : 'Yeni Müşteri Kaydı'}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Müşteri Ad Soyad <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="örn: Mehmet Kaya"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    T.C. Kimlik No (11 Hane)
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={tcNo}
                    onChange={(e) => setTcNo(e.target.value.replace(/\D/g, ''))}
                    placeholder="12345678901"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Telefon No
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0532 123 45 67"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Not
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Müşteri tercihleri, özel durumlar vb."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteCustomer)}
        title="Müşteriyi Sil"
        message={
          pendingDeleteCustomer
            ? `${pendingDeleteCustomer.fullName} adlı müşteriyi rehberden silmek istediğinizden emin misiniz?`
            : ''
        }
        onConfirm={async () => {
          if (pendingDeleteCustomer) {
            if (!await onDeleteCustomer(pendingDeleteCustomer.id)) return;
            if (selectedCustomer?.id === pendingDeleteCustomer.id) {
              setSelectedCustomer(null);
            }
            setPendingDeleteCustomer(null);
          }
        }}
        onCancel={() => setPendingDeleteCustomer(null)}
      />
    </div>
  );
};
