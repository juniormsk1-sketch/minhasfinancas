import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { getInitialDatabase } from './src/data/initialData.ts';
import { AppDatabase, Transaction, ActivityLog, AppNotification, Account, Transfer, CreditCard, Bill } from './src/types/finance.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Initialize Gemini SDK on server only
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// SSE clients for real-time couple sync
const sseClients = new Set<Response>();

function broadcastUpdate(type: string, data?: any) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Database helper
function getDatabase(): AppDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading DB_FILE, fallback to initial:', err);
  }

  const initial = getInitialDatabase();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: AppDatabase): void {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB_FILE:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '20mb' }));

  // Real-time SSE endpoint
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Database GET endpoint
  app.get('/api/database', (_req: Request, res: Response) => {
    const db = getDatabase();
    res.json(db);
  });

  // Database full sync/save endpoint
  app.post('/api/database', (req: Request, res: Response) => {
    const newDb = req.body as AppDatabase;
    if (newDb && newDb.wallets) {
      saveDatabase(newDb);
      broadcastUpdate('SYNC_FULL', { timestamp: Date.now() });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid database payload' });
    }
  });

  // Add transaction endpoint with couple notifications & activity log
  app.post('/api/transactions', (req: Request, res: Response) => {
    const db = getDatabase();
    const tx = req.body as Transaction;
    if (!tx || !tx.description || tx.amount == null) {
      return res.status(400).json({ error: 'Invalid transaction data' });
    }

    if (!tx.id) tx.id = 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    if (!tx.created_date) tx.created_date = new Date().toISOString();

    db.transactions.unshift(tx);

    // If account was specified, deduct/add balance if not credit card and not pending/future income
    const todayStr = new Date().toISOString().split('T')[0];
    const isPendingIncome = tx.type === 'income' && (tx.status === 'pending' || tx.date > todayStr);

    if (tx.account_id && tx.payment_method !== 'credito' && !isPendingIncome) {
      const acc = db.accounts.find(a => a.id === tx.account_id);
      if (acc) {
        if (tx.type === 'income') {
          acc.balance += tx.amount;
        } else {
          acc.balance -= tx.amount;
        }
      }
    }

    // Identify user name
    const wallet = db.wallets.find(w => w.id === tx.wallet_id) || db.wallets[0];
    const author = wallet?.members.find(m => m.user_id === tx.person_id) || {
      name: 'Parceiro(a)',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };

    // Activity log entry
    const activity: ActivityLog = {
      id: 'act_' + Date.now(),
      wallet_id: tx.wallet_id,
      user_id: tx.person_id,
      user_name: author.name,
      user_avatar: author.avatar_url,
      action: 'create',
      entity_type: 'transaction',
      description: `Registrou ${tx.type === 'income' ? 'entrada' : 'despesa'} "${tx.description}"`,
      details: tx.payment_method ? `Via ${tx.payment_method.toUpperCase()}` : undefined,
      amount: tx.amount,
      created_date: new Date().toISOString(),
    };
    db.activities.unshift(activity);

    // Notify members of the wallet
    if (wallet) {
      const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount);
      const otherMembers = wallet.members.filter(m => m.user_id !== tx.person_id);

      // 1. Notify partner if shared
      if (tx.privacy === 'shared') {
        for (const partner of otherMembers) {
          const notif: AppNotification = {
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
            wallet_id: tx.wallet_id,
            user_id: partner.user_id,
            type: 'movement_new',
            title: `${author.name} registrou um movimento`,
            body: `"${tx.description}" (${formattedAmount})`,
            ref_id: tx.id,
            read: false,
            created_date: new Date().toISOString(),
          };
          db.notifications.unshift(notif);
        }
      }

      // 2. Notification/confirmation for author
      const authorNotif: AppNotification = {
        id: 'notif_me_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
        wallet_id: tx.wallet_id,
        user_id: tx.person_id,
        type: 'movement_new',
        title: tx.type === 'income' ? 'Entrada confirmada' : 'Despesa registrada',
        body: `"${tx.description}" no valor de ${formattedAmount}`,
        ref_id: tx.id,
        read: false,
        created_date: new Date().toISOString(),
      };
      db.notifications.unshift(authorNotif);
    }

    saveDatabase(db);
    broadcastUpdate('TRANSACTION_CREATED', tx);
    res.json({ success: true, transaction: tx });
  });

  // Mark single notification as read
  app.post('/api/notifications/read', (req: Request, res: Response) => {
    const { id } = req.body;
    const db = getDatabase();
    const notif = db.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      saveDatabase(db);
    }
    res.json({ success: true, id });
  });

  // Mark all notifications as read for a user
  app.post('/api/notifications/read-all', (req: Request, res: Response) => {
    const { user_id } = req.body;
    const db = getDatabase();
    for (const notif of db.notifications) {
      if (!user_id || notif.user_id === user_id) {
        notif.read = true;
      }
    }
    saveDatabase(db);
    res.json({ success: true });
  });

  // Delete single notification
  app.delete('/api/notifications/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = getDatabase();
    db.notifications = db.notifications.filter(n => n.id !== id);
    saveDatabase(db);
    res.json({ success: true, id });
  });

  // Clear all notifications
  app.delete('/api/notifications', (req: Request, res: Response) => {
    const { user_id } = req.query;
    const db = getDatabase();
    if (user_id) {
      db.notifications = db.notifications.filter(n => n.user_id !== user_id);
    } else {
      db.notifications = [];
    }
    saveDatabase(db);
    res.json({ success: true });
  });

  // Delete transaction endpoint
  app.delete('/api/transactions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id } = req.query;
    const db = getDatabase();
    const txIndex = db.transactions.findIndex(t => t.id === id);

    if (txIndex === -1) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    const tx = db.transactions[txIndex];
    db.transactions.splice(txIndex, 1);

    // If account was linked, adjust balance back (only if it was not pending income)
    const todayStr = new Date().toISOString().split('T')[0];
    const wasPendingIncome = tx.type === 'income' && (tx.status === 'pending' || tx.date > todayStr);

    if (tx.account_id && tx.payment_method !== 'credito' && !wasPendingIncome) {
      const acc = db.accounts.find(a => a.id === tx.account_id);
      if (acc) {
        if (tx.type === 'income') acc.balance -= tx.amount;
        else acc.balance += tx.amount;
      }
    }

    const currentUserId = (user_id as string) || tx.person_id;
    const wallet = db.wallets.find(w => w.id === tx.wallet_id) || db.wallets[0];
    const author = wallet?.members.find(m => m.user_id === currentUserId) || {
      name: 'Membro da Casa',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };

    // Log deletion activity
    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: tx.wallet_id,
      user_id: currentUserId,
      user_name: author.name,
      user_avatar: author.avatar_url,
      action: 'delete',
      entity_type: 'transaction',
      description: `Excluiu lançamento "${tx.description}"`,
      amount: tx.amount,
      created_date: new Date().toISOString(),
    });

    // Notify other member if shared
    if (tx.privacy === 'shared' && wallet) {
      const otherMembers = wallet.members.filter(m => m.user_id !== currentUserId);
      for (const partner of otherMembers) {
        db.notifications.unshift({
          id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
          wallet_id: tx.wallet_id,
          user_id: partner.user_id,
          type: 'movement_deleted',
          title: `${author.name} excluiu um movimento`,
          body: `"${tx.description}" foi removido do extrato.`,
          ref_id: tx.id,
          read: false,
          created_date: new Date().toISOString(),
        });
      }
    }

    saveDatabase(db);
    broadcastUpdate('TRANSACTION_DELETED', { id, description: tx.description });
    res.json({ success: true, id });
  });

  // Update transaction endpoint
  app.put('/api/transactions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = req.body as Transaction;
    const db = getDatabase();
    const idx = db.transactions.findIndex(t => t.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    db.transactions[idx] = { ...db.transactions[idx], ...updated };

    const wallet = db.wallets.find(w => w.id === updated.wallet_id) || db.wallets[0];
    const author = wallet?.members.find(m => m.user_id === updated.person_id) || { name: 'Membro da Casa' };

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: updated.wallet_id,
      user_id: updated.person_id,
      user_name: author.name,
      user_avatar: '',
      action: 'update',
      entity_type: 'transaction',
      description: `Editou lançamento "${updated.description}"`,
      amount: updated.amount,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('TRANSACTION_UPDATED', db.transactions[idx]);
    res.json({ success: true, transaction: db.transactions[idx] });
  });

  // Account creation endpoint
  app.post('/api/accounts', (req: Request, res: Response) => {
    const db = getDatabase();
    const acc = req.body as Account;
    if (!acc.id) acc.id = 'acc_' + Date.now();
    if (!acc.created_date) acc.created_date = new Date().toISOString();

    db.accounts.push(acc);

    const wallet = db.wallets.find(w => w.id === acc.wallet_id) || db.wallets[0];
    const author = wallet?.members.find(m => m.user_id === acc.created_by_id) || { name: 'Membro' };

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: acc.wallet_id,
      user_id: acc.created_by_id,
      user_name: author.name,
      user_avatar: '',
      action: 'create',
      entity_type: 'account',
      description: `Criou reserva "${acc.name}"`,
      amount: acc.balance,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('ACCOUNT_CREATED', acc);
    res.json({ success: true, account: acc });
  });

  // Account update endpoint
  app.put('/api/accounts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = getDatabase();
    const idx = db.accounts.findIndex(a => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Conta/Reserva não encontrada' });
    }

    db.accounts[idx] = { ...db.accounts[idx], ...req.body };
    saveDatabase(db);
    broadcastUpdate('ACCOUNT_UPDATED', db.accounts[idx]);
    res.json({ success: true, account: db.accounts[idx] });
  });

  // Account delete endpoint
  app.delete('/api/accounts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id } = req.query;
    const db = getDatabase();
    const idx = db.accounts.findIndex(a => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Conta/Reserva não encontrada' });
    }

    const acc = db.accounts[idx];
    db.accounts.splice(idx, 1);

    const currentUserId = (user_id as string) || acc.created_by_id;
    const wallet = db.wallets.find(w => w.id === acc.wallet_id) || db.wallets[0];
    const author = wallet?.members.find(m => m.user_id === currentUserId) || { name: 'Membro' };

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: acc.wallet_id,
      user_id: currentUserId,
      user_name: author.name,
      user_avatar: '',
      action: 'delete',
      entity_type: 'account',
      description: `Excluiu reserva "${acc.name}"`,
      amount: acc.balance,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('ACCOUNT_DELETED', { id, name: acc.name });
    res.json({ success: true, id });
  });

  // Credit Card Creation endpoint
  app.post('/api/credit-cards', (req: Request, res: Response) => {
    const db = getDatabase();
    const card = req.body as CreditCard;
    if (!card.id) card.id = 'card_' + Date.now();
    if (!card.created_date) card.created_date = new Date().toISOString();

    db.credit_cards.push(card);

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: card.wallet_id || db.wallets[0]?.id || 'wal_casa_01',
      user_id: card.created_by_id || 'system',
      user_name: 'Membro da Casa',
      user_avatar: '',
      action: 'create',
      entity_type: 'account',
      description: `Adicionou cartão de crédito "${card.name}"`,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('CREDIT_CARD_CREATED', card);
    res.json({ success: true, card });
  });

  // Credit Card Update endpoint
  app.put('/api/credit-cards/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = getDatabase();
    const idx = db.credit_cards.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    db.credit_cards[idx] = { ...db.credit_cards[idx], ...req.body };

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: db.credit_cards[idx].wallet_id || db.wallets[0]?.id || 'wal_casa_01',
      user_id: 'system',
      user_name: 'Membro da Casa',
      user_avatar: '',
      action: 'update',
      entity_type: 'account',
      description: `Atualizou dados do cartão "${db.credit_cards[idx].name}"`,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('CREDIT_CARD_UPDATED', db.credit_cards[idx]);
    res.json({ success: true, card: db.credit_cards[idx] });
  });

  // Credit Card Delete endpoint
  app.delete('/api/credit-cards/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = getDatabase();
    const idx = db.credit_cards.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const card = db.credit_cards[idx];
    db.credit_cards.splice(idx, 1);

    // Remove or unlink pending invoices for this card
    db.invoices = db.invoices.filter(inv => inv.card_id !== id);

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: card.wallet_id || db.wallets[0]?.id || 'wal_casa_01',
      user_id: 'system',
      user_name: 'Membro da Casa',
      user_avatar: '',
      action: 'delete',
      entity_type: 'account',
      description: `Excluiu cartão "${card.name}"`,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('CREDIT_CARD_DELETED', { id, name: card.name });
    res.json({ success: true, id });
  });

  // Transfer endpoint (between accounts/reserves or between users)
  app.post('/api/transfers', (req: Request, res: Response) => {
    const db = getDatabase();
    const transfer = req.body as Transfer;
    if (!transfer.id) transfer.id = 'tr_' + Date.now();
    if (!transfer.date) transfer.date = new Date().toISOString().split('T')[0];

    db.transfers.unshift(transfer);

    // If between accounts, adjust balances
    if (transfer.from_account_id && transfer.to_account_id) {
      const fromAcc = db.accounts.find(a => a.id === transfer.from_account_id);
      const toAcc = db.accounts.find(a => a.id === transfer.to_account_id);
      if (fromAcc) fromAcc.balance -= transfer.amount;
      if (toAcc) toAcc.balance += transfer.amount;
    }

    const wallet = db.wallets.find(w => w.id === transfer.wallet_id) || db.wallets[0];
    const author = wallet?.members.find(m => m.user_id === transfer.from_user_id) || { name: 'Membro' };

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: transfer.wallet_id,
      user_id: transfer.from_user_id || 'system',
      user_name: author.name,
      user_avatar: '',
      action: 'create',
      entity_type: 'transfer',
      description: `Transferência: ${transfer.description || 'Movimentação'}`,
      amount: transfer.amount,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('TRANSFER_CREATED', transfer);
    res.json({ success: true, transfer });
  });

  // Delete bill endpoint
  app.delete('/api/bills/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id } = req.query;
    const db = getDatabase();
    const idx = db.bills.findIndex(b => b.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    const bill = db.bills[idx];
    db.bills.splice(idx, 1);

    const currentUserId = (user_id as string) || bill.person_id;
    const wallet = db.wallets.find(w => w.id === bill.wallet_id) || db.wallets[0];
    const author = wallet?.members.find(m => m.user_id === currentUserId) || { name: 'Membro' };

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: bill.wallet_id,
      user_id: currentUserId,
      user_name: author.name,
      user_avatar: '',
      action: 'delete',
      entity_type: 'bill',
      description: `Excluiu conta "${bill.description}"`,
      amount: bill.amount,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('BILL_DELETED', { id, description: bill.description });
    res.json({ success: true, id });
  });

  // Bill Creation endpoint
  app.post('/api/bills', (req: Request, res: Response) => {
    const db = getDatabase();
    const bill = req.body as Bill;
    if (!bill.id) bill.id = 'bill_' + Date.now();
    if (!bill.created_date) bill.created_date = new Date().toISOString();

    db.bills.push(bill);

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: bill.wallet_id || db.wallets[0]?.id || 'wal_casa_01',
      user_id: bill.person_id || 'system',
      user_name: 'Membro da Casa',
      user_avatar: '',
      action: 'create',
      entity_type: 'bill',
      description: `Agendou conta "${bill.description}"`,
      amount: bill.amount,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('BILL_CREATED', bill);
    res.json({ success: true, bill });
  });

  // Bill Update endpoint
  app.put('/api/bills/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = getDatabase();
    const idx = db.bills.findIndex(b => b.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    db.bills[idx] = { ...db.bills[idx], ...req.body };

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: db.bills[idx].wallet_id || db.wallets[0]?.id || 'wal_casa_01',
      user_id: db.bills[idx].person_id || 'system',
      user_name: 'Membro da Casa',
      user_avatar: '',
      action: 'update',
      entity_type: 'bill',
      description: `Editou conta "${db.bills[idx].description}"`,
      amount: db.bills[idx].amount,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('BILL_UPDATED', db.bills[idx]);
    res.json({ success: true, bill: db.bills[idx] });
  });


  // Mark bill as paid
  app.post('/api/bills/pay', (req: Request, res: Response) => {
    const { bill_id, account_id, user_id, paid_date } = req.body;
    const db = getDatabase();
    const bill = db.bills.find(b => b.id === bill_id);
    if (!bill) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    bill.status = 'paid';
    bill.paid_date = paid_date || new Date().toISOString().split('T')[0];
    bill.account_id = account_id || bill.account_id;

    // Generate linked transaction
    const newTx: Transaction = {
      id: 'tx_bill_' + Date.now(),
      wallet_id: bill.wallet_id,
      type: bill.type === 'payable' ? 'expense' : 'income',
      nature: 'fixed',
      description: `Pagamento: ${bill.description}`,
      amount: bill.amount,
      date: bill.paid_date || new Date().toISOString().split('T')[0],
      category_id: bill.category_id,
      account_id: bill.account_id,
      person_id: user_id || bill.person_id,
      privacy: bill.privacy || 'shared',
      payment_method: 'boleto',
      bill_id: bill.id,
      created_date: new Date().toISOString(),
      created_by_id: user_id || bill.person_id,
    };
    db.transactions.unshift(newTx);

    // Update account balance
    if (bill.account_id) {
      const acc = db.accounts.find(a => a.id === bill.account_id);
      if (acc) {
        if (bill.type === 'payable') acc.balance -= bill.amount;
        else acc.balance += bill.amount;
      }
    }

    // Activity
    const wallet = db.wallets.find(w => w.id === bill.wallet_id);
    const author = wallet?.members.find(m => m.user_id === user_id) || { name: 'Membro' };
    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: bill.wallet_id,
      user_id: user_id || bill.person_id,
      user_name: author.name,
      user_avatar: '',
      action: 'pay',
      entity_type: 'bill',
      description: `Marcou "${bill.description}" como paga`,
      amount: bill.amount,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('BILL_PAID', { bill_id, transaction: newTx });
    res.json({ success: true, bill, transaction: newTx });
  });

  // Join wallet by 6-char code
  app.post('/api/invite/join', (req: Request, res: Response) => {
    const { invite_code, user } = req.body;
    if (!invite_code || !user) {
      return res.status(400).json({ error: 'Código ou dados de usuário faltando' });
    }

    const db = getDatabase();
    const wallet = db.wallets.find(
      w => w.invite_code.toUpperCase() === invite_code.trim().toUpperCase()
    );

    if (!wallet) {
      return res.status(404).json({ error: 'Código de convite inválido ou não encontrado' });
    }

    const alreadyMember = wallet.members.some(m => m.user_id === user.user_id || m.email === user.email);
    if (!alreadyMember) {
      wallet.members.push({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        color: '#8b5cf6',
      });
      wallet.member_ids.push(user.user_id);

      db.activities.unshift({
        id: 'act_' + Date.now(),
        wallet_id: wallet.id,
        user_id: user.user_id,
        user_name: user.name,
        user_avatar: user.avatar_url || '',
        action: 'create',
        entity_type: 'account',
        description: `${user.name} entrou na casa compartilhada! 🎉`,
        created_date: new Date().toISOString(),
      });

      saveDatabase(db);
      broadcastUpdate('WALLET_JOINED', { wallet_id: wallet.id, user });
    }

    res.json({ success: true, wallet });
  });

  // Update member profile (name, avatar_url, etc.)
  app.put('/api/members/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, avatar_url, email, color } = req.body;
    const db = getDatabase();

    let updatedMember = null;
    for (const wallet of db.wallets) {
      const member = wallet.members.find(m => m.user_id === id);
      if (member) {
        if (name) member.name = name.trim();
        if (avatar_url) member.avatar_url = avatar_url;
        if (email) member.email = email.trim();
        if (color) member.color = color;
        updatedMember = member;
      }
    }

    if (!updatedMember) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: db.wallets[0]?.id || 'wal_casa_01',
      user_id: id,
      user_name: updatedMember.name,
      user_avatar: updatedMember.avatar_url,
      action: 'update',
      entity_type: 'account',
      description: `Atualizou o perfil (${updatedMember.name})`,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('MEMBER_UPDATED', updatedMember);
    res.json({ success: true, member: updatedMember });
  });

  // Update wallet name
  app.put('/api/wallet', (req: Request, res: Response) => {
    const { name } = req.body;
    const db = getDatabase();
    if (db.wallets[0] && name) {
      db.wallets[0].name = name.trim();
      saveDatabase(db);
      broadcastUpdate('WALLET_UPDATED', db.wallets[0]);
      return res.json({ success: true, wallet: db.wallets[0] });
    }
    res.status(400).json({ error: 'Nome de casa inválido' });
  });

  // Reset all numbers in app
  app.post('/api/reset-numbers', (req: Request, res: Response) => {
    const db = getDatabase();
    
    // Zero account balances
    db.accounts = db.accounts.map(acc => ({
      ...acc,
      balance: 0,
    }));

    // Zero transactions, purchases, bills, transfers
    db.transactions = [];
    db.card_purchases = [];
    db.bills = [];
    db.transfers = [];

    // Zero goals current amounts
    db.goals = db.goals.map(g => ({
      ...g,
      current_amount: 0,
    }));

    // Invoices paid with 0
    db.invoices = db.invoices.map(inv => ({
      ...inv,
      status: 'paid',
      paid_amount: 0,
    }));

    db.activities.unshift({
      id: 'act_' + Date.now(),
      wallet_id: db.wallets[0]?.id || 'wal_casa_01',
      user_id: 'system',
      user_name: 'Minha Finance',
      user_avatar: '',
      action: 'delete',
      entity_type: 'transaction',
      description: 'Todos os números e lançamentos foram zerados',
      details: 'Reinício limpo de controle financeiro',
      amount: 0,
      created_date: new Date().toISOString(),
    });

    saveDatabase(db);
    broadcastUpdate('SYNC_FULL', { timestamp: Date.now() });
    res.json({ success: true, db });
  });

  // AI Receipt Extractor Endpoint using Gemini 3.8 Flash
  app.post('/api/extract-receipt', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Nenhuma imagem de comprovante fornecida' });
      }

      // Clean base64 header if included
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const validMime = mimeType || 'image/jpeg';

      const promptText = `Você é um assistente financeiro especialista em leitura de comprovantes e recibos de pagamento no Brasil.
Analise a imagem deste recibo/comprovante (pode ser PIX, cupom fiscal de supermercado, maquininha de cartão, boleto ou comprovante bancário).
Extraia os dados precisos em formato JSON:
- description: nome do estabelecimento ou beneficiário (ex: "Supermercado Pão de Açúcar", "Posto Ipiranga", "Dra. Maria Clara", "Restaurante Sabor da Vila"). Curto e claro.
- amount: valor total da compra em número decimal (ex: 145.80). Apenas número positivo.
- date: data da transação no formato ISO YYYY-MM-DD. Se o ano não estiver explícito, use 2026. Se não encontrar data, retorne a data atual de 2026-09-25.
- is_income: boolean (false para despesas/compras, true se for comprovante de transferência recebida/salário).
- category_suggestion: nome de uma das seguintes categorias que melhor se encaixe: "Supermercado & Feira", "Restaurante & Delivery", "Combustível & Manutenção", "Farmácia & Cuidados", "Uber & Transporte Público", "Lazer & Passeios", "Energia Elétrica", "Internet & Telefonia", "Outras Despesas".
- payment_method_suggestion: forma de pagamento ("pix", "debito", "credito", "dinheiro", "boleto").`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: validMime,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING, description: 'Nome do estabelecimento ou beneficiário' },
              amount: { type: Type.NUMBER, description: 'Valor total em número' },
              date: { type: Type.STRING, description: 'Data no formato YYYY-MM-DD' },
              is_income: { type: Type.BOOLEAN, description: 'Verdadeiro se for entrada, falso se despesa' },
              category_suggestion: { type: Type.STRING, description: 'Categoria sugerida' },
              payment_method_suggestion: { type: Type.STRING, description: 'Forma de pagamento sugerida' },
            },
            required: ['description', 'amount', 'date', 'is_income'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Sem resposta do modelo Gemini');
      }

      const parsed = JSON.parse(text);
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Erro na extração de comprovante por IA:', err);
      res.status(500).json({
        error: 'Não foi possível ler o comprovante automaticamente. Por favor preencha manualmente.',
        details: err?.message,
      });
    }
  });

  // Setup Vite in Dev or static in Prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Minha Finance Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
