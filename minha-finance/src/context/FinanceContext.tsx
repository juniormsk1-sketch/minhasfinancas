import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppDatabase,
  Transaction,
  WalletMember,
  Wallet,
  Account,
  Bill,
  Invoice,
  CreditCard,
  Transfer,
  Goal,
  Budget,
  UserSecuritySettings,
} from '../types/finance';
import { getInitialDatabase } from '../data/initialData';
import { computeFinanceSummary, FinanceSummary } from '../utils/calculations';

interface OutboxItem {
  id: string;
  type: 'add_transaction' | 'pay_bill' | 'pay_invoice' | 'transfer';
  payload: any;
  timestamp: number;
}

interface FinanceContextType {
  db: AppDatabase;
  summary: FinanceSummary;
  wallet: Wallet | undefined;
  activeUser: WalletMember;
  partner: WalletMember | undefined;
  isOnline: boolean;
  isSyncing: boolean;
  hideValues: boolean;
  isLocked: boolean;
  securitySettings: UserSecuritySettings;
  unreadNotificationsCount: number;
  toggleHideValues: () => void;
  switchActiveUser: (userId: string) => void;
  unlockApp: (pin: string) => boolean;
  lockApp: () => void;
  updateSecuritySettings: (settings: Partial<UserSecuritySettings>) => void;
  addTransaction: (tx: Partial<Transaction>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  payBill: (billId: string, accountId: string) => Promise<void>;
  payInvoice: (invoiceId: string, accountId: string, amount: number) => Promise<void>;
  addAccount: (acc: Partial<Account>) => Promise<void>;
  updateAccount: (acc: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  addBill: (bill: Partial<Bill>) => Promise<void>;
  updateBill: (bill: Bill) => Promise<void>;
  addCreditCard: (card: Partial<CreditCard>) => Promise<CreditCard>;
  updateCreditCard: (card: CreditCard) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  addTransfer: (tr: Partial<Transfer>) => Promise<void>;
  addGoal: (goal: Partial<Goal>) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (categoryId: string, month: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  requestDeviceNotificationPermission: () => Promise<boolean>;
  deviceNotificationPermission: NotificationPermission | 'unsupported';
  joinWalletWithCode: (code: string) => Promise<{ success: boolean; message: string }>;
  updateMemberProfile: (userId: string, data: { name?: string; avatar_url?: string; email?: string }) => Promise<void>;
  updateWalletName: (name: string) => Promise<void>;
  resetAllNumbers: () => Promise<void>;
  triggerManualSync: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const LOCAL_STORAGE_DB_KEY = 'minha_finance_db_v1';
const LOCAL_STORAGE_OUTBOX_KEY = 'minha_finance_outbox_v1';
const LOCAL_STORAGE_USER_KEY = 'minha_finance_active_user_v1';
const LOCAL_STORAGE_SECURITY_KEY = 'minha_finance_security_v1';
const LOCAL_STORAGE_HIDE_VALUES_KEY = 'minha_finance_hide_values_v1';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<AppDatabase>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Automatically migrate if previous mock users (Thiago/Camila) are in storage
        const hasOldUsers = parsed.wallets?.[0]?.members?.some(
          (m: any) => m.name === 'Thiago' || m.name === 'Camila' || m.user_id === 'usr_thiago'
        );
        if (hasOldUsers) {
          localStorage.removeItem(LOCAL_STORAGE_DB_KEY);
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, 'usr_junior');
          return getInitialDatabase();
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read cached DB:', e);
    }
    return getInitialDatabase();
  });

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!saved || saved === 'usr_thiago') {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, 'usr_junior');
      return 'usr_junior';
    }
    return saved;
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hideValues, setHideValues] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_HIDE_VALUES_KEY) === 'true';
  });

  const [securitySettings, setSecuritySettings] = useState<UserSecuritySettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SECURITY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      pin_enabled: false,
      biometrics_enabled: false,
      auto_lock_minutes: 5,
    };
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return securitySettings.pin_enabled;
  });

  // Current wallet and active members
  const wallet = db.wallets[0];
  const activeUser = useMemo(() => {
    if (!wallet) {
      return {
        user_id: 'usr_junior',
        name: 'Junior',
        email: 'junior@casal.com',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      };
    }
    const found = wallet.members.find(m => m.user_id === activeUserId);
    return found || wallet.members[0];
  }, [wallet, activeUserId]);

  const partner = useMemo(() => {
    if (!wallet) return undefined;
    return wallet.members.find(m => m.user_id !== activeUser.user_id);
  }, [wallet, activeUser]);

  // Compute summary for the active user
  const summary = useMemo(() => {
    return computeFinanceSummary(db, activeUser.user_id);
  }, [db, activeUser.user_id]);

  // Count unread notifications
  const unreadNotificationsCount = useMemo(() => {
    return db.notifications.filter(n => !n.read && (n.user_id === activeUser.user_id || !n.user_id)).length;
  }, [db.notifications, activeUser.user_id]);

  // Native Device Notification State
  const [deviceNotificationPermission, setDeviceNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const requestDeviceNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      setDeviceNotificationPermission(perm);
      if (perm === 'granted') {
        sendDeviceNotification('Minha Finance 💜', 'Notificações no celular ativadas com sucesso! Você receberá avisos da casa aqui.');
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Notification permission error:', e);
      return false;
    }
  };

  const sendDeviceNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, {
              body,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
            });
          }).catch(() => {
            new Notification(title, { body, icon: '/pwa-192x192.png' });
          });
        } else {
          new Notification(title, { body, icon: '/pwa-192x192.png' });
        }
      } catch (e) {
        console.warn('Native notification error:', e);
      }
    }
  };

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.warn('Failed to cache db in localStorage:', e);
    }
  }, [db]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOutbox();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync with server on mount and setup Server-Sent Events (SSE) for real-time couple sync
  const fetchFromServer = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/database');
      if (res.ok) {
        const data = await res.json();
        if (data && data.wallets) {
          setDb(data);
        }
      }
    } catch (err) {
      console.log('Server fetch failed, using local/cached state:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchFromServer();

    // SSE connection for instant synchronization across tabs or devices
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.type) {
            fetchFromServer();

            // Real-time device notification for partner
            if (payload.type === 'TRANSACTION_CREATED' && payload.data) {
              const tx = payload.data;
              if (tx.person_id !== activeUserId) {
                const formattedAmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount);
                sendDeviceNotification(
                  'Minha Finance 💜',
                  `Seu amor registrou um novo movimento: "${tx.description}" (${formattedAmt})`
                );
              }
            }
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };
    } catch (e) {
      console.warn('Could not establish SSE:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchFromServer]);

  // Process outbox queue when online
  const processOutbox = async () => {
    try {
      const outboxRaw = localStorage.getItem(LOCAL_STORAGE_OUTBOX_KEY);
      if (!outboxRaw) return;
      const outbox: OutboxItem[] = JSON.parse(outboxRaw);
      if (outbox.length === 0) return;

      setIsSyncing(true);
      for (const item of outbox) {
        if (item.type === 'add_transaction') {
          await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
        }
      }
      localStorage.removeItem(LOCAL_STORAGE_OUTBOX_KEY);
      await fetchFromServer();
    } catch (e) {
      console.error('Error processing outbox:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const queueOutbox = (item: OutboxItem) => {
    try {
      const outboxRaw = localStorage.getItem(LOCAL_STORAGE_OUTBOX_KEY);
      const outbox: OutboxItem[] = outboxRaw ? JSON.parse(outboxRaw) : [];
      outbox.push(item);
      localStorage.setItem(LOCAL_STORAGE_OUTBOX_KEY, JSON.stringify(outbox));
    } catch (e) {
      console.error('Error queuing to outbox:', e);
    }
  };

  const toggleHideValues = () => {
    setHideValues(prev => {
      const next = !prev;
      localStorage.setItem(LOCAL_STORAGE_HIDE_VALUES_KEY, String(next));
      return next;
    });
  };

  const switchActiveUser = (userId: string) => {
    setActiveUserId(userId);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, userId);
  };

  const unlockApp = (pin: string) => {
    if (!securitySettings.pin_enabled) {
      setIsLocked(false);
      return true;
    }
    if (securitySettings.pin_code === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  const updateSecuritySettings = (settings: Partial<UserSecuritySettings>) => {
    setSecuritySettings(prev => {
      const updated = { ...prev, ...settings };
      localStorage.setItem(LOCAL_STORAGE_SECURITY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Add Transaction
  const addTransaction = async (txData: Partial<Transaction>): Promise<Transaction> => {
    const newTx: Transaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      wallet_id: wallet?.id || 'wal_casa_01',
      type: txData.type || 'expense',
      nature: txData.nature || 'variable',
      description: txData.description || 'Lançamento',
      amount: Number(txData.amount) || 0,
      date: txData.date || new Date().toISOString().split('T')[0],
      category_id: txData.category_id || 'cat_outras_despesas',
      account_id: txData.account_id,
      person_id: txData.person_id || activeUser.user_id,
      privacy: txData.privacy || 'shared',
      payment_method: txData.payment_method || 'pix',
      recurring: txData.recurring || 'none',
      notes: txData.notes,
      attachment_url: txData.attachment_url,
      installments: txData.installments,
      installment_no: txData.installment_no,
      installment_group_id: txData.installment_group_id,
      card_id: txData.card_id,
      bill_id: txData.bill_id,
      created_date: new Date().toISOString(),
      created_by_id: activeUser.user_id,
    };

    // Optimistic UI update
    setDb(prev => {
      const todayStr = new Date().toISOString().split('T')[0];
      const isPendingIncome = newTx.type === 'income' && (newTx.status === 'pending' || newTx.date > todayStr);

      const updatedAccounts = prev.accounts.map(acc => {
        if (newTx.account_id && acc.id === newTx.account_id && newTx.payment_method !== 'credito') {
          // Se for receita ainda a receber (data futura ou pendente), não altera saldo bancário
          if (isPendingIncome) {
            return acc;
          }
          return {
            ...acc,
            balance: newTx.type === 'income' ? acc.balance + newTx.amount : acc.balance - newTx.amount,
          };
        }
        return acc;
      });

      const author = wallet?.members.find(m => m.user_id === newTx.person_id) || activeUser;
      const newActivity = {
        id: 'act_' + Date.now(),
        wallet_id: newTx.wallet_id,
        user_id: newTx.person_id,
        user_name: author.name,
        user_avatar: author.avatar_url,
        action: 'create' as const,
        entity_type: 'transaction' as const,
        description: `Registrou ${newTx.type === 'income' ? 'entrada' : 'despesa'} "${newTx.description}"`,
        details: newTx.payment_method ? `Via ${newTx.payment_method.toUpperCase()}` : undefined,
        amount: newTx.amount,
        created_date: new Date().toISOString(),
      };

      const newNotifs = [...prev.notifications];
      const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newTx.amount);

      // 1. Notify partner if shared
      if (newTx.privacy === 'shared' && partner) {
        newNotifs.unshift({
          id: 'notif_' + Date.now(),
          wallet_id: newTx.wallet_id,
          user_id: partner.user_id,
          type: 'movement_new',
          title: `${author.name} registrou um movimento`,
          body: `"${newTx.description}" (${formattedAmount})`,
          ref_id: newTx.id,
          read: false,
          created_date: new Date().toISOString(),
        });
      }

      // 2. Notification/confirmation for author
      newNotifs.unshift({
        id: 'notif_me_' + Date.now(),
        wallet_id: newTx.wallet_id,
        user_id: activeUser.user_id,
        type: 'movement_new',
        title: newTx.type === 'income' ? 'Entrada confirmada' : 'Despesa registrada',
        body: `"${newTx.description}" (${formattedAmount})`,
        ref_id: newTx.id,
        read: false,
        created_date: new Date().toISOString(),
      });

      sendDeviceNotification(
        newTx.type === 'income' ? 'Entrada confirmada' : 'Despesa registrada',
        `"${newTx.description}" (${formattedAmount})`
      );

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        accounts: updatedAccounts,
        activities: [newActivity, ...prev.activities],
        notifications: newNotifs,
      };
    });

    // Send to backend
    if (navigator.onLine) {
      try {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTx),
        });
      } catch (err) {
        console.warn('Network error, saving to outbox:', err);
        queueOutbox({
          id: 'ob_' + Date.now(),
          type: 'add_transaction',
          payload: newTx,
          timestamp: Date.now(),
        });
      }
    } else {
      queueOutbox({
        id: 'ob_' + Date.now(),
        type: 'add_transaction',
        payload: newTx,
        timestamp: Date.now(),
      });
    }

    return newTx;
  };

  const updateTransaction = async (updatedTx: Transaction) => {
    setDb(prev => {
      const idx = prev.transactions.findIndex(t => t.id === updatedTx.id);
      if (idx === -1) return prev;
      const nextTxs = [...prev.transactions];
      nextTxs[idx] = updatedTx;

      const newActivity = {
        id: 'act_' + Date.now(),
        wallet_id: updatedTx.wallet_id,
        user_id: activeUser.user_id,
        user_name: activeUser.name,
        user_avatar: activeUser.avatar_url,
        action: 'update' as const,
        entity_type: 'transaction' as const,
        description: `Editou lançamento "${updatedTx.description}"`,
        amount: updatedTx.amount,
        created_date: new Date().toISOString(),
      };

      return {
        ...prev,
        transactions: nextTxs,
        activities: [newActivity, ...prev.activities],
      };
    });

    // Sync full state to server
    try {
      await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db),
      });
    } catch (e) {
      console.warn('Offline update transaction:', e);
    }
  };

  const deleteTransaction = async (id: string) => {
    // 1. Optimistic UI update: remove immediately and record activity
    setDb(prev => {
      const tx = prev.transactions.find(t => t.id === id);
      if (!tx) return prev;

      const todayStr = new Date().toISOString().split('T')[0];
      const wasPendingIncome = tx.type === 'income' && (tx.status === 'pending' || tx.date > todayStr);

      // Adjust account balance if linked
      const updatedAccounts = prev.accounts.map(acc => {
        if (tx.account_id && acc.id === tx.account_id && tx.payment_method !== 'credito') {
          if (wasPendingIncome) {
            return acc;
          }
          return {
            ...acc,
            balance: tx.type === 'income' ? acc.balance - tx.amount : acc.balance + tx.amount,
          };
        }
        return acc;
      });

      const newActivity = {
        id: 'act_' + Date.now(),
        wallet_id: tx.wallet_id,
        user_id: activeUser.user_id,
        user_name: activeUser.name,
        user_avatar: activeUser.avatar_url,
        action: 'delete' as const,
        entity_type: 'transaction' as const,
        description: `Excluiu lançamento "${tx.description}"`,
        amount: tx.amount,
        created_date: new Date().toISOString(),
      };

      return {
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
        accounts: updatedAccounts,
        activities: [newActivity, ...prev.activities],
      };
    });

    // 2. Call server in background
    try {
      await fetch(`/api/transactions/${id}?user_id=${activeUser.user_id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Network error deleting transaction:', e);
    }
  };

  const payBill = async (billId: string, accountId: string) => {
    try {
      const res = await fetch('/api/bills/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill_id: billId,
          account_id: accountId,
          user_id: activeUser.user_id,
        }),
      });
      if (res.ok) {
        await fetchFromServer();
        return;
      }
    } catch {}

    // Fallback local execution
    setDb(prev => {
      const bill = prev.bills.find(b => b.id === billId);
      if (!bill) return prev;

      const updatedBills = prev.bills.map(b =>
        b.id === billId ? { ...b, status: 'paid' as const, paid_date: new Date().toISOString().split('T')[0], account_id: accountId } : b
      );

      const newTx: Transaction = {
        id: 'tx_bill_' + Date.now(),
        wallet_id: bill.wallet_id,
        type: bill.type === 'payable' ? 'expense' : 'income',
        nature: 'fixed',
        description: `Pagamento: ${bill.description}`,
        amount: bill.amount,
        date: new Date().toISOString().split('T')[0],
        category_id: bill.category_id,
        account_id: accountId,
        person_id: activeUser.user_id,
        privacy: bill.privacy,
        payment_method: 'boleto',
        bill_id: bill.id,
        created_date: new Date().toISOString(),
        created_by_id: activeUser.user_id,
      };

      const updatedAccounts = prev.accounts.map(acc => {
        if (acc.id === accountId) {
          return {
            ...acc,
            balance: bill.type === 'payable' ? acc.balance - bill.amount : acc.balance + bill.amount,
          };
        }
        return acc;
      });

      return {
        ...prev,
        bills: updatedBills,
        transactions: [newTx, ...prev.transactions],
        accounts: updatedAccounts,
      };
    });
  };

  const deleteBill = async (id: string) => {
    setDb(prev => ({
      ...prev,
      bills: prev.bills.filter(b => b.id !== id),
    }));

    try {
      await fetch(`/api/bills/${id}?user_id=${activeUser.user_id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Error deleting bill:', e);
    }
  };

  const addBill = async (billData: Partial<Bill>) => {
    const newBill: Bill = {
      id: 'bill_' + Date.now(),
      wallet_id: wallet?.id || 'wal_casa_01',
      type: billData.type || 'payable',
      description: billData.description || 'Conta',
      amount: Number(billData.amount) || 0,
      due_date: billData.due_date || new Date().toISOString().split('T')[0],
      category_id: billData.category_id || 'cat_outras_despesas',
      person_id: billData.person_id || activeUser.user_id,
      status: 'pending',
      privacy: billData.privacy || 'shared',
      recurring: billData.recurring || 'none',
      notes: billData.notes,
      created_date: new Date().toISOString(),
      created_by_id: activeUser.user_id,
    };

    setDb(prev => ({
      ...prev,
      bills: [newBill, ...prev.bills],
    }));

    try {
      await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBill),
      });
    } catch (e) {
      console.warn('Error saving bill to server:', e);
    }
  };

  const updateBill = async (bill: Bill) => {
    setDb(prev => ({
      ...prev,
      bills: prev.bills.map(b => (b.id === bill.id ? bill : b)),
    }));

    try {
      await fetch(`/api/bills/${bill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bill),
      });
    } catch (e) {
      console.warn('Error updating bill on server:', e);
    }
  };

  const addCreditCard = async (cardData: Partial<CreditCard>): Promise<CreditCard> => {
    const newCard: CreditCard = {
      id: 'card_' + Date.now(),
      wallet_id: wallet?.id || 'wal_casa_01',
      name: cardData.name || 'Novo Cartão',
      bank: cardData.bank || 'Nubank',
      brand: cardData.brand || 'Mastercard',
      limit: Number(cardData.limit) || 5000,
      closing_day: Number(cardData.closing_day) || 20,
      due_day: Number(cardData.due_day) || 27,
      color: cardData.color || '#4B0082',
      created_date: new Date().toISOString(),
      created_by_id: activeUser.user_id,
    };

    setDb(prev => ({
      ...prev,
      credit_cards: [...prev.credit_cards, newCard],
    }));

    try {
      await fetch('/api/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCard),
      });
    } catch (e) {
      console.warn('Error saving credit card to server:', e);
    }

    return newCard;
  };

  const updateCreditCard = async (card: CreditCard) => {
    setDb(prev => ({
      ...prev,
      credit_cards: prev.credit_cards.map(c => (c.id === card.id ? card : c)),
    }));

    try {
      await fetch(`/api/credit-cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });
    } catch (e) {
      console.warn('Error updating credit card on server:', e);
    }
  };

  const deleteCreditCard = async (id: string) => {
    setDb(prev => ({
      ...prev,
      credit_cards: prev.credit_cards.filter(c => c.id !== id),
      invoices: prev.invoices.filter(i => i.card_id !== id),
    }));

    try {
      await fetch(`/api/credit-cards/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Error deleting credit card on server:', e);
    }
  };

  const payInvoice = async (invoiceId: string, accountId: string, amount: number) => {
    setDb(prev => {
      const invoice = prev.invoices.find(i => i.id === invoiceId);
      const card = prev.credit_cards.find(c => c.id === invoice?.card_id);
      if (!invoice) return prev;

      const todayStr = new Date().toISOString().split('T')[0];
      const updatedInvoices = prev.invoices.map(i =>
        i.id === invoiceId ? { ...i, status: 'paid' as const, paid_date: todayStr, paid_amount: amount, account_id: accountId } : i
      );

      const newTx: Transaction = {
        id: 'tx_inv_' + Date.now(),
        wallet_id: invoice.wallet_id,
        type: 'expense',
        nature: 'variable',
        description: `Fatura ${card?.name || 'Cartão'} paga`,
        amount: amount,
        date: todayStr,
        category_id: 'cat_outras_despesas',
        account_id: accountId,
        person_id: activeUser.user_id,
        privacy: 'shared',
        payment_method: 'debito',
        created_date: new Date().toISOString(),
        created_by_id: activeUser.user_id,
      };

      const updatedAccounts = prev.accounts.map(acc => {
        if (acc.id === accountId) {
          return { ...acc, balance: acc.balance - amount };
        }
        return acc;
      });

      return {
        ...prev,
        invoices: updatedInvoices,
        transactions: [newTx, ...prev.transactions],
        accounts: updatedAccounts,
      };
    });
  };

  const addAccount = async (accData: Partial<Account>) => {
    const newAcc: Account = {
      id: 'acc_' + Date.now(),
      wallet_id: wallet?.id || 'wal_casa_01',
      name: accData.name || 'Nova Reserva',
      type: accData.type || 'reserve',
      balance: Number(accData.balance) || 0,
      color: accData.color || '#10b981',
      icon: accData.icon || 'ShieldCheck',
      is_reserve: accData.is_reserve ?? true,
      goal_target: accData.goal_target,
      created_date: new Date().toISOString(),
      created_by_id: activeUser.user_id,
    };

    setDb(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAcc],
    }));

    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAcc),
      });
    } catch (e) {
      console.warn('Error saving account to server:', e);
    }
  };

  const updateAccount = async (acc: Account) => {
    setDb(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === acc.id ? acc : a),
    }));

    try {
      await fetch(`/api/accounts/${acc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acc),
      });
    } catch (e) {
      console.warn('Error updating account on server:', e);
    }
  };

  const deleteAccount = async (id: string) => {
    setDb(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id),
    }));

    try {
      await fetch(`/api/accounts/${id}?user_id=${activeUser.user_id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Error deleting account on server:', e);
    }
  };

  const addTransfer = async (trData: Partial<Transfer>) => {
    const amount = Number(trData.amount) || 0;
    const newTr: Transfer = {
      id: 'tr_' + Date.now(),
      wallet_id: wallet?.id || 'wal_casa_01',
      kind: trData.kind || 'account',
      from_account_id: trData.from_account_id,
      to_account_id: trData.to_account_id,
      from_user_id: trData.from_user_id || activeUser.user_id,
      to_user_id: trData.to_user_id,
      amount,
      date: trData.date || new Date().toISOString().split('T')[0],
      description: trData.description || 'Transferência entre contas',
      created_date: new Date().toISOString(),
      created_by_id: activeUser.user_id,
    };

    setDb(prev => {
      const fromAcc = prev.accounts.find(a => a.id === newTr.from_account_id);
      const toAcc = prev.accounts.find(a => a.id === newTr.to_account_id);

      const updatedAccounts = prev.accounts.map(acc => {
        if (acc.id === newTr.from_account_id) return { ...acc, balance: acc.balance - amount };
        if (acc.id === newTr.to_account_id) return { ...acc, balance: acc.balance + amount };
        return acc;
      });

      const activity: any = {
        id: 'act_' + Date.now(),
        wallet_id: newTr.wallet_id,
        user_id: activeUser.user_id,
        user_name: activeUser.name,
        user_avatar: activeUser.avatar_url,
        action: 'create',
        entity_type: 'transfer',
        description: `Transferiu ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)} de "${fromAcc?.name || 'Origem'}" para "${toAcc?.name || 'Destino'}"`,
        amount,
        created_date: new Date().toISOString(),
      };

      return {
        ...prev,
        accounts: updatedAccounts,
        transfers: [newTr, ...prev.transfers],
        activities: [activity, ...prev.activities],
      };
    });

    try {
      await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTr),
      });
    } catch (e) {
      console.warn('Error saving transfer to server:', e);
    }
  };

  const addGoal = async (goalData: Partial<Goal>) => {
    const newGoal: Goal = {
      id: 'goal_' + Date.now(),
      wallet_id: wallet?.id || 'wal_casa_01',
      name: goalData.name || 'Nova Meta',
      target_amount: Number(goalData.target_amount) || 1000,
      current_amount: Number(goalData.current_amount) || 0,
      target_date: goalData.target_date || '2026-12-31',
      icon: goalData.icon || 'Target',
      privacy: goalData.privacy || 'shared',
      created_date: new Date().toISOString(),
      created_by_id: activeUser.user_id,
    };

    setDb(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
  };

  const updateGoal = async (goal: Goal) => {
    setDb(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === goal.id ? goal : g),
    }));
  };

  const updateBudget = async (budget: Budget) => {
    setDb(prev => {
      const exists = prev.budgets.some(b => b.category_id === budget.category_id && b.month === budget.month);
      if (exists) {
        return {
          ...prev,
          budgets: prev.budgets.map(b => (b.category_id === budget.category_id && b.month === budget.month ? budget : b)),
        };
      }
      return {
        ...prev,
        budgets: [...prev.budgets, budget],
      };
    });
  };

  const deleteBudget = async (categoryId: string, month: string) => {
    setDb(prev => ({
      ...prev,
      budgets: prev.budgets.filter(b => !(b.category_id === categoryId && b.month === month)),
    }));
  };

  const markNotificationRead = async (id: string) => {
    setDb(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));

    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {
      console.warn('Error saving notification read status:', e);
    }
  };

  const markAllNotificationsRead = async () => {
    setDb(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        (n.user_id === activeUser.user_id || !n.user_id) ? { ...n, read: true } : n
      ),
    }));

    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: activeUser.user_id }),
      });
    } catch (e) {
      console.warn('Error marking all notifications read:', e);
    }
  };

  const deleteNotification = async (id: string) => {
    setDb(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }));

    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Error deleting notification:', e);
    }
  };

  const clearAllNotifications = async () => {
    setDb(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.user_id !== activeUser.user_id && n.user_id),
    }));

    try {
      await fetch(`/api/notifications?user_id=${activeUser.user_id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Error clearing notifications:', e);
    }
  };

  const joinWalletWithCode = async (code: string) => {
    try {
      const res = await fetch('/api/invite/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: code,
          user: activeUser,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchFromServer();
        return { success: true, message: 'Você entrou na casa com sucesso!' };
      }
      return { success: false, message: data.error || 'Código inválido' };
    } catch (err: any) {
      return { success: false, message: 'Erro ao conectar: ' + err.message };
    }
  };

  const updateMemberProfile = async (
    userId: string,
    data: { name?: string; avatar_url?: string; email?: string }
  ) => {
    // Optimistic update
    setDb(prev => {
      const updatedWallets = prev.wallets.map(w => ({
        ...w,
        members: w.members.map(m => {
          if (m.user_id === userId) {
            return {
              ...m,
              ...(data.name ? { name: data.name.trim() } : {}),
              ...(data.avatar_url ? { avatar_url: data.avatar_url } : {}),
              ...(data.email ? { email: data.email.trim() } : {}),
            };
          }
          return m;
        }),
      }));

      const targetMember = updatedWallets[0]?.members.find(m => m.user_id === userId);
      const newActivity = {
        id: 'act_' + Date.now(),
        wallet_id: updatedWallets[0]?.id || 'wal_casa_01',
        user_id: userId,
        user_name: targetMember?.name || 'Membro',
        user_avatar: targetMember?.avatar_url || '',
        action: 'update' as const,
        entity_type: 'account' as const,
        description: `Atualizou os dados de perfil (${targetMember?.name || 'Membro'})`,
        created_date: new Date().toISOString(),
      };

      return {
        ...prev,
        wallets: updatedWallets,
        activities: [newActivity, ...prev.activities],
      };
    });

    try {
      await fetch(`/api/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Failed to sync member profile with server:', err);
    }
  };

  const updateWalletName = async (name: string) => {
    setDb(prev => ({
      ...prev,
      wallets: prev.wallets.map((w, idx) => (idx === 0 ? { ...w, name: name.trim() } : w)),
    }));

    try {
      await fetch('/api/wallet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    } catch (err) {
      console.error('Failed to sync wallet name:', err);
    }
  };

  const resetAllNumbers = async () => {
    setDb(prev => ({
      ...prev,
      accounts: prev.accounts.map(acc => ({ ...acc, balance: 0 })),
      transactions: [],
      card_purchases: [],
      bills: [],
      transfers: [],
      goals: prev.goals.map(g => ({ ...g, current_amount: 0 })),
      invoices: prev.invoices.map(inv => ({ ...inv, status: 'paid', paid_amount: 0 })),
      activities: [
        {
          id: 'act_' + Date.now(),
          wallet_id: prev.wallets[0]?.id || 'wal_casa_01',
          user_id: activeUser.user_id,
          user_name: activeUser.name,
          user_avatar: activeUser.avatar_url,
          action: 'delete' as const,
          entity_type: 'transaction' as const,
          description: 'Todos os números e lançamentos foram zerados',
          details: 'Saldo e histórico limpos',
          amount: 0,
          created_date: new Date().toISOString(),
        },
        ...prev.activities,
      ],
    }));

    localStorage.removeItem(LOCAL_STORAGE_OUTBOX_KEY);

    try {
      await fetch('/api/reset-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Failed to reset numbers on server:', err);
    }
  };

  const triggerManualSync = async () => {
    await fetchFromServer();
    await processOutbox();
  };

  return (
    <FinanceContext.Provider
      value={{
        db,
        summary,
        wallet,
        activeUser,
        partner,
        isOnline,
        isSyncing,
        hideValues,
        isLocked,
        securitySettings,
        unreadNotificationsCount,
        toggleHideValues,
        switchActiveUser,
        unlockApp,
        lockApp,
        updateSecuritySettings,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        payBill,
        payInvoice,
        addAccount,
        updateAccount,
        deleteAccount,
        deleteBill,
        addBill,
        updateBill,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        addTransfer,
        addGoal,
        updateGoal,
        updateBudget,
        deleteBudget,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,
        requestDeviceNotificationPermission,
        deviceNotificationPermission,
        joinWalletWithCode,
        updateMemberProfile,
        updateWalletName,
        resetAllNumbers,
        triggerManualSync,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
