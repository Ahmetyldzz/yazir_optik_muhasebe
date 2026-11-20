import React, { useMemo, useState } from 'react';
import {
  DollarSign, Eye, Glasses, ArrowDownLeft, ArrowUpRight,
  Wallet, Plus, Minus, Edit3, Trash2, X, Search, Users, Check, Lock
} from 'lucide-react';
import {
  SaleOrder, CashAccount, CashTransaction, CashTransactionType
} from '../types/optical';
import { ConfirmDialog } from './ConfirmDialog';
import { formatCurrency, formatDate, searchMatches } from '../utils/formatters';

interface FinanceSummaryProps {
  orders: SaleOrder[];
  accounts: CashAccount[];
  transactions: CashTransaction[];
  onSelectOrder: (order: SaleOrder) => void;
  onSaveAccounts: (accounts: CashAccount[]) => void;
  onAddTransaction: (tx: CashTransaction) => void;
  onUpdateTransaction: (tx: CashTransaction) => void;
  onDeleteTransaction: (txId: string) => void;
  onAssignOrderAccount: (orderId: string, accountId: string) => void;
  onLockFinance?: () => void;
}

const EXPENSE_CATEGORIES = [
  'Toptancı / Cam & Çerçeve',
  'Kira & Aidat',
  'Fatura (Elektrik/Su/İnternet)',
  'Mutfak / İkram',
  'Kargo & Sarf Malzeme',
  'Vergi / Muhasebe',
  'Personel / Maaş',
  'Diğer Gider',
];

const INFLOW_CATEGORIES = [
  'Kasa Takviyesi',
  'Ek Gelir / Tamir',
  'Nakit Giriş',
  'Hesap Transferi',
  'Diğer Gelir',
];

type LedgerItem =
  | {
      kind: 'transaction';
      id: string;
      date: string;
      createdAt: string;
      type: CashTransactionType;
      accountId: string;
      amount: number;
      category: string;
      title: string;
      subtitle: string;
      tx: CashTransaction;
    }
  | {
      kind: 'order';
      id: string;
      date: string;
      createdAt: string;
      type: 'in';
      accountId: string;
      amount: number;
      category: string;
      title: string;
      subtitle: string;
      order: SaleOrder;
    };

function getAccountBadgeClasses(color: CashAccount['color']): string {
  if (color === 'cyan') return 'bg-cyan-100 text-cyan-950 border-cyan-300';
  if (color === 'indigo') return 'bg-indigo-100 text-indigo-950 border-indigo-300';
  if (color === 'emerald') return 'bg-emerald-100 text-emerald-950 border-emerald-300';
  return 'bg-amber-100 text-amber-950 border-amber-300';
}

function getAccountCardAccent(color: CashAccount['color'], active: boolean): string {
  if (color === 'cyan') {
    return active
      ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-50/40'
      : 'border-slate-200/80 hover:border-cyan-400 bg-white';
  }
  if (color === 'indigo') {
    return active
      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40'
      : 'border-slate-200/80 hover:border-indigo-400 bg-white';
  }
  if (color === 'emerald') {
    return active
      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40'
      : 'border-slate-200/80 hover:border-emerald-400 bg-white';
  }
  return active
    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40'
    : 'border-slate-200/80 hover:border-amber-400 bg-white';
}

