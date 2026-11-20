/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { storage } from './services/storage';
import { getCustomerOrderList } from './utils/formatters';
import {
  SaleOrder, StoreSettings, Customer, OrderStatus, CashAccount, CashTransaction
} from './types/optical';

export default function App() {
  const [orders, setOrders] = useState<SaleOrder[]>(() => storage.getOrders());
  const [customers, setCustomers] = useState<Customer[]>(() => storage.getCustomers());
  const [settings, setSettings] = useState<StoreSettings>(() => storage.getSettings());
  const [accounts, setAccounts] = useState<CashAccount[]>(() => storage.getAccounts());
  const [transactions, setTransactions] = useState<CashTransaction[]>(() => storage.getTransactions());

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

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    storage.saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    storage.saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    storage.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    storage.saveAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    storage.saveTransactions(transactions);
  }, [transactions]);

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

  // Order Handlers
  const handleSaveOrder = (savedOrder: SaleOrder) => {
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === savedOrder.id);
      if (exists) {
        return prev.map((o) => (o.id === savedOrder.id ? savedOrder : o));
      } else {
        return [savedOrder, ...prev];
      }
    });

    // Automatically sync customer to customers directory
    setCustomers((prev) => {
      const exists = prev.some(
        (c) =>
          c.id === savedOrder.customer.id ||
          (savedOrder.customer.tcNo && c.tcNo === savedOrder.customer.tcNo)
      );
      if (exists) {
        return prev.map((c) =>
          c.id === savedOrder.customer.id || (savedOrder.customer.tcNo && c.tcNo === savedOrder.customer.tcNo)
            ? savedOrder.customer
            : c
        );
      } else {
        return [savedOrder.customer, ...prev];
      }
    });

    setEditingOrder(null);
    setIsNewOrderModalOpen(false);

    if (selectedOrder && selectedOrder.id === savedOrder.id) {
      setSelectedOrder(savedOrder);
    }
  };

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, status: newStatus };
          if (newStatus === 'teslim_edildi' && !o.deliveryDate) {
            updated.deliveryDate = new Date().toISOString().split('T')[0];
          }
          return updated;
        }
        return o;
      })
    );

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null);
    }
  };

  // Customer Handlers
  const handleSaveCustomer = (customer: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === customer.id);
      if (exists) {
        return prev.map((c) => (c.id === customer.id ? customer : c));
      } else {
        return [customer, ...prev];
      }
    });

    // Also update customer info across their past orders
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.customer.id === customer.id || (customer.tcNo && ord.customer.tcNo === customer.tcNo)) {
          return {
            ...ord,
            customer: {
              ...ord.customer,
              fullName: customer.fullName,
              tcNo: customer.tcNo,
              phone: customer.phone,
              notes: customer.notes,
            },
          };
        }
        return ord;
      })
    );
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

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

  const handleAddTransaction = (tx: CashTransaction) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  const handleUpdateTransaction = (updatedTx: CashTransaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
  };

  const handleDeleteTransaction = (txId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
  };

  const handleAssignOrderAccount = (orderId: string, accountId: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, accountId } : o)));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, accountId } : null));
    }
  };

  const handleDataRestored = () => {
    setOrders(storage.getOrders());
    setCustomers(storage.getCustomers());
    setSettings(storage.getSettings());
    setAccounts(storage.getAccounts());
    setTransactions(storage.getTransactions());
  };

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

        {/* TAB 3: CİRO & KASA ÖZETİ */}
        {activeTab === 'finance' && isFinanceUnlocked && (
          <FinanceSummary
            orders={orders}
            accounts={accounts}
            transactions={transactions}
            onSelectOrder={(ord) => setSelectedOrder(ord)}
            onSaveAccounts={(updatedAccounts) => setAccounts(updatedAccounts)}
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
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}

      {/* New / Edit Order Modal */}
      {isNewOrderModalOpen && (
        <NewOrderModal
          initialOrder={editingOrder}
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
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
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
          onAddPayment={() => {}}
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
          onDataRestored={handleDataRestored}
        />
      )}

      {/* Store Settings Modal */}
      {isSettingsModalOpen && (
        <SettingsModal
          settings={settings}
          onSave={(newSettings) => setSettings(newSettings)}
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
