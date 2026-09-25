import { AppDatabase, Transaction, Account } from '../types/finance';
import { getDaysLeftInMonth } from './formatters';

export interface FinanceSummary {
  currentBalance: number; // Saldo atual (date <= hoje)
  toPay: number;          // A pagar (bills pendentes + despesas futuras)
  toReceive: number;      // A receber (bills receivable pendentes + entradas futuras)
  committed: number;      // Comprometido (a pagar + faturas abertas)
  available: number;      // Disponível (saldo atual - comprometido)
  savedMoney: number;     // Dinheiro guardado (reservas)
  monthIncome: number;    // Entradas do mês atual
  monthExpense: number;   // Despesas do mês atual
  monthFixedExpense: number;
  monthVarExpense: number;
  dailyBudgetLeft: number;// Quanto posso gastar por dia
  daysLeftInMonth: number;
}

export function computeFinanceSummary(
  db: AppDatabase,
  activeUserId?: string
): FinanceSummary {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const currentMonthStr = `${yyyy}-${mm}`;

  // Filter transactions visible to active user (shared or authored by user)
  const visibleTransactions = db.transactions.filter(tx => {
    if (tx.privacy === 'individual') {
      return !activeUserId || tx.created_by_id === activeUserId || tx.person_id === activeUserId;
    }
    return true;
  });

  // Filter reserve account IDs so their internal transactions don't pollute operational monthly balance
  const reserveAccountIds = new Set(
    db.accounts.filter(a => a.is_reserve).map(a => a.id)
  );

  // 1. Saldo atual:
  // Soma das contas correntes/operacionais (não reservas)
  const checkingAccounts = db.accounts.filter(a => !a.is_reserve);
  const checkingAccountsBalance = checkingAccounts.reduce(
    (sum, a) => sum + (Number(a.balance) || 0),
    0
  );

  // Transações sem conta vinculada (ex: dinheiro vivo na carteira)
  // que não sejam cartão de crédito e já ocorreram (date <= todayStr) e NÃO estejam pendentes
  let unlinkedTransactionsBalance = 0;
  for (const tx of visibleTransactions) {
    if (!tx.account_id && tx.payment_method !== 'credito' && tx.date <= todayStr && tx.status !== 'pending') {
      if (tx.type === 'income') {
        unlinkedTransactionsBalance += tx.amount;
      } else {
        unlinkedTransactionsBalance -= tx.amount;
      }
    }
  }

  let currentBalance = checkingAccountsBalance + unlinkedTransactionsBalance;

  // 2. A pagar & A receber
  // A pagar = bills payable pendentes + despesas com date > hoje
  let toPay = 0;
  // A receber = bills receivable pendentes + entradas com date > hoje OU com status pending (a receber)
  let toReceive = 0;

  for (const bill of db.bills) {
    if (bill.status === 'pending') {
      if (bill.privacy === 'individual' && activeUserId && bill.created_by_id !== activeUserId && bill.person_id !== activeUserId) {
        continue;
      }
      if (bill.type === 'payable') {
        toPay += bill.amount;
      } else {
        toReceive += bill.amount;
      }
    }
  }

  for (const tx of visibleTransactions) {
    if (tx.account_id && reserveAccountIds.has(tx.account_id)) continue;
    if (tx.type === 'expense') {
      if (tx.date > todayStr) {
        toPay += tx.amount;
      }
    } else if (tx.type === 'income') {
      // Income that is pending or in the future is "A receber"
      if (tx.date > todayStr || tx.status === 'pending') {
        toReceive += tx.amount;
      }
    }
  }

  // 3. Faturas abertas do mês atual
  let openInvoicesAmount = 0;
  for (const inv of db.invoices) {
    if (inv.status === 'pending') {
      // Calculate pending invoice sum from purchases/credit transactions
      let invSum = 0;
      // Sum from card purchases
      for (const cp of db.card_purchases) {
        if (cp.card_id === inv.card_id) {
          // If installment, monthly share
          const monthlyPart = cp.amount / (cp.installments || 1);
          invSum += monthlyPart;
        }
      }
      // Also add any transactions with payment_method == 'credito' and card_id
      for (const tx of visibleTransactions) {
        if (tx.type === 'expense' && tx.payment_method === 'credito' && tx.card_id === inv.card_id && tx.date.startsWith(inv.month)) {
          invSum += tx.amount;
        }
      }
      openInvoicesAmount += invSum;
    }
  }

  // Comprometido = a pagar + faturas abertas
  const committed = toPay + openInvoicesAmount;

  // Disponível = saldo atual - comprometido
  const available = currentBalance - committed;

  // 4. Despesas e Entradas do mês atual
  let monthIncome = 0;
  let monthExpense = 0;
  let monthFixedExpense = 0;
  let monthVarExpense = 0;

  for (const tx of visibleTransactions) {
    if (tx.account_id && reserveAccountIds.has(tx.account_id)) continue;
    if (tx.date.startsWith(currentMonthStr)) {
      if (tx.type === 'income') {
        monthIncome += tx.amount;
      } else {
        monthExpense += tx.amount;
        if (tx.nature === 'fixed') {
          monthFixedExpense += tx.amount;
        } else {
          monthVarExpense += tx.amount;
        }
      }
    }
  }

  // 5. Dinheiro Guardado (Soma das contas de reserva)
  let savedMoney = 0;
  for (const acc of db.accounts) {
    if (acc.is_reserve) {
      savedMoney += calculateAccountRealBalance(acc, db);
    }
  }

  // 6. Quanto posso gastar por dia
  const daysLeftInMonth = getDaysLeftInMonth();
  const dailyBudgetLeft = available > 0 ? available / daysLeftInMonth : 0;

  return {
    currentBalance,
    toPay,
    toReceive,
    committed,
    available,
    savedMoney,
    monthIncome,
    monthExpense,
    monthFixedExpense,
    monthVarExpense,
    dailyBudgetLeft,
    daysLeftInMonth,
  };
}

export function calculateAccountRealBalance(acc: Account, _db?: AppDatabase): number {
  return Number(acc.balance) || 0;
}