export const FinanceSummary: React.FC<FinanceSummaryProps> = ({
  orders,
  accounts,
  transactions,
  onSelectOrder,
  onSaveAccounts,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAssignOrderAccount,
  onLockFinance,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<CashTransaction | null>(null);
  const [txType, setTxType] = useState<CashTransactionType>('out');
  const [txAccountId, setTxAccountId] = useState<string>(accounts[0]?.id || 'acc-1');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txCategory, setTxCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [txDescription, setTxDescription] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [txError, setTxError] = useState<string | null>(null);

  // Rename Accounts Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountDrafts, setAccountDrafts] = useState<CashAccount[]>(accounts);

  // Confirm delete transaction
  const [pendingDeleteTx, setPendingDeleteTx] = useState<CashTransaction | null>(null);

  const accountMap = useMemo(() => {
    const map = new Map<string, CashAccount>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate overall and per-account stats
  const {
    totalInflow,
    totalOutflow,
    netBalance,
    todayInflow,
    todayOutflow,
    orderRevenueTotal,
    unassignedOrdersCount,
    accountStats,
  } = useMemo(() => {
    const stats = new Map<string, { inflow: number; outflow: number; orderCount: number; txCount: number }>();
    accounts.forEach((a) => stats.set(a.id, { inflow: 0, outflow: 0, orderCount: 0, txCount: 0 }));

    let sumIn = 0;
    let sumOut = 0;
    let sumTodayIn = 0;
    let sumTodayOut = 0;
    let sumOrders = 0;
    let unassigned = 0;

    orders.forEach((o) => {
      const amount = o.salePrice || 0;
      sumOrders += amount;
      sumIn += amount;
      if (o.orderDate === todayStr || o.createdAt?.startsWith(todayStr)) {
        sumTodayIn += amount;
      }

      if (o.accountId && stats.has(o.accountId)) {
        const s = stats.get(o.accountId)!;
        s.inflow += amount;
        s.orderCount += 1;
      } else {
        unassigned += 1;
      }
    });

    transactions.forEach((t) => {
      const amount = t.amount || 0;
      if (t.type === 'in') {
        sumIn += amount;
        if (t.date === todayStr) sumTodayIn += amount;
      } else {
        sumOut += amount;
        if (t.date === todayStr) sumTodayOut += amount;
      }

      if (t.accountId && stats.has(t.accountId)) {
        const s = stats.get(t.accountId)!;
        if (t.type === 'in') s.inflow += amount;
        else s.outflow += amount;
        s.txCount += 1;
      }
    });

    return {
      totalInflow: sumIn,
      totalOutflow: sumOut,
      netBalance: sumIn - sumOut,
      todayInflow: sumTodayIn,
      todayOutflow: sumTodayOut,
      orderRevenueTotal: sumOrders,
      unassignedOrdersCount: unassigned,
      accountStats: stats,
    };
  }, [orders, transactions, accounts, todayStr]);

  // Unified chronological ledger
  const filteredLedger = useMemo(() => {
    const items: LedgerItem[] = [];

    transactions.forEach((tx) => {
      items.push({
        kind: 'transaction',
        id: tx.id,
        date: tx.date,
        createdAt: tx.createdAt,
        type: tx.type,
        accountId: tx.accountId,
        amount: tx.amount,
        category: tx.category,
        title: tx.description || tx.category,
        subtitle: tx.category,
        tx,
      });
    });

    orders.forEach((ord) => {
      items.push({
        kind: 'order',
        id: ord.id,
        date: ord.orderDate,
        createdAt: ord.createdAt,
        type: 'in',
        accountId: ord.accountId || '',
        amount: ord.salePrice,
        category: 'Gözlük Satışı',
        title: `${ord.customer.fullName} (${ord.orderNo})`,
        subtitle: `${ord.frame.brand} ${ord.frame.model || ''} • ${ord.prescription.lensBrand || 'Cam'}`.trim(),
        order: ord,
      });
    });

    items.sort((a, b) => {
      const dateDiff = (b.date || '').localeCompare(a.date || '');
      if (dateDiff !== 0) return dateDiff;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    const q = searchQuery.trim();

    return items.filter((item) => {
      if (selectedAccountId !== 'all' && item.accountId !== selectedAccountId) {
        return false;
      }
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }
      if (q) {
        const accName = accountMap.get(item.accountId)?.name || '';
        return (
          searchMatches(item.title, q) ||
          searchMatches(item.subtitle, q) ||
          searchMatches(item.category, q) ||
          searchMatches(accName, q)
        );
      }
      return true;
    });
  }, [transactions, orders, selectedAccountId, typeFilter, searchQuery, accountMap]);

  // Filtered totals for active view
  const filteredSummary = useMemo(() => {
    let fIn = 0;
    let fOut = 0;
    filteredLedger.forEach((item) => {
      if (item.type === 'in') fIn += item.amount;
      else fOut += item.amount;
    });
    return { fIn, fOut, fNet: fIn - fOut };
  }, [filteredLedger]);

  // Most popular lenses & brands
  const topLenses = useMemo(() => {
    const lensCountMap = new Map<string, number>();
    orders.forEach((o) => {
      const lens = o.prescription.lensBrand || o.prescription.lensType || 'Standart';
      lensCountMap.set(lens, (lensCountMap.get(lens) || 0) + 1);
    });
    return Array.from(lensCountMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const topBrands = useMemo(() => {
    const brandCountMap = new Map<string, { count: number; total: number }>();
    orders.forEach((o) => {
      const b = o.frame.brand || 'Diğer';
      const curr = brandCountMap.get(b) || { count: 0, total: 0 };
      brandCountMap.set(b, { count: curr.count + 1, total: curr.total + o.salePrice });
    });
    return Array.from(brandCountMap.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [orders]);

  const openNewTxModal = (defaultType: CashTransactionType, defaultAccount?: string) => {
    setEditingTx(null);
    setTxType(defaultType);
    setTxAccountId(
      defaultAccount ||
      (selectedAccountId !== 'all' ? selectedAccountId : accounts[0]?.id || 'acc-1')
    );
    setTxAmount('');
    setTxCategory(defaultType === 'out' ? EXPENSE_CATEGORIES[0] : INFLOW_CATEGORIES[0]);
    setTxDescription('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxError(null);
    setIsTxModalOpen(true);
  };

  const openEditTxModal = (tx: CashTransaction) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxAccountId(tx.accountId);
    setTxAmount(tx.amount.toString());
    setTxCategory(tx.category);
    setTxDescription(tx.description);
    setTxDate(tx.date);
    setTxError(null);
    setIsTxModalOpen(true);
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(txAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setTxError('Lütfen geçerli bir tutar giriniz.');
      return;
    }
    if (!txDescription.trim()) {
      setTxError('Lütfen açıklama giriniz (örn: Elektrik faturası, Cam toptancı ödemesi).');
      return;
    }

    const saved: CashTransaction = {
      id: editingTx ? editingTx.id : `tx-${Date.now()}`,
      type: txType,
      accountId: txAccountId,
      amount: parsedAmount,
      category: txCategory,
      description: txDescription.trim(),
      date: txDate || new Date().toISOString().split('T')[0],
      createdAt: editingTx ? editingTx.createdAt : new Date().toISOString(),
    };

    if (editingTx) {
      onUpdateTransaction(saved);
    } else {
      onAddTransaction(saved);
    }
    setIsTxModalOpen(false);
  };

  const handleOpenAccountModal = () => {
    setAccountDrafts(accounts.map((a) => ({ ...a })));
    setIsAccountModalOpen(true);
  };

  const handleSaveAccountNames = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = accountDrafts.map((a, idx) => ({
      ...a,
      name: a.name.trim() || (a.id === 'acc-common' ? 'Ortak Hesap' : `${idx + 1}. Kişi Hesabı`),
    }));
    onSaveAccounts(cleaned);
    setIsAccountModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 desk:p-6 shadow-md border border-slate-800 flex flex-col desk:flex-row items-start desk:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
            Genel Para Akışı & Ortak / Kişi Hesap Takibi
          </span>
          <h2 className="text-xl desk:text-2xl font-black tracking-tight text-white font-mono mt-1">
            YAZIR OPTİK CİRO & KASA ÖZETİ
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            3 ayrı kişi hesabı ve Ortak hesap üzerinden tüm satış girdilerini, dükkan giderlerini ve net kasa bakiyesini takip edin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full desk:w-auto">
          <button
            type="button"
            onClick={() => openNewTxModal('out')}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 flex-1 mid:flex-initial"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
            <span>Dükkan Gideri (Çıktı) Ekle</span>
          </button>

          <button
            type="button"
            onClick={() => openNewTxModal('in')}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-sm transition-all cursor-pointer active:scale-95 flex-1 mid:flex-initial"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Para Girişi (Girdi) Ekle</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAccountModal}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            title="Hesap İsimlerini Düzenle (3 Kişi + Ortak)"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Hesap İsimleri</span>
          </button>

          {onLockFinance && (
            <button
              type="button"
              onClick={onLockFinance}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-300 font-bold text-xs border border-slate-700 hover:border-rose-800 transition-all cursor-pointer"
              title="Ciro & Kasa Özetini Kilitle"
            >
              <Lock className="w-4 h-4" />
              <span>Kilitle</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Overall Cash Flow KPI Cards */}
      <div className="grid grid-cols-1 mid:grid-cols-2 desk:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Toplam Girdi (Gelir)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            +{formatCurrency(totalInflow)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {orders.length} gözlük satışı ({formatCurrency(orderRevenueTotal)}) + manuel girişler
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Toplam Çıktı (Giderler)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            -{formatCurrency(totalOutflow)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {transactions.filter((t) => t.type === 'out').length} adet dükkan gideri / ödeme
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-cyan-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Net Kasa Bakiyesi</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${netBalance >= 0 ? 'text-slate-950' : 'text-rose-600'}`}>
            {formatCurrency(netBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Toplam Girdi - Toplam Çıktı
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bugünkü Para Akışı</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-emerald-600">+{formatCurrency(todayInflow)}</span>
            <span className="text-slate-300">/</span>
            <span className="text-lg font-black text-rose-600">-{formatCurrency(todayOutflow)}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Bugün giren ve harcanan tutar
          </p>
        </div>
      </div>

      {/* 3 Person + Ortak Separate Accounts */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-600" />
              <span>3 Kişi + Ortak Hesap Bakiyeleri & Girdi / Çıktı Durumu</span>
            </h3>
            <p className="text-xs text-slate-500">
              Bir hesaba tıklayarak aşağıdaki listede sadece o hesabın girdi ve gider hareketlerini görebilirsiniz.
            </p>
          </div>
          {selectedAccountId !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedAccountId('all')}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-900 underline cursor-pointer"
            >
              Tüm Hesapları Göster
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 mid:grid-cols-2 desk:grid-cols-4 gap-4">
          {accounts.map((acc) => {
            const st = accountStats.get(acc.id) || { inflow: 0, outflow: 0, orderCount: 0, txCount: 0 };
            const net = st.inflow - st.outflow;
            const isSelected = selectedAccountId === acc.id;

            return (
              <div
                key={acc.id}
                onClick={() => setSelectedAccountId(isSelected ? 'all' : acc.id)}
                className={`rounded-2xl p-5 border-2 shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-4 ${getAccountCardAccent(
                  acc.color,
                  isSelected
                )}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border mb-1.5 ${getAccountBadgeClasses(acc.color)}`}>
                      {isSelected ? 'Filtreleniyor' : acc.id === 'acc-common' ? 'Ortak Hesap' : 'Kişi Hesabı'}
                    </span>
                    <h4 className="font-black text-slate-950 text-base">{acc.name}</h4>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAccountModal();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Hesap İsmini Düzenle"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">Girdi (Gelen)</span>
                    <span className="text-sm font-black text-emerald-700">+{formatCurrency(st.inflow)}</span>
                  </div>
                  <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold uppercase text-rose-800 block">Çıktı (Gider)</span>
                    <span className="text-sm font-black text-rose-700">-{formatCurrency(st.outflow)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Hesap Net Bakiyesi</span>
                    <span className={`text-xl font-black ${net >= 0 ? 'text-slate-950' : 'text-rose-600'}`}>
                      {formatCurrency(net)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewTxModal('out', acc.id);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold cursor-pointer"
                      title={`${acc.name} üzerinden gider ekle`}
                    >
                      - Gider
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewTxModal('in', acc.id);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold cursor-pointer"
                      title={`${acc.name} hesabına girdi ekle`}
                    >
                      + Girdi
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unified Cash Flow & Shop Expenses Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col mid:flex-row mid:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Para Akışı & Dükkan Giderleri Geçmişi ({filteredLedger.length} Hareket)
              </h4>
              <p className="text-[11px] text-slate-500">
                Filtre toplamı: <strong className="text-emerald-700">+{formatCurrency(filteredSummary.fIn)}</strong> girdi •{' '}
                <strong className="text-rose-600">-{formatCurrency(filteredSummary.fOut)}</strong> çıktı •{' '}
                Net: <strong className="text-slate-900">{formatCurrency(filteredSummary.fNet)}</strong>
              </p>
            </div>

            <div className="relative w-full mid:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Gider, müşteri veya hesap ara..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-cyan-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Account & Type Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedAccountId('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  selectedAccountId === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tüm Hesaplar
              </button>
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    selectedAccountId === acc.id
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {acc.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                  typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('in')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                  typeFilter === 'in' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Girdiler (+)
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('out')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                  typeFilter === 'out' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Çıktılar / Giderler (-)
              </button>
            </div>
          </div>

          {unassignedOrdersCount > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              <strong>Bilgi:</strong> {unassignedOrdersCount} adet eski satış kaydında henüz kişi hesabı seçilmemiş. Aşağıdaki tablodan hemen hesap atayabilirsiniz.
            </div>
          )}
        </div>

        {filteredLedger.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Seçili filtrelere uygun para akışı veya gider kaydı bulunamadı.
          </div>
        ) : (
          <>
            {/* Desktop / Mid Table (>= 680px) */}
            <div className="hidden mid:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">Tür</th>
                    <th className="py-3 px-4">Hesap (Kimden / Kime)</th>
                    <th className="py-3 px-4">Açıklama & Kategori</th>
                    <th className="py-3 px-4 text-right">Tutar</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.map((item) => {
                    const acc = accountMap.get(item.accountId);
                    return (
                      <tr key={`${item.kind}-${item.id}`} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.type === 'in' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                              <ArrowDownLeft className="w-3 h-3" />
                              {item.kind === 'order' ? 'SATIŞ GİRDİSİ' : 'GİRDİ'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-200">
                              <ArrowUpRight className="w-3 h-3" />
                              ÇIKTI (GİDER)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.kind === 'order' ? (
                            <select
                              value={item.accountId}
                              onChange={(e) => onAssignOrderAccount(item.id, e.target.value)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                                acc ? getAccountBadgeClasses(acc.color) : 'bg-amber-50 text-amber-900 border-amber-300'
                              }`}
                              title="Bu satışın tahsil edildiği hesabı değiştir"
                            >
                              {!acc && <option value="">Hesap Seçiniz...</option>}
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                          ) : acc ? (
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getAccountBadgeClasses(acc.color)}`}>
                              {acc.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.title}</span>
                          <span className="text-[11px] text-slate-500 block">{item.subtitle}</span>
                        </td>
                        <td className={`py-3 px-4 text-right font-black text-sm whitespace-nowrap ${
                          item.type === 'in' ? 'text-emerald-700' : 'text-rose-600'
                        }`}>
                          {item.type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {item.kind === 'order' ? (
                            <button
                              type="button"
                              onClick={() => onSelectOrder(item.order)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                              title="Gözlük Detayını Gör"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditTxModal(item.tx)}
                                className="p-1.5 text-slate-500 hover:text-amber-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                                title="Düzenle"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteTx(item.tx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (< 680px) */}
            <div className="block mid:hidden divide-y divide-slate-100">
              {filteredLedger.map((item) => {
                const acc = accountMap.get(item.accountId);
                return (
                  <div key={`${item.kind}-${item.id}`} className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.type === 'in' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                            {item.kind === 'order' ? 'SATIŞ GİRDİSİ' : 'GİRDİ'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-200">
                            ÇIKTI (GİDER)
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-500">{formatDate(item.date)}</span>
                      </div>
                      <span className={`font-black text-sm ${item.type === 'in' ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {item.type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500">{item.subtitle}</div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {item.kind === 'order' ? (
                        <select
                          value={item.accountId}
                          onChange={(e) => onAssignOrderAccount(item.id, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none ${
                            acc ? getAccountBadgeClasses(acc.color) : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}
                        >
                          {!acc && <option value="">Hesap Seçiniz...</option>}
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      ) : acc ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getAccountBadgeClasses(acc.color)}`}>
                          {acc.name}
                        </span>
                      ) : <span />}

                      {item.kind === 'order' ? (
                        <button
                          type="button"
                          onClick={() => onSelectOrder(item.order)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg bg-slate-100 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditTxModal(item.tx)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 rounded-lg bg-slate-100 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteTx(item.tx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Top Lenses & Frame Brands */}
      <div className="grid grid-cols-1 mid:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Glasses className="w-4 h-4 text-cyan-600" />
            <span>En Çok Verilen Cam Markaları</span>
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

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-3 pb-2 border-b border-slate-100">
            En Çok Verilen Gözlük Markaları
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

      {/* MODAL: Add / Edit Cash Transaction */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 mid:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingTx
                  ? 'Kasa Hareketini Düzenle'
                  : txType === 'out'
                    ? 'Dükkan Gideri (Çıktı) Ekle'
                    : 'Para Girişi (Girdi) Ekle'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="p-6 space-y-4 text-xs">
              {txError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                  {txError}
                </div>
              )}

              {/* Tür Seçimi */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('out');
                    setTxCategory(EXPENSE_CATEGORIES[0]);
                  }}
                  className={`py-2.5 px-3 rounded-xl border-2 font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    txType === 'out'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Çıktı (Dükkan Gideri)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('in');
                    setTxCategory(INFLOW_CATEGORIES[0]);
                  }}
                  className={`py-2.5 px-3 rounded-xl border-2 font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    txType === 'in'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Girdi (Para Girişi)</span>
                </button>
              </div>

              {/* Hangi Hesap? */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  {txType === 'out'
                    ? 'Hangi Hesap Üzerinden Harcandı?'
                    : 'Hangi Hesaba Girdi?'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {accounts.map((acc) => {
                    const selected = txAccountId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setTxAccountId(acc.id)}
                        className={`px-3 py-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />}
                        <span className="truncate">{acc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kategori & Tutar & Tarih */}
              <div className="grid grid-cols-1 mid:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Kategori</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-cyan-500"
                  >
                    {(txType === 'out' ? EXPENSE_CATEGORIES : INFLOW_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Tutar (₺) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="örn: 1500"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-slate-950 outline-none focus:bg-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Açıklama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder={
                    txType === 'out'
                      ? 'örn: Kasım ayı dükkan elektrik faturası, Essilor cam ödemesi'
                      : 'örn: Kasa başlangıç nakdi, gözlük tamir ücreti'
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Tarih</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-black text-white cursor-pointer shadow-sm ${
                    txType === 'out'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {editingTx ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Account Names (3 People + Ortak) */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 mid:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base">Hesap İsimleri (3 Kişi + Ortak)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccountNames} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Para akışı ve dükkan gideri takibinde kullanılacak 3 ayrı kişi hesabı ile Ortak hesabın isimlerini belirleyin:
              </p>

              {accountDrafts.map((draft, idx) => (
                <div key={draft.id}>
                  <label className="font-bold text-slate-800 block mb-1">
                    {draft.id === 'acc-common' ? 'Ortak Hesap Adı' : `${idx + 1}. Kişi Hesap Adı`}
                  </label>
                  <input
                    type="text"
                    required
                    value={draft.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAccountDrafts((prev) =>
                        prev.map((item) => (item.id === draft.id ? { ...item, name: val } : item))
                      );
                    }}
                    placeholder={draft.id === 'acc-common' ? 'örn: Ortak Hesap' : `örn: ${idx + 1}. Kişi`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-cyan-500"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black cursor-pointer"
                >
                  İsimleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteTx)}
        title="Kasa Hareketini Sil"
        message={
          pendingDeleteTx
            ? `"${pendingDeleteTx.description}" (${formatCurrency(pendingDeleteTx.amount)}) kaydını silmek istediğinize emin misiniz?`
            : ''
        }
        onConfirm={() => {
          if (pendingDeleteTx) {
            onDeleteTransaction(pendingDeleteTx.id);
            setPendingDeleteTx(null);
          }
        }}
        onCancel={() => setPendingDeleteTx(null)}
      />
    </div>
  );
};
