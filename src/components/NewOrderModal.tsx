import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Glasses, User, Eye, Tag, DollarSign, Check, History, Copy, AlertCircle
} from 'lucide-react';
import {
  SaleOrder, Customer, GlassesUsageType, UsageOption, EyeValues
} from '../types/optical';
import {
  formatDate, formatCurrency, formatPhoneInput,
  getCustomerOrderList, getOrderIndexForCustomer
} from '../utils/formatters';

interface NewOrderModalProps {
  initialOrder?: SaleOrder | null;
  customers: Customer[];
  orders: SaleOrder[];
  onSave: (order: SaleOrder) => void;
  onClose: () => void;
}

const emptyEye = (): EyeValues => ({ sph: '', cyl: '', axis: '', pd: '' });

function deriveInitialUsageTypes(order?: SaleOrder | null): UsageOption[] {
  const rx = order?.prescription;
  if (!rx) return ['uzak'];
  if (rx.usageTypes && rx.usageTypes.length > 0) return rx.usageTypes;
  if (rx.usageType === 'uzak_yakin') return ['uzak', 'yakin'];
  if (rx.usageType === 'yakin') return ['yakin'];
  if (rx.usageType === 'progresif') return ['progresif'];
  return ['uzak'];
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  initialOrder,
  customers,
  orders,
  onSave,
  onClose,
}) => {
  const isEditingExisting = Boolean(initialOrder?.id);

  // 1. Customer State
  const [tcNo, setTcNo] = useState(initialOrder?.customer.tcNo || '');
  const [fullName, setFullName] = useState(initialOrder?.customer.fullName || '');
  const [phone, setPhone] = useState(formatPhoneInput(initialOrder?.customer.phone || ''));

  // 2. Frame State (Verdiğim Çerçeve - Model adı el ile girilir, liste yok)
  const [frameBrand, setFrameBrand] = useState(initialOrder?.frame.brand || '');
  const [frameModel, setFrameModel] = useState(initialOrder?.frame.model || '');
  const [frameColor, setFrameColor] = useState(initialOrder?.frame.colorCode || '');

  // 3. Lens State
  const initialUsage = deriveInitialUsageTypes(initialOrder);
  const [usageTypes, setUsageTypes] = useState<UsageOption[]>(initialUsage);

  const initialOnlyYakin = initialUsage.length === 1 && initialUsage[0] === 'yakin';

  // Uzak (veya Progresif) Cam Marka & Model
  const [distanceLensBrand, setDistanceLensBrand] = useState<string>(
    initialOnlyYakin ? '' : (initialOrder?.prescription.lensBrand || '')
  );
  const [distanceLensModel, setDistanceLensModel] = useState<string>(
    initialOnlyYakin
      ? ''
      : (initialOrder?.prescription.lensModel || initialOrder?.prescription.lensType || '')
  );

  // Yakın Cam Marka & Model
  const [nearLensBrand, setNearLensBrand] = useState<string>(
    initialOnlyYakin
      ? (initialOrder?.prescription.lensBrand || '')
      : (initialOrder?.prescription.nearLensBrand || '')
  );
  const [nearLensModel, setNearLensModel] = useState<string>(
    initialOnlyYakin
      ? (initialOrder?.prescription.lensModel || initialOrder?.prescription.lensType || '')
      : (initialOrder?.prescription.nearLensModel || '')
  );

  // Uzak Gözlük Numaraları (SPH, CYL, AKS, PD)
  const initialDistRight = initialOrder?.prescription.distanceRx?.rightEye ||
    (!initialOnlyYakin ? initialOrder?.prescription.rightEye : undefined) ||
    emptyEye();
  const initialDistLeft = initialOrder?.prescription.distanceRx?.leftEye ||
    (!initialOnlyYakin ? initialOrder?.prescription.leftEye : undefined) ||
    emptyEye();

  const [distRSph, setDistRSph] = useState(initialDistRight.sph || '');
  const [distRCyl, setDistRCyl] = useState(initialDistRight.cyl || '');
  const [distRAxis, setDistRAxis] = useState(initialDistRight.axis || '');
  const [distRPd, setDistRPd] = useState(initialDistRight.pd || '');

  const [distLSph, setDistLSph] = useState(initialDistLeft.sph || '');
  const [distLCyl, setDistLCyl] = useState(initialDistLeft.cyl || '');
  const [distLAxis, setDistLAxis] = useState(initialDistLeft.axis || '');
  const [distLPd, setDistLPd] = useState(initialDistLeft.pd || '');

  // Yakın Gözlük Numaraları (SPH, CYL, AKS, PD)
  const initialNearRight = initialOrder?.prescription.nearRx?.rightEye ||
    (initialOnlyYakin ? initialOrder?.prescription.rightEye : undefined) ||
    emptyEye();
  const initialNearLeft = initialOrder?.prescription.nearRx?.leftEye ||
    (initialOnlyYakin ? initialOrder?.prescription.leftEye : undefined) ||
    emptyEye();

  const [nearRSph, setNearRSph] = useState(initialNearRight.sph || '');
  const [nearRCyl, setNearRCyl] = useState(initialNearRight.cyl || '');
  const [nearRAxis, setNearRAxis] = useState(initialNearRight.axis || '');
  const [nearRPd, setNearRPd] = useState(initialNearRight.pd || '');

  const [nearLSph, setNearLSph] = useState(initialNearLeft.sph || '');
  const [nearLCyl, setNearLCyl] = useState(initialNearLeft.cyl || '');
  const [nearLAxis, setNearLAxis] = useState(initialNearLeft.axis || '');
  const [nearLPd, setNearLPd] = useState(initialNearLeft.pd || '');

  // 4. Pricing (Çerçeve Fiyatı + Cam Fiyatı = Toplam Fiyat)
  const [framePriceInput, setFramePriceInput] = useState<string>(
    initialOrder?.framePrice !== undefined && initialOrder.framePrice > 0
      ? initialOrder.framePrice.toString()
      : ''
  );
  const [lensPriceInput, setLensPriceInput] = useState<string>(
    initialOrder?.lensPrice !== undefined && initialOrder.lensPrice > 0
      ? initialOrder.lensPrice.toString()
      : ''
  );
  const [orderDate, setOrderDate] = useState(
    initialOrder?.orderDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialOrder?.notes || '');

  const [copiedAlert, setCopiedAlert] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const hasUzak = usageTypes.includes('uzak');
  const hasYakin = usageTypes.includes('yakin');
  const isProgresif = usageTypes.includes('progresif');

  const toggleUsage = (option: UsageOption) => {
    if (option === 'progresif') {
      setUsageTypes(['progresif']);
      return;
    }

    setUsageTypes((prev) => {
      // Progresif aktifse doğrudan tıklanan Uzak veya Yakın'a geç
      const withoutProg = prev.filter((u) => u !== 'progresif');
      if (withoutProg.includes(option)) {
        const next = withoutProg.filter((u) => u !== option);
        // En az bir seçenek aktif kalmalı
        return next.length > 0 ? next : withoutProg;
      }
      return [...withoutProg, option];
    });
  };

  // Auto-calculated total price
  const displayTotal = useMemo(() => {
    const fp = parseFloat(framePriceInput) || 0;
    const lp = parseFloat(lensPriceInput) || 0;
    return fp + lp;
  }, [framePriceInput, lensPriceInput]);

  // STRICT TC LOOKUP
  const cleanTc = tcNo.replace(/\D/g, '');

  const previousOrders = useMemo(() => {
    const all = getCustomerOrderList(orders, {
      id: initialOrder?.customer.id,
      tcNo: cleanTc,
    });

    if (initialOrder?.id) {
      return all.filter((o) => o.id !== initialOrder.id);
    }
    return all;
  }, [orders, cleanTc, initialOrder]);

  const latestPreviousOrder = previousOrders.length > 0 ? previousOrders[previousOrders.length - 1] : null;

  const glassesSequenceNumber = initialOrder?.id
    ? getOrderIndexForCustomer(orders, initialOrder).index
    : previousOrders.length + 1;

  // When 11 digit TC is entered, auto-fill customer name and phone
  useEffect(() => {
    if (cleanTc.length === 11 && !initialOrder) {
      const match = customers.find((c) => c.tcNo?.replace(/\D/g, '') === cleanTc);
      if (match) {
        if (!fullName) setFullName(match.fullName);
        if (!phone && match.phone) setPhone(formatPhoneInput(match.phone));
      } else if (latestPreviousOrder) {
        if (!fullName) setFullName(latestPreviousOrder.customer.fullName);
        if (!phone && latestPreviousOrder.customer.phone) setPhone(formatPhoneInput(latestPreviousOrder.customer.phone));
      }
    }
  }, [cleanTc, customers, latestPreviousOrder, fullName, phone, initialOrder]);

  const handleCopyFromPrevious = () => {
    if (!latestPreviousOrder) return;
    const prevRx = latestPreviousOrder.prescription;
    const prevUsage = deriveInitialUsageTypes(latestPreviousOrder);
    const prevOnlyYakin = prevUsage.length === 1 && prevUsage[0] === 'yakin';

    setUsageTypes(prevUsage);

    if (prevOnlyYakin) {
      if (prevRx.lensBrand) setNearLensBrand(prevRx.lensBrand);
      setNearLensModel(prevRx.lensModel || prevRx.lensType || '');

      const nR = prevRx.nearRx?.rightEye || prevRx.rightEye;
      const nL = prevRx.nearRx?.leftEye || prevRx.leftEye;
      setNearRSph(nR?.sph || '');
      setNearRCyl(nR?.cyl || '');
      setNearRAxis(nR?.axis || '');
      setNearRPd(nR?.pd || '');
      setNearLSph(nL?.sph || '');
      setNearLCyl(nL?.cyl || '');
      setNearLAxis(nL?.axis || '');
      setNearLPd(nL?.pd || '');
    } else {
      if (prevRx.lensBrand) setDistanceLensBrand(prevRx.lensBrand);
      setDistanceLensModel(prevRx.lensModel || prevRx.lensType || '');

      const dR = prevRx.distanceRx?.rightEye || prevRx.rightEye;
      const dL = prevRx.distanceRx?.leftEye || prevRx.leftEye;
      setDistRSph(dR?.sph || '');
      setDistRCyl(dR?.cyl || '');
      setDistRAxis(dR?.axis || '');
      setDistRPd(dR?.pd || '');
      setDistLSph(dL?.sph || '');
      setDistLCyl(dL?.cyl || '');
      setDistLAxis(dL?.axis || '');
      setDistLPd(dL?.pd || '');

      if (prevRx.nearLensBrand) setNearLensBrand(prevRx.nearLensBrand);
      if (prevRx.nearLensModel) setNearLensModel(prevRx.nearLensModel);
      if (prevRx.nearRx) {
        setNearRSph(prevRx.nearRx.rightEye?.sph || '');
        setNearRCyl(prevRx.nearRx.rightEye?.cyl || '');
        setNearRAxis(prevRx.nearRx.rightEye?.axis || '');
        setNearRPd(prevRx.nearRx.rightEye?.pd || '');
        setNearLSph(prevRx.nearRx.leftEye?.sph || '');
        setNearLCyl(prevRx.nearRx.leftEye?.cyl || '');
        setNearLAxis(prevRx.nearRx.leftEye?.axis || '');
        setNearLPd(prevRx.nearRx.leftEye?.pd || '');
      }
    }

    setCopiedAlert('Önceki gözlük numaraları aktarıldı!');
    setTimeout(() => setCopiedAlert(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Lütfen müşteri ad ve soyadını giriniz.');
      return;
    }

    const fp = parseFloat(framePriceInput) || 0;
    const lp = parseFloat(lensPriceInput) || 0;
    const finalSalePrice = fp + lp;

    if (finalSalePrice <= 0) {
      setFormError('Lütfen gözlük veya cam fiyatını giriniz.');
      return;
    }

    const distPair = {
      rightEye: {
        sph: distRSph.trim(),
        cyl: distRCyl.trim(),
        axis: distRAxis.trim(),
        pd: distRPd.trim(),
      },
      leftEye: {
        sph: distLSph.trim(),
        cyl: distLCyl.trim(),
        axis: distLAxis.trim(),
        pd: distLPd.trim(),
      },
    };

    const nearPair = {
      rightEye: {
        sph: nearRSph.trim(),
        cyl: nearRCyl.trim(),
        axis: nearRAxis.trim(),
        pd: nearRPd.trim(),
      },
      leftEye: {
        sph: nearLSph.trim(),
        cyl: nearLCyl.trim(),
        axis: nearLAxis.trim(),
        pd: nearLPd.trim(),
      },
    };

    let resolvedUsageType: GlassesUsageType = 'uzak';
    if (isProgresif) resolvedUsageType = 'progresif';
    else if (hasUzak && hasYakin) resolvedUsageType = 'uzak_yakin';
    else if (hasYakin) resolvedUsageType = 'yakin';
    else resolvedUsageType = 'uzak';

    const onlyYakin = !isProgresif && hasYakin && !hasUzak;
    const primaryBrand = onlyYakin ? nearLensBrand.trim() : distanceLensBrand.trim();
    const primaryModel = onlyYakin ? nearLensModel.trim() : distanceLensModel.trim();
    const primaryRx = onlyYakin ? nearPair : distPair;

    if (!primaryBrand || (!isProgresif && hasUzak && hasYakin && !nearLensBrand.trim())) {
      setFormError('Lütfen cam markasını giriniz.');
      return;
    }

    const orderId = initialOrder?.id || `ord-${Date.now()}`;
    const orderNumber = initialOrder?.orderNo || `YO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: SaleOrder = {
      id: orderId,
      orderNo: orderNumber,
      customer: {
        id: initialOrder?.customer.id || `cust-${Date.now()}`,
        fullName: fullName.trim(),
        tcNo: cleanTc,
        phone: phone.replace(/\D/g, '').length > 1 ? phone.trim() : '',
        createdAt: initialOrder?.customer.createdAt || new Date().toISOString(),
      },
      prescription: {
        usageType: resolvedUsageType,
        usageTypes,
        rightEye: primaryRx.rightEye,
        leftEye: primaryRx.leftEye,
        distanceRx: (hasUzak || isProgresif) ? distPair : undefined,
        nearRx: (hasYakin || isProgresif) ? nearPair : undefined,
        lensType: primaryModel || 'Standart',
        lensFeatures: [],
        lensBrand: primaryBrand,
        lensModel: primaryModel,
        nearLensBrand: (hasUzak && hasYakin) ? nearLensBrand.trim() : undefined,
        nearLensModel: (hasUzak && hasYakin) ? nearLensModel.trim() : undefined,
        lensIndex: '',
      },
      frame: {
        brand: frameBrand.trim() || 'Genel Çerçeve',
        model: frameModel.trim(),
        colorCode: frameColor.trim(),
        size: initialOrder?.frame.size || '',
        type: 'numarali',
      },
      framePrice: fp,
      lensPrice: lp,
      costPrice: 0,
      listPrice: finalSalePrice,
      salePrice: finalSalePrice,
      paidAmount: finalSalePrice,
      remainingAmount: 0,
      status: initialOrder?.status || 'hazirlaniyor',
      orderDate,
      warrantyMonths: 24,
      notes: notes.trim(),
      createdAt: isEditingExisting ? (initialOrder?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    onSave(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 mid:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Glasses className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isEditingExisting ? 'Gözlük & Cam Kaydını Düzenle' : 'Yeni Gözlük & Cam Ver'}
                </h3>
                {previousOrders.length > 0 && (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 uppercase">
                    {glassesSequenceNumber}. Gözlük
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Müşteri TC'si, çerçeve ve cam fiyatı, uzak / yakın cam marka model ve numaraları
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Previous Glasses Detected via TC */}
          {cleanTc.length >= 2 && previousOrders.length > 0 && latestPreviousOrder && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      T.C. Kimlik İle Müşteri Geçmişi Bulundu ({previousOrders.length} Önceki Gözlük)
                    </h5>
                    <p className="text-xs text-amber-900 font-medium">
                      Bu müşteriye şu anda <strong>{glassesSequenceNumber}. GÖZLÜK</strong> kaydı giriliyor.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyFromPrevious}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Önceki Numaraları Doldur</span>
                </button>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 border-b border-amber-100 pb-1">
                  <span>Önceki: {latestPreviousOrder.frame.brand} {latestPreviousOrder.frame.model}</span>
                  <span>{formatDate(latestPreviousOrder.orderDate)} • {formatCurrency(latestPreviousOrder.salePrice)}</span>
                </div>
                <div className="font-mono text-[11px] flex justify-between bg-slate-50 p-1.5 rounded">
                  <span className="text-blue-700 font-bold">
                    Sağ: {latestPreviousOrder.prescription.rightEye?.sph || '0'} (Cyl: {latestPreviousOrder.prescription.rightEye?.cyl || '0'} Aks: {latestPreviousOrder.prescription.rightEye?.axis || '0'}°)
                  </span>
                  <span className="text-indigo-700 font-bold">
                    Sol: {latestPreviousOrder.prescription.leftEye?.sph || '0'} (Cyl: {latestPreviousOrder.prescription.leftEye?.cyl || '0'} Aks: {latestPreviousOrder.prescription.leftEye?.axis || '0'}°)
                  </span>
                </div>
              </div>

              {copiedAlert && (
                <div className="flex items-center gap-2 p-2 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-300">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>{copiedAlert}</span>
                </div>
              )}
            </div>
          )}

          {/* 1. MÜŞTERİ BİLGİLERİ */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-cyan-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Müşteri Bilgileri (T.C. İle Tanıma)
              </h4>
            </div>

            <div className="grid grid-cols-1 mid:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-black text-slate-900 block mb-1">
                  T.C. Kimlik No <span className="text-cyan-700 font-normal text-[11px]"></span>
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={tcNo}
                  onChange={(e) => setTcNo(e.target.value.replace(/\D/g, ''))}
                  placeholder="12345678901"
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-950 font-mono font-bold focus:bg-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Müşteri Ad Soyad <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="örn: Ahmet Yılmaz"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold focus:bg-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Telefon Numarası
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  value={phone}
                  onFocus={() => {
                    if (!phone) setPhone('0');
                  }}
                  onBlur={() => {
                    if (phone.replace(/\D/g, '').length <= 1) {
                      setPhone('');
                    }
                  }}
                  onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                  placeholder="0XXX XXX XX XX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono focus:bg-white focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. VERDİĞİM GÖZLÜK (ÇERÇEVE) - Model adı tamamen el ile girilir, liste yok */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Tag className="w-4 h-4 text-cyan-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Verdiğim Gözlük (Çerçeve)
              </h4>
            </div>

            <div className="grid grid-cols-1 mid:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Gözlük Markası <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={frameBrand}
                  onChange={(e) => setFrameBrand(e.target.value)}
                  placeholder="Marka adı"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-bold focus:bg-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Model Adı / Kodu
                </label>
                <input
                  type="text"
                  value={frameModel}
                  onChange={(e) => setFrameModel(e.target.value)}
                  placeholder="Model adı"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Renk / Kaplama
                </label>
                <input
                  type="text"
                  value={frameColor}
                  onChange={(e) => setFrameColor(e.target.value)}
                  placeholder="Siyah, Altın, vb."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. VERDİĞİM CAM: UZAK / YAKIN AYNI ANDA SEÇİLEBİLİR, CAM MARKA/MODEL & NUMARALAR AYRI AYRI */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Verdiğim Cam (Marka, Model & Numaralar)
                </h4>
              </div>

              {/* UZAK / YAKIN (AYNI ANDA SEÇİLEBİLİR) / PROGRESİF */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <span className="text-[11px] font-bold text-slate-600 px-2">Kullanım:</span>
                <button
                  type="button"
                  onClick={() => toggleUsage('uzak')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    hasUzak
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white/60 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${hasUzak ? 'bg-white text-blue-600 border-white' : 'border-slate-400'}`}>
                    {hasUzak && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                  </span>
                  <span>Uzak</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleUsage('yakin')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    hasYakin
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white/60 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${hasYakin ? 'bg-white text-amber-600 border-white' : 'border-slate-400'}`}>
                    {hasYakin && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                  </span>
                  <span>Yakın (Okuma)</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleUsage('progresif')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    isProgresif
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'bg-white/60 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>Progresif</span>
                </button>
              </div>
            </div>

            {hasUzak && hasYakin && (
              <div className="px-3 py-2 rounded-xl bg-cyan-50 border border-cyan-200 text-[11px] font-semibold text-cyan-950">
                Uzak ve Yakın aynı anda seçildi. Aşağıda her iki cam için marka/model ve numaraları ayrı ayrı girebilirsiniz.
              </div>
            )}

            {/* PROGRESİF MODU: Tek Cam Marka & Model + Uzak ve Yakın Numaraları Ayrı Ayrı */}
            {isProgresif && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-cyan-50/40 border border-cyan-200 space-y-3">
                  <span className="text-xs font-black text-cyan-950 uppercase tracking-wider block">
                    Progresif Cam Markası & Modeli
                  </span>
                  <div className="grid grid-cols-1 mid:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-900 block mb-1">
                        Cam Markası <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={distanceLensBrand}
                        onChange={(e) => setDistanceLensBrand(e.target.value)}
                        placeholder="Cam markası adı"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-950 focus:border-cyan-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-900 block mb-1">
                        Cam Modeli
                      </label>
                      <input
                        type="text"
                        value={distanceLensModel}
                        onChange={(e) => setDistanceLensModel(e.target.value)}
                        placeholder="Model adı"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-950 focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <PrescriptionNumberTable
                  title="UZAK GÖZLÜK NUMARALARI"
                  accent="blue"
                  rSph={distRSph} setRSph={setDistRSph}
                  rCyl={distRCyl} setRCyl={setDistRCyl}
                  rAxis={distRAxis} setRAxis={setDistRAxis}
                  rPd={distRPd} setRPd={setDistRPd}
                  lSph={distLSph} setLSph={setDistLSph}
                  lCyl={distLCyl} setLCyl={setDistLCyl}
                  lAxis={distLAxis} setLAxis={setDistLAxis}
                  lPd={distLPd} setLPd={setDistLPd}
                />

                <PrescriptionNumberTable
                  title="YAKIN GÖZLÜK NUMARALARI"
                  accent="amber"
                  rSph={nearRSph} setRSph={setNearRSph}
                  rCyl={nearRCyl} setRCyl={setNearRCyl}
                  rAxis={nearRAxis} setRAxis={setNearRAxis}
                  rPd={nearRPd} setRPd={setNearRPd}
                  lSph={nearLSph} setLSph={setNearLSph}
                  lCyl={nearLCyl} setLCyl={setNearLCyl}
                  lAxis={nearLAxis} setLAxis={setNearLAxis}
                  lPd={nearLPd} setLPd={setNearLPd}
                />
              </div>
            )}

            {/* UZAK BÖLÜMÜ (Uzak tek veya Uzak+Yakın birlikte) */}
            {!isProgresif && hasUzak && (
              <div className="p-3.5 rounded-xl bg-blue-50/40 border-2 border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900 uppercase tracking-wider">
                    Uzak Camı & Numaraları
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">
                    UZAK
                  </span>
                </div>

                <div className="grid grid-cols-1 mid:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">
                      Uzak Cam Markası <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={distanceLensBrand}
                      onChange={(e) => setDistanceLensBrand(e.target.value)}
                      placeholder="Cam markası adı"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-950 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">
                      Uzak Cam Modeli
                    </label>
                    <input
                      type="text"
                      value={distanceLensModel}
                      onChange={(e) => setDistanceLensModel(e.target.value)}
                      placeholder="Model adı"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-950 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <PrescriptionNumberTable
                  title="UZAK GÖZLÜK NUMARALARI"
                  accent="blue"
                  rSph={distRSph} setRSph={setDistRSph}
                  rCyl={distRCyl} setRCyl={setDistRCyl}
                  rAxis={distRAxis} setRAxis={setDistRAxis}
                  rPd={distRPd} setRPd={setDistRPd}
                  lSph={distLSph} setLSph={setDistLSph}
                  lCyl={distLCyl} setLCyl={setDistLCyl}
                  lAxis={distLAxis} setLAxis={setDistLAxis}
                  lPd={distLPd} setLPd={setDistLPd}
                />
              </div>
            )}

            {/* YAKIN BÖLÜMÜ (Yakın tek veya Uzak+Yakın birlikte) */}
            {!isProgresif && hasYakin && (
              <div className="p-3.5 rounded-xl bg-amber-50/40 border-2 border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Yakın (Okuma) Camı & Numaraları
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white">
                    YAKIN
                  </span>
                </div>

                <div className="grid grid-cols-1 mid:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">
                      Yakın Cam Markası <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nearLensBrand}
                      onChange={(e) => setNearLensBrand(e.target.value)}
                      placeholder="Cam markası adı"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-950 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">
                      Yakın Cam Modeli
                    </label>
                    <input
                      type="text"
                      value={nearLensModel}
                      onChange={(e) => setNearLensModel(e.target.value)}
                      placeholder="Model adı"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-950 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <PrescriptionNumberTable
                  title="YAKIN GÖZLÜK NUMARALARI"
                  accent="amber"
                  rSph={nearRSph} setRSph={setNearRSph}
                  rCyl={nearRCyl} setRCyl={setNearRCyl}
                  rAxis={nearRAxis} setRAxis={setNearRAxis}
                  rPd={nearRPd} setRPd={setNearRPd}
                  lSph={nearLSph} setLSph={setNearLSph}
                  lCyl={nearLCyl} setLCyl={setNearLCyl}
                  lAxis={nearLAxis} setLAxis={setNearLAxis}
                  lPd={nearLPd} setLPd={setNearLPd}
                />
              </div>
            )}
          </div>

          {/* 4. FİYAT BÖLÜMÜ (Durum takibi kaldırıldı) */}
          <div className="border-2 border-cyan-500/40 rounded-xl p-4 bg-cyan-50/20 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-cyan-200 pb-2">
              <DollarSign className="w-5 h-5 text-cyan-800" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                4. Fiyat Bilgileri (Çerçeve + Cam = Toplam Fiyat)
              </h4>
            </div>

            <div className="grid grid-cols-1 mid:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Gözlük (Çerçeve) Fiyatı (₺)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={framePriceInput}
                  onChange={(e) => setFramePriceInput(e.target.value)}
                  placeholder="örn: 2000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-lg font-black text-slate-900 focus:bg-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cam Fiyatı (₺)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={lensPriceInput}
                  onChange={(e) => setLensPriceInput(e.target.value)}
                  placeholder="örn: 3000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-lg font-black text-slate-900 focus:bg-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-3 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] uppercase font-black text-cyan-100 block">
                    TOPLAM SATIŞ FİYATI
                  </span>
                  <div className="text-2xl font-black tracking-tight mt-0.5">
                    {formatCurrency(displayTotal)}
                  </div>
                </div>
                <div className="text-[10px] text-cyan-100 font-medium">
                  {parseFloat(framePriceInput) || 0} ₺ Çerçeve + {parseFloat(lensPriceInput) || 0} ₺ Cam
                </div>
              </div>
            </div>

            {/* Tarih ve Not */}
            <div className="grid grid-cols-1 mid:grid-cols-3 gap-3 pt-2 border-t border-cyan-100">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Kayıt Tarihi
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="mid:col-span-2">
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Özel Not (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Müşteri özel istekleri vb."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold cursor-pointer"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isEditingExisting ? 'Kaydı Güncelle' : `${glassesSequenceNumber}. Gözlüğü Kaydet`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PrescriptionNumberTableProps {
  title: string;
  accent: 'blue' | 'amber';
  rSph: string; setRSph: (v: string) => void;
  rCyl: string; setRCyl: (v: string) => void;
  rAxis: string; setRAxis: (v: string) => void;
  rPd: string; setRPd: (v: string) => void;
  lSph: string; setLSph: (v: string) => void;
  lCyl: string; setLCyl: (v: string) => void;
  lAxis: string; setLAxis: (v: string) => void;
  lPd: string; setLPd: (v: string) => void;
}

const PrescriptionNumberTable: React.FC<PrescriptionNumberTableProps> = ({
  title,
  accent,
  rSph, setRSph,
  rCyl, setRCyl,
  rAxis, setRAxis,
  rPd, setRPd,
  lSph, setLSph,
  lCyl, setLCyl,
  lAxis, setLAxis,
  lPd, setLPd,
}) => {
  const isAmber = accent === 'amber';
  const headerClass = isAmber ? 'text-amber-950' : 'text-blue-950';
  const wrapperBorderClass = isAmber ? 'border-amber-200' : 'border-slate-200';
  const theadRowClass = isAmber
    ? 'bg-amber-50/90 text-amber-950 font-black border-b border-amber-200'
    : 'bg-slate-100 text-slate-800 font-black border-b border-slate-200';
  const tbodyDividerClass = isAmber ? 'divide-y divide-amber-100' : 'divide-y divide-slate-200';
  const rightEyeCellClass = isAmber
    ? 'py-2 px-3 text-left font-black text-amber-900 bg-amber-50/70'
    : 'py-2 px-3 text-left font-black text-blue-700 bg-blue-50/50';
  const leftEyeCellClass = isAmber
    ? 'py-2 px-3 text-left font-black text-orange-900 bg-orange-50/60'
    : 'py-2 px-3 text-left font-black text-indigo-700 bg-indigo-50/50';
  const inputBaseClass = isAmber
    ? 'w-full text-center font-mono bg-amber-50/30 border border-amber-200/80 rounded py-1.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none'
    : 'w-full text-center font-mono bg-slate-50 border border-slate-200 rounded py-1.5 text-slate-900 focus:bg-white focus:border-cyan-500 outline-none';
  const sphInputClass = isAmber
    ? 'w-full text-center font-mono font-bold bg-amber-50/30 border border-amber-200/80 rounded py-1.5 text-slate-900 focus:bg-white focus:border-amber-500 outline-none'
    : 'w-full text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded py-1.5 text-slate-900 focus:bg-white focus:border-cyan-500 outline-none';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-black uppercase tracking-wider ${headerClass}`}>
          {title}
        </span>
        <span className={`text-[11px] ${isAmber ? 'text-amber-800/80' : 'text-slate-500'}`}>
          SPH (Küre) • CYL (Silindir) • AKS (Açı 0°-180°)
        </span>
      </div>

      <div className={`overflow-x-auto border-2 ${wrapperBorderClass} rounded-xl bg-white shadow-2xs`}>
        <table className="w-full text-center text-xs">
          <thead>
            <tr className={theadRowClass}>
              <th className="py-2 px-3 text-left w-24">GÖZ</th>
              <th className="py-2 px-2">SPH (Küre)</th>
              <th className="py-2 px-2">CYL (Silindir)</th>
              <th className="py-2 px-2">AKS (Açı)</th>
              <th className="py-2 px-2">PD (Pupilla mm)</th>
            </tr>
          </thead>
          <tbody className={tbodyDividerClass}>
            <tr>
              <td className={rightEyeCellClass}>
                SAĞ (OD)
              </td>
              <td className="p-1">
                <input
                  type="text"
                  value={rSph}
                  onChange={(e) => setRSph(e.target.value)}
                  placeholder="+1.50 / -2.00"
                  className={sphInputClass}
                />
              </td>
              <td className="p-1">
                <input
                  type="text"
                  value={rCyl}
                  onChange={(e) => setRCyl(e.target.value)}
                  placeholder="-0.75"
                  className={inputBaseClass}
                />
              </td>
              <td className="p-1">
                <input
                  type="text"
                  value={rAxis}
                  onChange={(e) => setRAxis(e.target.value)}
                  placeholder="90"
                  className={inputBaseClass}
                />
              </td>
              <td className="p-1">
                <input
                  type="text"
                  value={rPd}
                  onChange={(e) => setRPd(e.target.value)}
                  placeholder="31.5"
                  className={inputBaseClass}
                />
              </td>
            </tr>

            <tr>
              <td className={leftEyeCellClass}>
                SOL (OS)
              </td>
              <td className="p-1">
                <input
                  type="text"
                  value={lSph}
                  onChange={(e) => setLSph(e.target.value)}
                  placeholder="+1.25 / -2.50"
                  className={sphInputClass}
                />
              </td>
              <td className="p-1">
                <input
                  type="text"
                  value={lCyl}
                  onChange={(e) => setLCyl(e.target.value)}
                  placeholder="-0.50"
                  className={inputBaseClass}
                />
              </td>
              <td className="p-1">
                <input
                  type="text"
                  value={lAxis}
                  onChange={(e) => setLAxis(e.target.value)}
                  placeholder="85"
                  className={inputBaseClass}
                />
              </td>
              <td className="p-1">
                <input
                  type="text"
                  value={lPd}
                  onChange={(e) => setLPd(e.target.value)}
                  placeholder="31.0"
                  className={inputBaseClass}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
