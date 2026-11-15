import React from 'react';
import { Printer, X, MessageSquare, Glasses, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { SaleOrder, StoreSettings, EyeValues } from '../types/optical';
import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';

interface ReceiptPrintModalProps {
  order: SaleOrder;
  settings: StoreSettings;
  onClose: () => void;
}

const PrintDiopterTable: React.FC<{ label: string; rightEye?: EyeValues; leftEye?: EyeValues }> = ({
  label,
  rightEye,
  leftEye,
}) => (
  <div className="mb-3">
    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
      <span>Gözlük Diyoptri / Reçete Değerleri ({label})</span>
      <span className="text-[10px] font-normal text-slate-500">OD: Sağ Göz | OS: Sol Göz</span>
    </h4>
    <div className="overflow-hidden border border-slate-300 rounded-lg">
      <table className="w-full text-center text-xs">
        <thead>
          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
            <th className="py-2 px-2 text-left">Göz</th>
            <th className="py-2 px-2">SPH (Küre)</th>
            <th className="py-2 px-2">CYL (Silindir)</th>
            <th className="py-2 px-2">AKS (Açı)</th>
            <th className="py-2 px-2">PD (Pupilla)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          <tr className="bg-white">
            <td className="py-2 px-2 text-left font-bold text-slate-900">SAĞ (OD)</td>
            <td className="py-2 px-2 font-mono font-bold text-slate-800">{rightEye?.sph || '0.00'}</td>
            <td className="py-2 px-2 font-mono text-slate-800">{rightEye?.cyl || '0.00'}</td>
            <td className="py-2 px-2 font-mono text-slate-800">{rightEye?.axis ? `${rightEye.axis}°` : '-'}</td>
            <td className="py-2 px-2 font-mono text-slate-800">{rightEye?.pd ? `${rightEye.pd} mm` : '-'}</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="py-2 px-2 text-left font-bold text-slate-900">SOL (OS)</td>
            <td className="py-2 px-2 font-mono font-bold text-slate-800">{leftEye?.sph || '0.00'}</td>
            <td className="py-2 px-2 font-mono text-slate-800">{leftEye?.cyl || '0.00'}</td>
            <td className="py-2 px-2 font-mono text-slate-800">{leftEye?.axis ? `${leftEye.axis}°` : '-'}</td>
            <td className="py-2 px-2 font-mono text-slate-800">{leftEye?.pd ? `${leftEye.pd} mm` : '-'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({ order, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const cleanPhone = order.customer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0')
      ? '9' + cleanPhone
      : cleanPhone.startsWith('90')
        ? cleanPhone
        : '90' + cleanPhone;

    const message = encodeURIComponent(
      `Sayın ${order.customer.fullName},\n\n${settings.storeName}'ten yaptırmış olduğunuz ${order.frame.brand} ${order.frame.model || ''} gözlüğünüzle ilgili bilgilendirmedir.\n\nSipariş No: ${order.orderNo}\nToplam Tutar: ${formatCurrency(order.salePrice)}\n\nİyi günlerde kullanmanız dileğiyle,\n${settings.storeName}\n${settings.phone}`
    );

    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

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

  const usageLabel = isBothUzakYakin
    ? 'Uzak + Yakın'
    : isProgresif
      ? 'Progresif'
      : isOnlyYakin
        ? 'Yakın'
        : 'Uzak';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 mid:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Top Action Bar */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-base">Optik Teslim & Garanti Fişi Önizleme</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
              title="Müşteriye WhatsApp Bilgi Mesajı Gönder"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Mesajı</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-6 mid:p-8 text-slate-900 bg-white">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center">
                  <Glasses className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950 font-mono">
                    {settings.storeName.toUpperCase()}
                  </h2>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
                    Optisyenlik Müessesesi
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                <p className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 inline" />
                  {settings.address}, {settings.city}
                </p>
                <p className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400 inline" />
                  Tel: {settings.phone}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-900 font-mono text-xs font-bold rounded border border-slate-300">
                FİŞ NO: {order.orderNo}
              </span>
              <p className="text-xs text-slate-600 mt-2">
                <strong>İşlem Tarihi:</strong> {formatDate(order.orderDate)}
              </p>
              <p className="text-xs text-slate-600">
                <strong>Kullanım Türü:</strong> {usageLabel}
              </p>
            </div>
          </div>

          {/* Customer & Glasses Info Cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Müşteri Bilgileri
              </h4>
              <p className="text-sm font-bold text-slate-900">{order.customer.fullName}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                <span className="font-medium">T.C. No:</span> {order.customer.tcNo || 'Belirtilmedi'}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium">Telefon:</span> {formatPhone(order.customer.phone)}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Gözlük & Cam Özeti
              </h4>
              <p className="text-xs text-slate-800">
                <span className="font-medium">Çerçeve:</span> {order.frame.brand} {order.frame.model}
              </p>
              {isBothUzakYakin ? (
                <>
                  <p className="text-xs text-slate-800 mt-0.5">
                    <span className="font-medium">Uzak Cam:</span> {rx.lensBrand || 'Zeiss'} {rx.lensModel ? `- ${rx.lensModel}` : ''}
                  </p>
                  <p className="text-xs text-slate-800 mt-0.5">
                    <span className="font-medium">Yakın Cam:</span> {rx.nearLensBrand || rx.lensBrand || 'Zeiss'} {rx.nearLensModel ? `- ${rx.nearLensModel}` : ''}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-800 mt-0.5">
                  <span className="font-medium">Cam:</span> {rx.lensBrand || 'Zeiss'} {rx.lensModel || rx.lensType ? `- ${rx.lensModel || rx.lensType}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Prescription Diopter Tables */}
          {isBothUzakYakin ? (
            <>
              <PrintDiopterTable label="UZAK" rightEye={distRight} leftEye={distLeft} />
              <PrintDiopterTable label="YAKIN" rightEye={nearRight} leftEye={nearLeft} />
            </>
          ) : isProgresif ? (
            <>
              <PrintDiopterTable label="UZAK" rightEye={distRight} leftEye={distLeft} />
              {(nearRight || nearLeft) && (
                <PrintDiopterTable label="YAKIN" rightEye={nearRight} leftEye={nearLeft} />
              )}
            </>
          ) : isOnlyYakin ? (
            <PrintDiopterTable label="YAKIN" rightEye={nearRight} leftEye={nearLeft} />
          ) : (
            <PrintDiopterTable label="UZAK" rightEye={distRight} leftEye={distLeft} />
          )}

          {/* Frame & Lens Details */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
              <span className="font-bold text-slate-800 block mb-1">ÇERÇEVE ÖZELLİKLERİ</span>
              <p className="text-slate-700">
                <span className="font-semibold">Marka / Model:</span> {order.frame.brand} {order.frame.model}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold">Renk:</span> {order.frame.colorCode || '-'}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold">Ekartman:</span> {order.frame.size || '-'}
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
              <span className="font-bold text-slate-800 block mb-1">CAM BİLGİLERİ</span>
              {isBothUzakYakin ? (
                <>
                  <p className="text-slate-700">
                    <span className="font-semibold">Uzak:</span> {rx.lensBrand || 'Zeiss'} {rx.lensModel ? `(${rx.lensModel})` : ''}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">Yakın:</span> {rx.nearLensBrand || rx.lensBrand || 'Zeiss'} {rx.nearLensModel ? `(${rx.nearLensModel})` : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-slate-700">
                    <span className="font-semibold">Marka:</span> {rx.lensBrand || 'Zeiss'}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-semibold">Model:</span> {rx.lensModel || rx.lensType || '-'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Pricing Box */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 mb-4">
            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Çerçeve Fiyatı</span>
                <span className="text-base font-black text-slate-800">{formatCurrency(order.framePrice || 0)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Cam Fiyatı</span>
                <span className="text-base font-black text-slate-800">{formatCurrency(order.lensPrice || 0)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">TOPLAM SATIŞ TUTARI</span>
                <span className="text-lg font-black text-slate-950">{formatCurrency(order.salePrice)}</span>
              </div>
            </div>
          </div>

          {/* Guarantee & Notes */}
          <div className="text-[11px] text-slate-600 border-t border-slate-200 pt-3 mb-6">
            <p className="flex items-center gap-1 font-semibold text-slate-800 mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> {order.warrantyMonths} Ay İmalat ve Montaj Garantisi
            </p>
            <p>{settings.receiptNote}</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-10 pt-4 border-t border-slate-300 text-center text-xs">
            <div>
              <p className="font-bold text-slate-800">YAZIR OPTİK</p>
              <p className="text-[11px] text-slate-500">Yetkili Optisyen Kaşe / İmza</p>
              <div className="h-12 border-b border-dashed border-slate-300 mt-2" />
            </div>
            <div>
              <p className="font-bold text-slate-800">MÜŞTERİ TESLİM ALAN</p>
              <p className="text-[11px] text-slate-500">{order.customer.fullName} - İmza</p>
              <div className="h-12 border-b border-dashed border-slate-300 mt-2" />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="no-print bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Yazıcı ayarlarından kenar boşluklarını "Yok" veya "Varsayılan" seçebilirsiniz.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
