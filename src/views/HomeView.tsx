import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  PiggyBank,
  CreditCard,
  ChevronRight,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  Zap,
  Tag,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatBRL, formatDatePT, formatShortDatePT } from '../utils/formatters';
import { ActiveTab, NewLaunchTrigger } from '../components/BottomNav';
import { Transaction, PaymentMethod } from '../types/finance';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { SmartFinancialInsightsCard } from '../components/SmartFinancialInsightsCard';

interface HomeViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenNewLaunch: (trigger?: NewLaunchTrigger) => void;
  onOpenDinheiroGuardado: () => void;
  onOpenCartoes: () => void;
  onOpenContas: (filter?: 'payable' | 'receivable') => void;
  onOpenTransactionDetails?: (id: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateTab,
  onOpenNewLaunch,
  onOpenDinheiroGuardado,
  onOpenCartoes,
  onOpenContas,
}) => {
  const {
    db,
    summary,
    activeUser,
    partner,
    hideValues,
    deleteTransaction,
    updateTransaction,
  } = useFinance();

  // Quick edit transaction state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPersonId, setEditPersonId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Quick delete transaction state
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditDesc(tx.description);
    setEditAmountStr(tx.amount.toFixed(2).replace('.', ','));
    setEditDate(tx.date);
    setEditCategory(tx.category_id);
    setEditPersonId(tx.person_id);
  };

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
        person_id: editPersonId,
      });
      setEditingTx(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    setIsDeletingTx(true);
    try {
      await deleteTransaction(txToDelete.id);
      setTxToDelete(null);
    } finally {
      setIsDeletingTx(false);
    }
  };

  // 5 last movements visible to active user
  const recentTransactions = db.transactions
    .filter(tx => {
      if (tx.privacy === 'individual') {
        return tx.created_by_id === activeUser.user_id || tx.person_id === activeUser.user_id;
      }
      return true;
    })
    .slice(0, 5);

  const getCategory = (catId: string) => {
    return db.categories.find(c => c.id === catId) || {
      name: 'Geral',
      color: '#8b5cf6',
      icon: 'Tag',
    };
  };

  const getAuthor = (userId: string) => {
    const member = db.wallets[0]?.members.find(m => m.user_id === userId);
    return member || {
      name: 'Casal',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* 1. Main Gradient Card: Royal Purple -> Blue */}
      <div className="rounded-3xl bg-gradient-to-br from-[#2d0b4e] via-[#351261] to-[#313ec9] text-white p-5 shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/5 blur-xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide uppercase text-purple-200/80">
              Saldo Atual da Casa
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-purple-100 font-medium">
              Hoje
            </span>
          </div>

          <div className="mt-2 mb-4">
            <h1 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight">
              {formatBRL(summary.currentBalance, hideValues)}
            </h1>
          </div>

          {/* Grid Disponível vs Comprometido */}
          <div className="grid grid-cols-2 gap-3 py-3 border-t border-white/15 border-b mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-purple-200/70 font-semibold">
                Disponível
              </p>
              <p className={`font-semibold text-lg ${summary.available >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {formatBRL(summary.available, hideValues)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-purple-200/70 font-semibold">
                Comprometido
              </p>
              <p className="font-semibold text-lg text-amber-300">
                {formatBRL(summary.committed, hideValues)}
              </p>
            </div>
          </div>

          {/* Quick Buttons: "Novo Lançamento" & "Ver Extrato" */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onOpenNewLaunch()}
              className="w-full py-2.5 px-3 bg-[#ffcc00] hover:bg-amber-300 active:scale-98 text-purple-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Novo Lançamento
            </button>
            <button
              onClick={() => onNavigateTab('movimentos')}
              className="w-full py-2.5 px-3 bg-white/15 hover:bg-white/20 active:scale-98 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-white/10 transition-all"
            >
              Ver Extrato
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dinheiro Guardado (Reservas) - Soft Amber Card */}
      <button
        onClick={onOpenDinheiroGuardado}
        className="w-full text-left bg-gradient-to-r from-amber-50 via-amber-100/60 to-yellow-50 dark:from-[#352513] dark:to-[#2c1d10] border border-amber-200/80 dark:border-amber-700/40 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all group active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Dinheiro Guardado
              </p>
              <p className="font-serif-display text-2xl font-bold text-stone-900 dark:text-amber-100">
                {formatBRL(summary.savedMoney, hideValues)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <span>Ver reservas</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </button>

      {/* 3. 2x2 Stats Grid: Entradas, Despesas, Contas a pagar, A receber */}
      <div className="grid grid-cols-2 gap-3">
        {/* Entradas do mês */}
        <button
          onClick={() => onNavigateTab('movimentos')}
          className="text-left bg-white dark:bg-[#23122c] p-3.5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span className="font-medium">Entradas do mês</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-serif-display text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatBRL(summary.monthIncome, hideValues)}
          </p>
        </button>

        {/* Despesas do mês (Fixas + Variáveis) */}
        <button
          onClick={() => onNavigateTab('movimentos')}
          className="text-left bg-white dark:bg-[#23122c] p-3.5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span className="font-medium">Despesas do mês</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="font-serif-display text-xl font-bold text-rose-600 dark:text-rose-400">
            {formatBRL(summary.monthExpense, hideValues)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5 truncate">
            Fixas {formatBRL(summary.monthFixedExpense, hideValues)} · Var {formatBRL(summary.monthVarExpense, hideValues)}
          </p>
        </button>

        {/* Contas a pagar */}
        <button
          onClick={() => onOpenContas('payable')}
          className="text-left bg-white dark:bg-[#23122c] p-3.5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span className="font-medium">Contas a pagar</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-serif-display text-xl font-bold text-amber-600 dark:text-amber-400">
            {formatBRL(summary.toPay, hideValues)}
          </p>
        </button>

        {/* A receber */}
        <button
          onClick={() => onOpenContas('receivable')}
          className="text-left bg-white dark:bg-[#23122c] p-3.5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span className="font-medium">A receber</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="font-serif-display text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatBRL(summary.toReceive, hideValues)}
          </p>
        </button>
      </div>

      {/* 4. Card Bege "Quanto ainda posso gastar?" com valor/dia */}
      <div className="bg-[#f5efe6] dark:bg-[#2b1c31] border border-[#e3d7c5] dark:border-purple-800/40 rounded-3xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-900 text-amber-300 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-950 dark:text-purple-200">
                Quanto ainda posso gastar?
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Restam {summary.daysLeftInMonth} dias para o fim do mês
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-serif-display text-xl font-bold text-purple-950 dark:text-amber-300">
              {formatBRL(summary.dailyBudgetLeft, hideValues)}
              <span className="text-xs font-normal text-stone-500 dark:text-stone-400">/dia</span>
            </p>
          </div>
        </div>

        {/* Health bar */}
        <div className="w-full bg-stone-300/60 dark:bg-black/40 h-2 rounded-full overflow-hidden mt-3">
          <div
            className="bg-purple-900 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(10, (summary.available / (summary.currentBalance || 1)) * 100))}%`,
            }}
          />
        </div>
      </div>

      {/* Sugestões Financeiras Inteligentes */}
      <SmartFinancialInsightsCard
        onNavigateTarget={handleNavigateSuggestion}
        onOpenDinheiroGuardado={onOpenDinheiroGuardado}
      />

      {/* 5. Carrossel de Cartões de Crédito */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Cartões de Crédito
          </span>
          <button
            onClick={onOpenCartoes}
            className="text-xs font-semibold text-purple-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
          >
            Gerenciar
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {db.credit_cards.map(card => {
            // compute current spent on this card
            const spent = db.transactions
              .filter(t => t.payment_method === 'credito' && t.card_id === card.id)
              .reduce((acc, t) => acc + t.amount, 0);

            return (
              <div
                key={card.id}
                className="min-w-[260px] sm:min-w-[280px] bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-3xl p-4 shadow-md flex flex-col justify-between"
                style={{
                  background: `linear-gradient(135deg, ${card.color} 0%, #1a1025 100%)`,
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm tracking-tight">{card.name}</span>
                    <CreditCard className="w-5 h-5 text-white/80" />
                  </div>
                  <p className="text-[10px] uppercase text-white/70 font-medium">Fatura Atual ({card.bank})</p>
                  <p className="font-serif-display text-2xl font-bold mt-0.5">
                    {formatBRL(spent, hideValues)}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-white/80">
                    <span>Fecha dia {card.closing_day}</span>
                    <span className="text-amber-300 font-semibold">Vence dia {card.due_day}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNewLaunch({ type: 'card' });
                      }}
                      className="py-1 px-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-purple-950 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      Despesa
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCartoes();
                      }}
                      className="py-1 px-2 bg-white/20 hover:bg-white/30 active:scale-95 text-white font-semibold text-[11px] rounded-xl flex items-center justify-center gap-1 border border-white/20 transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                      Gerenciar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Últimos 5 Movimentos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Últimos Movimentos
          </span>
          <button
            onClick={() => onNavigateTab('movimentos')}
            className="text-xs font-semibold text-purple-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
          >
            Ver todos
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="bg-white dark:bg-[#23122c] rounded-3xl p-6 text-center border border-black/5 dark:border-white/10 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm text-stone-800 dark:text-stone-200">
                Nenhum lançamento no momento
              </p>
              <p className="text-xs text-stone-400 mt-0.5 max-w-xs mx-auto">
                Os números estão zerados. Toque no botão central + ou abaixo para registrar sua primeira entrada ou despesa.
              </p>
            </div>
            <button
              onClick={() => onOpenNewLaunch()}
              className="py-2 px-4 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Fazer Primeiro Lançamento
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#23122c] rounded-3xl border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5 overflow-hidden shadow-xs">
            {recentTransactions.map(tx => {
              const cat = getCategory(tx.category_id);
              const author = getAuthor(tx.person_id);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  onClick={() => onNavigateTab('movimentos')}
                  className="p-3.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-purple-900/10 cursor-pointer transition-colors group"
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
                        <p className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate max-w-[140px] sm:max-w-[190px]">
                          {tx.description}
                        </p>
                        {tx.privacy === 'individual' && (
                          <span title="Lançamento privado">
                            <Lock className="w-3 h-3 text-stone-400" />
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

                    {/* Quick Edit button */}
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

                    {/* Quick Delete button */}
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
      </div>

      {/* Edit Transaction Modal on Home */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#201027] w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100">
                Editar Lançamento
              </h3>
              <button
                onClick={() => setEditingTx(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
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
                    value={editAmountStr}
                    onChange={e => setEditAmountStr(e.target.value)}
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

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Categoria
                </label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  {db.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="w-1/2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="w-1/2 py-2.5 px-4 bg-purple-950 hover:bg-purple-900 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Transaction Modal on Home */}
      <ConfirmDeleteModal
        isOpen={Boolean(txToDelete)}
        title="Excluir Lançamento?"
        description="Esta movimentação será apagada e os totais do mês serão recalculados imediatamente."
        itemName={txToDelete ? `${txToDelete.description} · ${formatBRL(txToDelete.amount, hideValues)}` : undefined}
        isDeleting={isDeletingTx}
        onConfirm={handleConfirmDelete}
        onClose={() => setTxToDelete(null)}
      />
    </div>
  );
};
