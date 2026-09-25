import React, { useState } from 'react';
import {
  CreditCard as CreditCardIcon,
  Trash2,
  Edit2,
  Plus,
  X,
  Check,
  Loader2,
  Sparkles,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  Building,
  CheckCircle2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatBRL, formatDatePT } from '../utils/formatters';
import { Transaction, CreditCard } from '../types/finance';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

const CARD_COLORS = [
  '#4B0082', // Indigo Nubank Ultra
  '#820AD1', // Purple Nubank
  '#E65100', // Orange Itaú
  '#003399', // Blue Bradesco / BB
  '#000000', // Black
  '#10B981', // Emerald C6/Sicredi
  '#B91C1C', // Red Santander
  '#D97706', // Gold / Amber
  '#2563EB', // Sapphire Blue
  '#059669', // Teal
];

const CARD_BRANDS = [
  'Mastercard Black',
  'Visa Infinite',
  'Mastercard Platinum',
  'Visa Platinum',
  'Elo Nanquim',
  'American Express',
  'Mastercard Gold',
  'Visa Gold'
];

export const CartoesView: React.FC = () => {
  const {
    db,
    activeUser,
    hideValues,
    payInvoice,
    deleteTransaction,
    addTransaction,
    updateTransaction,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
  } = useFinance();

  const [selectedCardId, setSelectedCardId] = useState<string>(db.credit_cards[0]?.id || '');

  // Modals state
  const [isPayInvoiceModalOpen, setIsPayInvoiceModalOpen] = useState(false);
  const [payAccountId, setPayAccountId] = useState(db.accounts[0]?.id || '');
  const [isPaying, setIsPaying] = useState(false);

  // Card form modal state (Add or Edit)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardModalMode, setCardModalMode] = useState<'create' | 'edit'>('create');
  const [cardName, setCardName] = useState('');
  const [cardBank, setCardBank] = useState('');
  const [cardBrand, setCardBrand] = useState('Mastercard Black');
  const [cardLimitStr, setCardLimitStr] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState(20);
  const [cardDueDay, setCardDueDay] = useState(27);
  const [cardColor, setCardColor] = useState('#4B0082');
  const [isSavingCard, setIsSavingCard] = useState(false);

  // Card Deletion modal state
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  const [isDeletingCard, setIsDeletingCard] = useState(false);

  // Purchase form modal state (Add or Edit)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseModalMode, setPurchaseModalMode] = useState<'create' | 'edit'>('create');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [purchaseTargetCardId, setPurchaseTargetCardId] = useState<string>('');
  const [purchaseDesc, setPurchaseDesc] = useState('');
  const [purchaseAmountStr, setPurchaseAmountStr] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseCategory, setPurchaseCategory] = useState(db.categories[0]?.id || 'cat_mercado');
  const [purchaseInstallments, setPurchaseInstallments] = useState(1);
  const [purchasePersonId, setPurchasePersonId] = useState<string>(activeUser.user_id);
  const [isSavingPurchase, setIsSavingPurchase] = useState(false);

  // Purchase Deletion modal state
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  const selectedCard = db.credit_cards.find(c => c.id === selectedCardId) || db.credit_cards[0];
  const checkingAccounts = db.accounts.filter(a => !a.is_reserve);

  // Purchases on this selected card
  const cardPurchases = db.transactions.filter(
    t => t.payment_method === 'credito' && t.card_id === selectedCard?.id
  );

  const totalCardSpent = cardPurchases.reduce((acc, t) => acc + t.amount, 0);

  // Invoices for this card
  const invoices = db.invoices.filter(i => i.card_id === selectedCard?.id);
  const currentInvoice = invoices.find(i => i.status === 'pending');

  // Open Create Card Modal
  const handleOpenCreateCard = () => {
    setCardModalMode('create');
    setCardName('');
    setCardBank('Nubank');
    setCardBrand('Mastercard Black');
    setCardLimitStr('5000,00');
    setCardClosingDay(20);
    setCardDueDay(27);
    setCardColor('#820AD1');
    setIsCardModalOpen(true);
  };

  // Open Edit Card Modal
  const handleOpenEditCard = (card: CreditCard) => {
    setCardModalMode('edit');
    setCardName(card.name);
    setCardBank(card.bank);
    setCardBrand(card.brand);
    setCardLimitStr(card.limit.toFixed(2).replace('.', ','));
    setCardClosingDay(card.closing_day);
    setCardDueDay(card.due_day);
    setCardColor(card.color);
    setIsCardModalOpen(true);
  };

  // Save Card (Create or Edit)
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;

    setIsSavingCard(true);
    const cleanLimit = parseFloat(cardLimitStr.replace(/\./g, '').replace(',', '.')) || 5000;

    try {
      if (cardModalMode === 'create') {
        const created = await addCreditCard({
          name: cardName.trim(),
          bank: cardBank.trim() || 'Banco',
          brand: cardBrand,
          limit: cleanLimit,
          closing_day: Number(cardClosingDay) || 20,
          due_day: Number(cardDueDay) || 27,
          color: cardColor,
        });
        setSelectedCardId(created.id);
      } else if (selectedCard) {
        await updateCreditCard({
          ...selectedCard,
          name: cardName.trim(),
          bank: cardBank.trim(),
          brand: cardBrand,
          limit: cleanLimit,
          closing_day: Number(cardClosingDay) || 20,
          due_day: Number(cardDueDay) || 27,
          color: cardColor,
        });
      }
      setIsCardModalOpen(false);
    } finally {
      setIsSavingCard(false);
    }
  };

  // Confirm Delete Card
  const handleConfirmDeleteCard = async () => {
    if (!cardToDelete) return;
    setIsDeletingCard(true);
    try {
      await deleteCreditCard(cardToDelete.id);
      setCardToDelete(null);
      // Select another card if available
      const remaining = db.credit_cards.filter(c => c.id !== cardToDelete.id);
      if (remaining.length > 0) {
        setSelectedCardId(remaining[0].id);
      }
    } finally {
      setIsDeletingCard(false);
    }
  };

  // Open Create Purchase Modal
  const handleOpenCreatePurchase = (targetCardId?: string) => {
    const cardId = targetCardId || selectedCard?.id || db.credit_cards[0]?.id;
    setPurchaseTargetCardId(cardId || '');
    setPurchaseModalMode('create');
    setEditingTx(null);
    setPurchaseDesc('');
    setPurchaseAmountStr('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchaseCategory(db.categories[0]?.id || 'cat_mercado');
    setPurchaseInstallments(1);
    setPurchasePersonId(activeUser.user_id);
    setIsPurchaseModalOpen(true);
  };

  // Open Edit Purchase Modal
  const handleOpenEditPurchase = (t: Transaction) => {
    setPurchaseModalMode('edit');
    setEditingTx(t);
    setPurchaseTargetCardId(t.card_id || selectedCard?.id || '');
    setPurchaseDesc(t.description);
    setPurchaseAmountStr(t.amount.toFixed(2).replace('.', ','));
    setPurchaseDate(t.date);
    setPurchaseCategory(t.category_id);
    setPurchaseInstallments(t.installments || 1);
    setPurchasePersonId(t.person_id || activeUser.user_id);
    setIsPurchaseModalOpen(true);
  };

  // Save Purchase
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseDesc.trim()) return;

    setIsSavingPurchase(true);
    const cleanAmount = parseFloat(purchaseAmountStr.replace(/\./g, '').replace(',', '.')) || 0;

    try {
      if (purchaseModalMode === 'create') {
        await addTransaction({
          type: 'expense',
          nature: 'variable',
          description: purchaseDesc.trim(),
          amount: cleanAmount,
          date: purchaseDate,
          category_id: purchaseCategory,
          person_id: purchasePersonId,
          privacy: 'shared',
          payment_method: 'credito',
          card_id: purchaseTargetCardId || selectedCard?.id,
          installments: Number(purchaseInstallments) || 1,
        });
      } else if (editingTx) {
        await updateTransaction({
          ...editingTx,
          description: purchaseDesc.trim(),
          amount: cleanAmount,
          date: purchaseDate,
          category_id: purchaseCategory,
          person_id: purchasePersonId,
          card_id: purchaseTargetCardId || editingTx.card_id,
          installments: Number(purchaseInstallments) || 1,
        });
      }
      setIsPurchaseModalOpen(false);
    } finally {
      setIsSavingPurchase(false);
    }
  };

  // Delete Purchase
  const handleConfirmDeleteTx = async () => {
    if (!txToDelete) return;
    setIsDeletingTx(true);
    try {
      await deleteTransaction(txToDelete.id);
      setTxToDelete(null);
    } finally {
      setIsDeletingTx(false);
    }
  };

  // Pay Invoice
  const handlePayInvoice = async () => {
    if (!currentInvoice && totalCardSpent <= 0) return;
    setIsPaying(true);
    try {
      const invoiceId = currentInvoice ? currentInvoice.id : 'inv_' + (selectedCard?.id || 'manual');
      await payInvoice(invoiceId, payAccountId, totalCardSpent);
      setIsPayInvoiceModalOpen(false);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Top Bar: Cards Selector Tabs with Add Button */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {db.credit_cards.map(c => {
          const isSelected = c.id === selectedCard?.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCardId(c.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold shrink-0 transition-all active:scale-95 flex items-center gap-2 ${
                isSelected
                  ? 'bg-purple-900 text-white shadow-md ring-2 ring-purple-600/50'
                  : 'bg-white dark:bg-[#23122c] text-stone-600 dark:text-stone-300 border border-black/5 dark:border-white/10 hover:bg-stone-50'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
                style={{ backgroundColor: c.color }}
              />
              <span className="truncate max-w-[140px]">{c.name}</span>
            </button>
          );
        })}

        <button
          onClick={handleOpenCreateCard}
          className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-purple-950 shrink-0 flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          Novo Cartão
        </button>
      </div>

      {/* Selected Card Visual Display */}
      {selectedCard ? (
        <div className="space-y-2.5">
          <div
            className="rounded-3xl p-5 text-white shadow-xl relative overflow-hidden space-y-4 transition-all border border-white/10"
            style={{
              background: `linear-gradient(135deg, ${selectedCard.color} 0%, #170924 100%)`,
            }}
          >
            {/* Header with Bank, Brand and Card Actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-amber-300" />
                <span className="font-bold text-base tracking-tight">{selectedCard.name}</span>
                <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-mono text-white/90">
                  {selectedCard.brand}
                </span>
              </div>

              {/* Edit & Delete Action Buttons (Clearly visible on all screen sizes) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenEditCard(selectedCard)}
                  className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-xs border border-white/20"
                  title="Editar dados deste cartão"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                <button
                  onClick={() => setCardToDelete(selectedCard)}
                  className="px-2.5 py-1 rounded-xl bg-rose-600/80 hover:bg-rose-600 active:scale-95 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-xs border border-rose-400/40"
                  title="Excluir este cartão de crédito"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>

            {/* Current Invoice Amount */}
            <div>
              <p className="text-xs text-white/75 uppercase tracking-wider font-semibold">
                Fatura Atual do Mês ({selectedCard.bank})
              </p>
              <p className="font-serif-display text-4xl font-bold mt-1 text-white tracking-tight">
                {formatBRL(totalCardSpent, hideValues)}
              </p>
            </div>

            {/* Limit Progress */}
            <div className="space-y-1.5 pt-1 border-t border-white/15">
              <div className="flex items-center justify-between text-xs text-white/90 font-medium">
                <span>Limite Utilizado</span>
                <span>Limite Total: <b>{formatBRL(selectedCard.limit, hideValues)}</b></span>
              </div>
              <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (totalCardSpent / (selectedCard.limit || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Dates: Closing and Due */}
            <div className="flex items-center justify-between text-xs pt-1 text-white/95">
              <div className="flex items-center gap-1 text-white/80">
                <Calendar className="w-3.5 h-3.5" />
                <span>Fecha dia <b>{selectedCard.closing_day}</b></span>
              </div>
              <div className="flex items-center gap-1 text-amber-300 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Vence dia <b>{selectedCard.due_day}</b></span>
              </div>
            </div>
          </div>

          {/* Quick Action Grid directly under the card */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleOpenCreatePurchase(selectedCard.id)}
              className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-purple-950 font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Lançar Despesa
            </button>

            <button
              onClick={() => setIsPayInvoiceModalOpen(true)}
              className="py-2.5 px-3 bg-white dark:bg-[#23122c] hover:bg-purple-50 dark:hover:bg-purple-950/40 active:scale-95 text-purple-950 dark:text-amber-300 font-bold text-xs rounded-2xl shadow-sm border border-black/5 dark:border-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Pagar Fatura
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-8 text-center space-y-3">
          <CreditCardIcon className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
          <p className="font-semibold text-sm text-stone-700 dark:text-stone-300">
            Nenhum cartão cadastrado
          </p>
          <button
            onClick={handleOpenCreateCard}
            className="py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Cartão
          </button>
        </div>
      )}

      {/* Expenses in this Invoice */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Despesas nesta Fatura ({cardPurchases.length})
          </span>
          <button
            onClick={() => handleOpenCreatePurchase(selectedCard?.id)}
            className="text-xs font-bold text-purple-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Despesa
          </button>
        </div>

        {cardPurchases.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs text-stone-400">Nenhuma compra registrada nesta fatura.</p>
            <button
              onClick={() => handleOpenCreatePurchase(selectedCard?.id)}
              className="text-xs font-semibold text-purple-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Lançar primeira despesa no cartão
            </button>
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {cardPurchases.map(t => {
              const cat = db.categories.find(c => c.id === t.category_id);
              const author = db.wallets[0]?.members.find(m => m.user_id === t.person_id) || activeUser;
              return (
                <div key={t.id} className="py-3 flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color || '#8b5cf6' }}
                    />
                    <div>
                      <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                        {t.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                        <span>{formatDatePT(t.date)}</span>
                        <span>·</span>
                        <span>{t.installments && t.installments > 1 ? `${t.installments}x parcelas` : 'À vista'}</span>
                        <span>·</span>
                        <span>{author.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                      {formatBRL(t.amount, hideValues)}
                    </p>

                    {/* Edit Purchase Button */}
                    <button
                      onClick={() => handleOpenEditPurchase(t)}
                      className="p-1.5 text-stone-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-all active:scale-95"
                      title="Editar esta despesa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Purchase Button */}
                    <button
                      onClick={() => setTxToDelete(t)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all active:scale-95"
                      title="Excluir esta despesa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DEDICATED CARDS MANAGEMENT LIST: Gerenciar Todos os Cartões */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Gerenciar Todos os Cartões ({db.credit_cards.length})
            </h3>
            <p className="text-[11px] text-stone-400">
              Edite limites, datas ou exclua cartões a qualquer momento
            </p>
          </div>
          <button
            onClick={handleOpenCreateCard}
            className="text-xs font-bold text-purple-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Cartão
          </button>
        </div>

        <div className="space-y-2.5 pt-1">
          {db.credit_cards.map(c => {
            const spent = db.transactions
              .filter(t => t.payment_method === 'credito' && t.card_id === c.id)
              .reduce((acc, t) => acc + t.amount, 0);

            return (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200/60 dark:border-white/5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: c.color }}
                    >
                      <CreditCardIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {c.bank} · {c.brand}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                      {formatBRL(spent, hideValues)}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Limite: {formatBRL(c.limit, hideValues)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-black/5 dark:border-white/5">
                  <span>Fecha dia <b>{c.closing_day}</b> · Vence dia <b>{c.due_day}</b></span>

                  <div className="flex items-center gap-1.5">
                    {/* Add expense directly to this card */}
                    <button
                      onClick={() => handleOpenCreatePurchase(c.id)}
                      className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-200 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title={`Adicionar despesa no cartão ${c.name}`}
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      Despesa
                    </button>

                    {/* Edit this card */}
                    <button
                      onClick={() => {
                        setSelectedCardId(c.id);
                        handleOpenEditCard(c);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 hover:bg-purple-100 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title={`Editar dados de ${c.name}`}
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>

                    {/* Delete this card */}
                    <button
                      onClick={() => setCardToDelete(c)}
                      className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title={`Excluir cartão ${c.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Form Modal (Create or Edit) */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#201027] w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100 flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-purple-600 dark:text-amber-400" />
                {cardModalMode === 'create' ? 'Cadastrar Novo Cartão' : `Editar Cartão: ${cardName || 'Cartão'}`}
              </h3>
              <button
                onClick={() => setIsCardModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nome / Apelido do Cartão
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank Ultravioleta, Itaú Black, Inter Gold"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Instituição / Banco
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nubank, Itaú, Inter"
                    value={cardBank}
                    onChange={e => setCardBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Bandeira
                  </label>
                  <select
                    value={cardBrand}
                    onChange={e => setCardBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {CARD_BRANDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Limite Total de Crédito (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-stone-400 font-bold">R$</span>
                  <input
                    type="text"
                    required
                    placeholder="5.000,00"
                    value={cardLimitStr}
                    onChange={e => setCardLimitStr(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Dia do Fechamento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cardClosingDay}
                    onChange={e => setCardClosingDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cardDueDay}
                    onChange={e => setCardDueDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Cor do Cartão
                </label>
                <div className="flex flex-wrap gap-2">
                  {CARD_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCardColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform active:scale-90 flex items-center justify-center ${
                        cardColor === c ? 'ring-2 ring-purple-600 scale-110 shadow-sm' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {cardColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="w-1/2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCard}
                  className="w-1/2 py-2.5 px-4 bg-purple-950 hover:bg-purple-900 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  {isSavingCard ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {cardModalMode === 'create' ? 'Criar Cartão' : 'Salvar Alterações'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Form Modal (Create or Edit) */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#201027] w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100">
                {purchaseModalMode === 'create' ? 'Adicionar Despesa no Cartão' : 'Editar Despesa do Cartão'}
              </h3>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-3.5">
              {/* Select which card */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Cartão Cobrado
                </label>
                <select
                  value={purchaseTargetCardId}
                  onChange={e => setPurchaseTargetCardId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  {db.credit_cards.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.bank})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Descrição da Despesa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Supermercado Pão de Açúcar, Jantar, Farmácia"
                  value={purchaseDesc}
                  onChange={e => setPurchaseDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    value={purchaseAmountStr}
                    onChange={e => setPurchaseAmountStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={purchaseCategory}
                    onChange={e => setPurchaseCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {db.categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Parcelamento
                  </label>
                  <select
                    value={purchaseInstallments}
                    onChange={e => setPurchaseInstallments(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value={1}>1x (À vista)</option>
                    <option value={2}>2x parcelas</option>
                    <option value={3}>3x parcelas</option>
                    <option value={4}>4x parcelas</option>
                    <option value={5}>5x parcelas</option>
                    <option value={6}>6x parcelas</option>
                    <option value={10}>10x parcelas</option>
                    <option value={12}>12x parcelas</option>
                  </select>
                </div>
              </div>

              {/* Author / Quem gastou */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Quem fez a compra?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {db.wallets[0]?.members.map(m => (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => setPurchasePersonId(m.user_id)}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        purchasePersonId === m.user_id
                          ? 'bg-purple-100 text-purple-950 dark:bg-purple-950 dark:text-purple-200 border-2 border-purple-500'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-white/5'
                      }`}
                    >
                      <img src={m.avatar_url} alt={m.name} className="w-4 h-4 rounded-full object-cover" />
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="w-1/2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPurchase}
                  className="w-1/2 py-2.5 px-4 bg-purple-950 hover:bg-purple-900 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  {isSavingPurchase ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {purchaseModalMode === 'create' ? 'Adicionar Compra' : 'Salvar Alterações'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Invoice Modal */}
      {isPayInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#201027] w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Pagar Fatura do Cartão
              </h3>
              <button
                onClick={() => setIsPayInvoiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200/60 dark:border-white/5 space-y-1">
              <span className="text-xs text-stone-400">Cartão:</span>
              <p className="font-bold text-sm text-stone-900 dark:text-stone-100">{selectedCard?.name}</p>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-xs text-stone-500">Valor a liquidar:</span>
                <span className="font-serif-display text-2xl font-bold text-purple-950 dark:text-amber-300">
                  {formatBRL(totalCardSpent, hideValues)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Debitar de qual conta?
              </label>
              <select
                value={payAccountId}
                onChange={e => setPayAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {checkingAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Saldo: {formatBRL(acc.balance, hideValues)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPayInvoiceModalOpen(false)}
                className="w-1/2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePayInvoice}
                disabled={isPaying || totalCardSpent <= 0}
                className="w-1/2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Liquidando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar Pagamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Card Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(cardToDelete)}
        title="Excluir Cartão de Crédito?"
        description="Tem certeza que deseja remover este cartão do app? As despesas históricas permanecerão no extrato do casal, mas o cartão será excluído."
        itemName={cardToDelete ? `${cardToDelete.name} (${cardToDelete.bank})` : undefined}
        isDeleting={isDeletingCard}
        onConfirm={handleConfirmDeleteCard}
        onClose={() => setCardToDelete(null)}
      />

      {/* Delete Purchase Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(txToDelete)}
        title="Excluir Despesa do Cartão?"
        description="Esta compra será removida da fatura do cartão e o valor total da fatura será recalculado automaticamente."
        itemName={txToDelete ? `${txToDelete.description} · ${formatBRL(txToDelete.amount, hideValues)}` : undefined}
        isDeleting={isDeletingTx}
        onConfirm={handleConfirmDeleteTx}
        onClose={() => setTxToDelete(null)}
      />
    </div>
  );
};
