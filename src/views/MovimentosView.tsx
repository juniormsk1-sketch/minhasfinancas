import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Lock,
  Trash2,
  Edit2,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Pin,
  ShoppingBag,
  Loader2,
  Check,
  RotateCcw
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatBRL, formatDatePT, formatShortDatePT } from '../utils/formatters';
import { Transaction, PaymentMethod } from '../types/finance';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export const MovimentosView: React.FC = () => {
  const {
    db,
    activeUser,
    hideValues,
    deleteTransaction,
    updateTransaction,
  } = useFinance();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'fixed' | 'variable'>('all');
  const [filterPerson, setFilterPerson] = useState<'all' | string>('all');
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'shared' | 'individual'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');
  const [editNature, setEditNature] = useState<'fixed' | 'variable'>('variable');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('pix');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Deletion modal state
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Month navigation
  const [currentDateOffset, setCurrentDateOffset] = useState(0);

  const selectedMonthDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + currentDateOffset);
    return d;
  }, [currentDateOffset]);

  const monthYearStr = useMemo(() => {
    const yyyy = selectedMonthDate.getFullYear();
    const mm = String(selectedMonthDate.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }, [selectedMonthDate]);

  const monthLabel = useMemo(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[selectedMonthDate.getMonth()]} de ${selectedMonthDate.getFullYear()}`;
  }, [selectedMonthDate]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return db.transactions.filter(tx => {
      // Month match
      if (!tx.date.startsWith(monthYearStr)) return false;

      // Privacy rule: individual transactions only visible to author
      if (tx.privacy === 'individual') {
        if (tx.created_by_id !== activeUser.user_id && tx.person_id !== activeUser.user_id) {
          return false;
        }
      }

      // Filter Type
      if (filterType === 'income' && tx.type !== 'income') return false;
      if (filterType === 'fixed' && (tx.type !== 'expense' || tx.nature !== 'fixed')) return false;
      if (filterType === 'variable' && (tx.type !== 'expense' || tx.nature !== 'variable')) return false;

      // Filter Person
      if (filterPerson !== 'all' && tx.person_id !== filterPerson) return false;

      // Filter Privacy
      if (filterPrivacy !== 'all' && tx.privacy !== filterPrivacy) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const cat = db.categories.find(c => c.id === tx.category_id);
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchCat = cat?.name.toLowerCase().includes(q);
        const matchNotes = tx.notes?.toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchNotes) return false;
      }

      return true;
    });
  }, [db.transactions, monthYearStr, filterType, filterPerson, filterPrivacy, search, activeUser.user_id, db.categories]);

  // Calculate filtered totals
  const { totalIncomes, totalExpenses } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') inc += tx.amount;
      else exp += tx.amount;
    }
    return { totalIncomes: inc, totalExpenses: exp };
  }, [filteredTransactions]);

  const getCategory = (catId: string) => {
    return db.categories.find(c => c.id === catId) || {
      name: 'Geral',
      color: '#8b5cf6',
      icon: 'Tag',
    };
  };

  const getAuthor = (userId: string) => {
    return db.wallets[0]?.members.find(m => m.user_id === userId) || {
      name: 'Membro',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
  };

  // Open Edit Modal
  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditDesc(tx.description);
    setEditAmountStr(tx.amount.toFixed(2).replace('.', ','));
    setEditDate(tx.date);
    setEditCategory(tx.category_id);
    setEditType(tx.type);
    setEditNature(tx.nature || 'variable');
    setEditPaymentMethod(tx.payment_method);
    setEditNotes(tx.notes || '');
    setIsEditModalOpen(true);
  };

  // Save Edited Transaction
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editDesc.trim()) return;

    setIsSavingEdit(true);
    const cleanAmount = parseFloat(editAmountStr.replace(/\./g, '').replace(',', '.')) || 0;

    try {
      await updateTransaction({
        ...editingTx,
        description: editDesc.trim(),
        amount: cleanAmount,
        date: editDate,
        category_id: editCategory,
        type: editType,
        nature: editType === 'expense' ? editNature : undefined,
        payment_method: editPaymentMethod,
        notes: editNotes.trim() || undefined,
      });

      if (selectedTx?.id === editingTx.id) {
        setSelectedTx({
          ...selectedTx,
          description: editDesc.trim(),
          amount: cleanAmount,
          date: editDate,
          category_id: editCategory,
          type: editType,
          nature: editType === 'expense' ? editNature : undefined,
          payment_method: editPaymentMethod,
          notes: editNotes.trim() || undefined,
        });
      }

      setIsEditModalOpen(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(txToDelete.id);
      setTxToDelete(null);
      if (selectedTx?.id === txToDelete.id) {
        setSelectedTx(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Month Navigator Bar */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-3 shadow-xs flex items-center justify-between">
        <button
          onClick={() => setCurrentDateOffset(prev => prev - 1)}
          className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="font-serif-display font-bold text-sm text-purple-950 dark:text-purple-100 capitalize">
            {monthLabel}
          </p>
          {currentDateOffset !== 0 && (
            <button
              onClick={() => setCurrentDateOffset(0)}
              className="text-[10px] font-semibold text-purple-700 dark:text-amber-400 hover:underline"
            >
              Voltar para mês atual
            </button>
          )}
        </div>

        <button
          onClick={() => setCurrentDateOffset(prev => prev + 1)}
          className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-3 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por descrição, categoria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Filters pills: All, Entradas, Fixas, Variáveis */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              filterType === 'all'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            Tudo
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              filterType === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            Entradas
          </button>
          <button
            onClick={() => setFilterType('fixed')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              filterType === 'fixed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            Despesas Fixas
          </button>
          <button
            onClick={() => setFilterType('variable')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              filterType === 'variable'
                ? 'bg-amber-500 text-purple-950 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
            }`}
          >
            Despesas Variáveis
          </button>
        </div>

        {/* Filter Person & Privacy pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {db.wallets[0]?.members.map(m => (
            <button
              key={m.user_id}
              onClick={() => setFilterPerson(filterPerson === m.user_id ? 'all' : m.user_id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                filterPerson === m.user_id
                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-300'
                  : 'bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border border-stone-200/60 dark:border-white/5'
              }`}
            >
              <img src={m.avatar_url} alt={m.name} className="w-3.5 h-3.5 rounded-full object-cover" />
              <span>{m.name}</span>
            </button>
          ))}

          <button
            onClick={() => setFilterPrivacy(filterPrivacy === 'individual' ? 'all' : 'individual')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1 shrink-0 transition-all ${
              filterPrivacy === 'individual'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300'
                : 'bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border border-stone-200/60 dark:border-white/5'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Privados</span>
          </button>
        </div>
      </div>

      {/* Filtered Totals Summary */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs flex items-center justify-between text-xs">
        <div>
          <span className="text-stone-500 block">Entradas no filtro:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            +{formatBRL(totalIncomes, hideValues)}
          </span>
        </div>

        <div className="h-8 w-px bg-black/5 dark:border-white/10" />

        <div>
          <span className="text-stone-500 block">Despesas no filtro:</span>
          <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
            -{formatBRL(totalExpenses, hideValues)}
          </span>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white dark:bg-[#23122c] rounded-3xl p-8 text-center border border-black/5 dark:border-white/10 space-y-2">
          <Calendar className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
          <p className="font-semibold text-stone-700 dark:text-stone-300">
            Nenhum movimento neste filtro
          </p>
          <p className="text-xs text-stone-400">
            Experimente alterar o mês ou limpar os filtros de busca.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#23122c] rounded-3xl border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5 overflow-hidden shadow-xs">
          {filteredTransactions.map(tx => {
            const cat = getCategory(tx.category_id);
            const author = getAuthor(tx.person_id);
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="p-3.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-purple-900/10 cursor-pointer active:scale-[0.99] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <Tag className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate max-w-[140px] sm:max-w-[200px]">
                        {tx.description}
                      </p>
                      {tx.privacy === 'individual' && (
                        <span title="Lançamento privado">
                          <Lock className="w-3 h-3 text-amber-500" />
                        </span>
                      )}
                      {tx.nature === 'fixed' && tx.type === 'expense' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                          Fixa
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                      <img
                        src={author.avatar_url}
                        alt={author.name}
                        className="w-3.5 h-3.5 rounded-full object-cover"
                      />
                      <span>{author.name}</span>
                      <span>·</span>
                      <span>{formatShortDatePT(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-900 dark:text-stone-100'}`}>
                      {isIncome ? '+' : '-'} {formatBRL(tx.amount, hideValues)}
                    </p>
                    <span className="text-[10px] text-stone-400 uppercase">
                      {tx.payment_method}
                    </span>
                  </div>

                  {/* Quick Edit Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(tx);
                    }}
                    className="p-1.5 text-stone-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition-all active:scale-95"
                    title="Editar lançamento"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Quick Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTxToDelete(tx);
                    }}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all active:scale-95"
                    title="Excluir lançamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#23122c] w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100">
                Detalhes do Lançamento
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="text-center py-2">
                <p className="text-xs text-stone-400 uppercase font-semibold">Valor</p>
                <p className={`font-serif-display text-3xl font-bold ${selectedTx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-900 dark:text-stone-100'}`}>
                  {selectedTx.type === 'income' ? '+' : '-'} {formatBRL(selectedTx.amount, hideValues)}
                </p>
              </div>

              <div className="bg-stone-50 dark:bg-purple-950/40 p-3.5 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Descrição:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{selectedTx.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Data:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{formatDatePT(selectedTx.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Classificação:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {selectedTx.type === 'income' ? 'Entrada' : selectedTx.nature === 'fixed' ? 'Despesa Fixa' : 'Despesa Variável'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Forma de pagamento:</span>
                  <span className="font-semibold uppercase text-stone-800 dark:text-stone-200">{selectedTx.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Registrado por:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {getAuthor(selectedTx.person_id).name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Privacidade:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {selectedTx.privacy === 'shared' ? 'Compartilhado com o casal 👥' : 'Privado (apenas você) 🔒'}
                  </span>
                </div>
                {selectedTx.notes && (
                  <div className="pt-1.5 border-t border-black/5 dark:border-white/5">
                    <span className="text-stone-500 block mb-0.5 font-medium">Observações:</span>
                    <p className="text-stone-700 dark:text-stone-300 italic">{selectedTx.notes}</p>
                  </div>
                )}
              </div>

              {selectedTx.attachment_url && (
                <div>
                  <p className="text-xs font-semibold text-stone-500 mb-1.5">Comprovante anexado:</p>
                  <img
                    src={selectedTx.attachment_url}
                    alt="Comprovante"
                    className="w-full max-h-48 object-contain rounded-xl border border-black/10 shadow-xs"
                  />
                </div>
              )}
            </div>

            {/* Action buttons: Edit and Delete */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => {
                  const tx = selectedTx;
                  setSelectedTx(null);
                  handleOpenEdit(tx);
                }}
                className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                Editar Lançamento
              </button>

              <button
                onClick={() => setTxToDelete(selectedTx)}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Lançamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#201027] w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100">
                Editar Lançamento
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Tipo de Lançamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditType('expense')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                      editType === 'expense'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('income')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                      editType === 'income'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Entrada / Renda
                  </button>
                </div>
              </div>

              {/* Fixed vs Variable if expense */}
              {editType === 'expense' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Natureza da Despesa
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditNature('fixed')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                        editNature === 'fixed'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Fixa (Recorrente)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditNature('variable')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                        editNature === 'variable'
                          ? 'bg-amber-500 text-purple-950 shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Variável (Dia a dia)
                    </button>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Ex: Supermercado, Aluguel, Salário"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    required
                    value={editAmountStr}
                    onChange={e => setEditAmountStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Category and Payment Method */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {db.categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Pagamento
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={e => setEditPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="pix">PIX</option>
                    <option value="credito">Cartão de Crédito</option>
                    <option value="debito">Cartão de Débito</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Observações (opcional)
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Detalhes ou anotações..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-2.5 px-4 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Atualizar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Transaction */}
      <ConfirmDeleteModal
        isOpen={Boolean(txToDelete)}
        title="Excluir Lançamento"
        description="Tem certeza que deseja excluir este movimento do extrato?"
        itemName={txToDelete?.description}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setTxToDelete(null)}
      />
    </div>
  );
};
