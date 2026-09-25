export type TransactionType = 'income' | 'expense';
export type ExpenseNature = 'fixed' | 'variable';
export type PrivacyType = 'shared' | 'individual';
export type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito' | 'boleto' | 'transferencia' | 'outro';
export type RecurrenceType = 'none' | 'monthly' | 'weekly' | 'yearly';
export type AccountType = 'checking' | 'savings' | 'cash' | 'digital' | 'reserve' | 'other';
export type BillType = 'payable' | 'receivable';
export type BillStatus = 'pending' | 'paid';
export type InvoiceStatus = 'pending' | 'paid' | 'closed';

export interface WalletMember {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string;
  color?: string;
}

export interface Wallet {
  id: string;
  name: string;
  members: WalletMember[];
  member_ids: string[];
  invite_code: string;
  created_date: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: TransactionType;
  nature?: ExpenseNature; // For expenses: 'fixed' or 'variable'
  status?: 'completed' | 'pending'; // 'pending' = A receber ou agendada
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category_id: string;
  account_id?: string;
  person_id: string; // User who spent/received
  privacy: PrivacyType;
  payment_method: PaymentMethod;
  recurring?: RecurrenceType;
  notes?: string;
  attachment_url?: string;
  installments?: number;
  installment_no?: number;
  installment_group_id?: string;
  card_id?: string;
  bill_id?: string;
  created_date: string;
  created_by_id: string;
}

export interface CardPurchase {
  id: string;
  wallet_id: string;
  card_id: string;
  description: string;
  amount: number;
  date: string;
  category_id: string;
  person_id: string;
  privacy: PrivacyType;
  installments: number;
  notes?: string;
  attachment_url?: string;
  created_date: string;
  created_by_id: string;
}

export interface CreditCard {
  id: string;
  wallet_id: string;
  name: string;
  bank: string;
  brand: string; // Visa, Mastercard, Elo, etc.
  limit: number;
  closing_day: number;
  due_day: number;
  color: string;
  created_date: string;
  created_by_id: string;
}

export interface Invoice {
  id: string;
  wallet_id: string;
  card_id: string;
  month: string; // YYYY-MM
  due_date: string;
  status: InvoiceStatus;
  paid_date?: string;
  paid_amount?: number;
  account_id?: string;
}

export interface Account {
  id: string;
  wallet_id: string;
  name: string;
  type: AccountType;
  balance: number; // initial balance
  color: string;
  icon?: string;
  is_reserve: boolean; // "Dinheiro guardado" - kept out of monthly balance
  goal_target?: number;
  created_date: string;
  created_by_id: string;
}

export interface Bill {
  id: string;
  wallet_id: string;
  type: BillType; // 'payable' (a pagar) or 'receivable' (a receber)
  description: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  category_id: string;
  person_id: string;
  account_id?: string;
  status: BillStatus;
  recurring?: RecurrenceType;
  notes?: string;
  paid_date?: string;
  privacy: PrivacyType;
  created_date: string;
  created_by_id: string;
}

export interface Category {
  id: string;
  wallet_id?: string; // null if default
  name: string;
  type: TransactionType;
  nature: ExpenseNature;
  icon: string;
  color: string;
  is_default: boolean;
}

export interface Goal {
  id: string;
  wallet_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  icon: string;
  privacy: PrivacyType;
  created_date: string;
  created_by_id: string;
}

export interface Budget {
  id: string;
  wallet_id: string;
  category_id: string;
  month: string; // YYYY-MM
  limit_amount: number;
  created_date: string;
  created_by_id: string;
}

export interface Transfer {
  id: string;
  wallet_id: string;
  kind: 'account' | 'user';
  from_account_id?: string;
  to_account_id?: string;
  from_user_id?: string;
  to_user_id?: string;
  amount: number;
  date: string;
  description: string;
  created_date: string;
  created_by_id: string;
}

export interface AppNotification {
  id: string;
  wallet_id: string;
  user_id: string; // target user
  type: 'movement_new' | 'movement_edited' | 'movement_deleted' | 'bill_due' | 'bill_overdue' | 'invoice_due' | 'budget_alert' | 'goal_progress';
  title: string;
  body: string;
  ref_id?: string;
  read: boolean;
  created_date: string;
}

export interface ActivityLog {
  id: string;
  wallet_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  action: 'create' | 'update' | 'delete' | 'pay';
  entity_type: 'transaction' | 'bill' | 'card_purchase' | 'transfer' | 'account' | 'goal' | 'budget';
  description: string;
  details?: string;
  amount?: number;
  created_date: string;
}

export interface UserSecuritySettings {
  pin_enabled: boolean;
  pin_code?: string;
  biometrics_enabled: boolean;
  auto_lock_minutes: number;
}

export interface AppDatabase {
  wallets: Wallet[];
  transactions: Transaction[];
  card_purchases: CardPurchase[];
  credit_cards: CreditCard[];
  invoices: Invoice[];
  accounts: Account[];
  bills: Bill[];
  categories: Category[];
  goals: Goal[];
  budgets: Budget[];
  transfers: Transfer[];
  notifications: AppNotification[];
  activities: ActivityLog[];
}
