/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header, ActiveTabType } from './components/Header';
import { OrderList } from './components/OrderList';
import { OrderDetailModal } from './components/OrderDetailModal';
import { NewOrderModal } from './components/NewOrderModal';
import { CustomerDirectory } from './components/CustomerDirectory';
import { FinanceSummary } from './components/FinanceSummary';
import { ReceiptPrintModal } from './components/ReceiptPrintModal';
import { BackupModal } from './components/BackupModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { FinanceAuthModal } from './components/FinanceAuthModal';
import { api, recordPath, type StoreData } from './services/api';
import { InventoryManager } from './components/InventoryManager';
import { storage } from './services/storage';
import { getCustomerOrderList } from './utils/formatters';
import {
  SaleOrder, StoreSettings, Customer, OrderStatus, CashAccount, CashTransaction
} from './types/optical';

export default function App() {
  const [data, setData] = useState<StoreData | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const working = useRef(false);

  const [activeTab, setActiveTab] = useState<ActiveTabType>('orders');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<SaleOrder | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<SaleOrder | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFinanceUnlocked, setIsFinanceUnlocked] = useState<boolean>(() => storage.isFinanceSessionValid());
  const [isFinanceAuthOpen, setIsFinanceAuthOpen] = useState(false);

  async function refresh() {
    const next = await api<StoreData>('/backup');
    setData(next);
    setSelectedOrder(current => current ? next.orders.find(order => order.id === current.id) ?? null : null);
  }

  async function run(operation?: () => Promise<unknown>): Promise<boolean> {
    if (working.current) return false;
    working.current = true;
    setBusy(true);
    setError('');
    let saved = false;
    try {
      if (operation) {
        await operation();
        saved = true;
      }
      await refresh();
      return true;
    } catch (failure) {
      setError(saved ? 'İşlem kaydedildi. Ekranı güncellemek için Yenile düğmesini kullanın.'
        : failure instanceof Error ? failure.message : 'İşlem tamamlanamadı.');
      if (!saved && operation) await refresh().catch(() => {});
      return saved;
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  useEffect(() => { void run(); }, []);

  // Automatically re-lock Ciro & Kasa Özeti after 1 hour expires
  useEffect(() => {
    if (!isFinanceUnlocked) return;

    const remainingMs = storage.getFinanceUnlockUntil() - Date.now();
    if (remainingMs <= 0) {
      storage.lockFinanceSession();
      setIsFinanceUnlocked(false);
      if (activeTab === 'finance') {
        setActiveTab('orders');
        setIsFinanceAuthOpen(true);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      storage.lockFinanceSession();
      setIsFinanceUnlocked(false);
      setActiveTab((curr) => {
        if (curr === 'finance') {
          setIsFinanceAuthOpen(true);
          return 'orders';
        }
        return curr;
      });
    }, remainingMs);

    return () => window.clearTimeout(timer);
  }, [isFinanceUnlocked, activeTab]);

  const saveRecord = (collection: string, record: { id: string }, exists: boolean) =>
    run(() => api(exists ? recordPath(collection, record.id) : '/' + collection, exists ? 'PATCH' : 'POST', record));
  const removeRecord = (collection: string, id: string) => run(() => api(recordPath(collection, id), 'DELETE'));
  const updateOrder = (id: string, fields: Partial<SaleOrder>) =>
    run(() => api(recordPath('orders', id), 'PATCH', fields));

  const handleSaveOrder = async (order: SaleOrder) => {
    const { id, orderNo, ...fields } = order;
    const saved = await (editingOrder?.id ? updateOrder(id, fields) : run(() => api('/orders', 'POST', fields)));
    if (saved) {
      setEditingOrder(null);
      setIsNewOrderModalOpen(false);
    }
    return saved;
  };
  const handleUpdateStatus = (id: string, status: OrderStatus) => updateOrder(id, { status });
  const handleDeleteOrder = (id: string) => removeRecord('orders', id);
  const handleSaveCustomer = (customer: Customer) =>
    saveRecord('customers', customer, Boolean(data?.customers.some(row => row.id === customer.id)));
  const handleDeleteCustomer = (id: string) => removeRecord('customers', id);

  const handleNewOrderForCustomer = (customer: Customer) => {
    setEditingOrder({
      id: '',
      orderNo: '',
      customer: { ...customer },
      prescription: {
        usageType: 'uzak',
        usageTypes: ['uzak'],
        rightEye: { sph: '', cyl: '', axis: '', pd: '' },
        leftEye: { sph: '', cyl: '', axis: '', pd: '' },
        distanceRx: {
          rightEye: { sph: '', cyl: '', axis: '', pd: '' },
          leftEye: { sph: '', cyl: '', axis: '', pd: '' },
        },
        nearRx: {
          rightEye: { sph: '', cyl: '', axis: '', pd: '' },
          leftEye: { sph: '', cyl: '', axis: '', pd: '' },
        },
        lensType: '',
        lensFeatures: [],
        lensBrand: '',
        lensModel: '',
        nearLensBrand: '',
        nearLensModel: '',
        lensIndex: '',
      },
      frame: {
        brand: '',
        model: '',
        colorCode: '',
        size: '',
        type: 'numarali',
      },
      framePrice: 0,
      lensPrice: 0,
      costPrice: 0,
      listPrice: 0,
      salePrice: 0,
      paidAmount: 0,
      remainingAmount: 0,
      status: 'hazirlaniyor',
      orderDate: new Date().toISOString().split('T')[0],
      warrantyMonths: 24,
      createdAt: new Date().toISOString(),
    });
    setIsNewOrderModalOpen(true);
  };

  const handleAddTransaction = (tx: CashTransaction) => saveRecord('transactions', tx, false);
  const handleUpdateTransaction = (tx: CashTransaction) => saveRecord('transactions', tx, true);
  const handleDeleteTransaction = (id: string) => removeRecord('transactions', id);
  const handleAssignOrderAccount = (id: string, accountId: string) => updateOrder(id, { accountId });
  const handleSaveAccounts = (updated: CashAccount[]) => run(async () => {
    for (const account of updated) {
      const previous = data?.accounts.find(row => row.id === account.id);
      if (previous?.name !== account.name) await api(recordPath('accounts', account.id), 'PATCH', { name: account.name });
    }
  });
  const handleSaveSettings = (settings: StoreSettings) => run(() => api('/settings', 'PUT', settings));

  if (!data) {
    return (
      <main className="max-w-xl mx-auto p-8" aria-busy={busy}>
        <p role={error ? 'alert' : 'status'}>{error || 'Kayıtlar yükleniyor…'}</p>
        {error && <button className="mt-4 underline" onClick={() => void run()}>Tekrar dene</button>}
      </main>
    );
  }

  const { customers, settings, accounts, transactions, inventory } = data;
  const customerById = new Map(customers.map(customer => [customer.id, customer]));
  const orders = data.orders.map(order => ({
    ...order, customer: customerById.get(order.customer.id) ?? order.customer,
  }));
  const displayedOrder = selectedOrder && orders.find(order => order.id === selectedOrder.id);

  const pendingDeliveries = orders.filter((o) => o.status !== 'teslim_edildi').length;

  const directoryCustomersCount = customers.filter((cust) => {
    const allCustOrders = getCustomerOrderList(orders, cust);
    const deliveredOrders = allCustOrders.filter((o) => o.status === 'teslim_edildi');
    return deliveredOrders.length > 0 || allCustOrders.length === 0;
  }).length;

  const handleTabChange = (tab: ActiveTabType) => {
    if (tab === 'finance') {
      if (!storage.isFinanceSessionValid()) {
        storage.lockFinanceSession();
        setIsFinanceUnlocked(false);
        setIsFinanceAuthOpen(true);
        return;
      }
      setIsFinanceUnlocked(true);
      setActiveTab('finance');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-cyan-200">
      {error && (
        <div role="alert" className="fixed top-4 right-4 z-[100] max-w-sm rounded-lg bg-red-800 p-4 text-white shadow-lg">
          <p>{error}</p>
          <button onClick={() => void run()} className="mt-2 mr-4 underline">Yenile</button>
          <button onClick={() => setError('')} className="mt-2 underline">Kapat</button>
        </div>
      )}
      {busy && <div role="status" className="fixed bottom-4 right-4 z-[100] rounded-lg bg-slate-900 px-4 py-2 text-white">İşlem sürüyor…</div>}
      {/* Top Bar Header */}
      <Header
        settings={settings}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isFinanceUnlocked={isFinanceUnlocked}
        onOpenNewOrder={() => {
          setEditingOrder(null);
          setIsNewOrderModalOpen(true);
        }}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        ordersCount={pendingDeliveries}
        customersCount={directoryCustomersCount}
        pendingDeliveriesCount={pendingDeliveries}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 mid:px-5 desk:px-8 py-4 mid:py-6">
        {/* TAB 1: HAZIRLANAN GÖZLÜKLER */}
        {activeTab === 'orders' && (
          <OrderList
            orders={orders}
            filterStatus={filterStatus}
            onSelectOrder={(ord) => setSelectedOrder(ord)}
            onEditOrder={(ord) => {
              setEditingOrder(ord);
              setIsNewOrderModalOpen(true);
            }}
            onDeleteOrder={handleDeleteOrder}
            onPrintOrder={(ord) => setPrintingOrder(ord)}
            onUpdateStatus={handleUpdateStatus}
            onNewOrderForCustomer={handleNewOrderForCustomer}
          />
        )}

        {/* TAB 2: MÜŞTERİ BİLGİ DEFTERİ */}
        {activeTab === 'customers' && (
          <CustomerDirectory
            customers={customers}
            orders={orders}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onNewOrderForCustomer={handleNewOrderForCustomer}
            onViewOrder={(ord) => setSelectedOrder(ord)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            inventory={inventory}
            onSave={(item, exists) => saveRecord('inventory', item, exists)}
            onDelete={(id) => removeRecord('inventory', id)}
            onAdjust={(id, delta) => run(() => api(recordPath('inventory', id) + '/adjust', 'POST', { delta }))}
          />
        )}

        {/* TAB 3: CİRO & KASA ÖZETİ */}
        {activeTab === 'finance' && isFinanceUnlocked && (
          <FinanceSummary
            orders={orders}
            accounts={accounts}
            transactions={transactions}
            onSelectOrder={(ord) => setSelectedOrder(ord)}
            onSaveAccounts={handleSaveAccounts}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onAssignOrderAccount={handleAssignOrderAccount}
            onLockFinance={() => {
              storage.lockFinanceSession();
              setIsFinanceUnlocked(false);
              setActiveTab('orders');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-3 mid:px-5 desk:px-8 flex flex-col mid:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            <strong>{settings.storeName}</strong> • Gözlük & Cam Takip Programı
          </p>
          <p className="text-[11px] text-slate-400">
            {settings.city} • {settings.phone}
          </p>
        </div>
      </footer>

      {/* MODALS */}

      {/* Admin Panel Modal (Cam Markaları & Modelleri Yönetimi) */}
      {isAdminPanelOpen && (
        <AdminPanelModal
          lensBrands={data.lensBrands}
          onSaveBrands={(brands) => run(() => api('/catalog/lens-brands', 'PUT', brands))}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}

      {/* New / Edit Order Modal */}
      {isNewOrderModalOpen && (
        <NewOrderModal
          initialOrder={editingOrder}
          catalogs={data}
          customers={customers}
          orders={orders}
          accounts={accounts}
          onSave={handleSaveOrder}
          onClose={() => {
            setIsNewOrderModalOpen(false);
            setEditingOrder(null);
          }}
        />
      )}

      {/* Order Detail Modal */}
      {displayedOrder && (
        <OrderDetailModal
          order={displayedOrder}
          orders={orders}
          settings={settings}
          onClose={() => setSelectedOrder(null)}
          onEdit={(ord) => {
            setSelectedOrder(null);
            setEditingOrder(ord);
            setIsNewOrderModalOpen(true);
          }}
          onDelete={handleDeleteOrder}
          onUpdateStatus={handleUpdateStatus}
          onPrint={(ord) => {
            setSelectedOrder(null);
            setPrintingOrder(ord);
          }}
          onSelectOrder={(ord) => setSelectedOrder(ord)}
          onNewOrderForCustomer={handleNewOrderForCustomer}
        />
      )}

      {/* Printable Receipt Modal */}
      {printingOrder && (
        <ReceiptPrintModal
          order={printingOrder}
          settings={settings}
          onClose={() => setPrintingOrder(null)}
        />
      )}

      {/* Backup Modal */}
      {isBackupModalOpen && (
        <BackupModal
          onClose={() => setIsBackupModalOpen(false)}
          onRestore={(backup) => run(() => api('/backup', 'POST', backup))}
        />
      )}

      {/* Store Settings Modal */}
      {isSettingsModalOpen && (
        <SettingsModal
          settings={settings}
          catalogs={data}
          onSaveCatalog={(key, values) => run(() => api('/catalog/' + key, 'PUT', values))}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {/* Finance Auth Modal */}
      <FinanceAuthModal
        isOpen={isFinanceAuthOpen}
        onSuccess={() => {
          storage.unlockFinanceSession();
          setIsFinanceUnlocked(true);
          setIsFinanceAuthOpen(false);
          setActiveTab('finance');
        }}
        onCancel={() => setIsFinanceAuthOpen(false)}
      />
    </div>
  );
}
