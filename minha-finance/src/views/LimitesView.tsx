import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Tag,
  X,
  Target
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatBRL } from '../utils/formatters';
import { Budget } from '../types/finance';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export const LimitesView: React.FC = () => {
  const { db, activeUser, hideValues, updateBudget, deleteBudget } = useFinance();
  const [editingBudget, setEditingBudget] = useState<{ categoryId: string; limit: number; categoryName: string } | null>(null);
  const [limitStr, setLimitStr] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Delete modal state
  const [budgetToDelete, setBudgetToDelete] = useState<{ categoryId: string; categoryName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Calculate current month spending per category
  const categorySpending = db.transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((acc, t) => {
      acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const handleSaveLimit = async () => {
    if (!editingBudget) return;
    const cleanLimit = parseFloat(limitStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(cleanLimit) || cleanLimit <= 0) {
      setErrorMsg('Informe um valor de limite válido maior que zero.');
      return;
    }

    const budgetItem: Budget = {
      id: 'bud_' + editingBudget.categoryId,
      wallet_id: db.wallets[0]?.id || 'wal_casa_01',
      category_id: editingBudget.categoryId,
      month: currentMonthStr,
      limit_amount: cleanLimit,
      created_date: new Date().toISOString(),
      created_by_id: activeUser.user_id,
    };

    await updateBudget(budgetItem);
    setEditingBudget(null);
    setErrorMsg('');
  };

  const handleConfirmDelete = async () => {
    if (!budgetToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBudget(budgetToDelete.categoryId, currentMonthStr);
      setBudgetToDelete(null);
      if (editingBudget?.categoryId === budgetToDelete.categoryId) {
        setEditingBudget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif-display font-bold text-base text-purple-950 dark:text-purple-100">
              Tetos & Limites de Gastos
            </h2>
            <p className="text-xs text-stone-500">
              Controle os gastos do casal por categoria para não estourar o orçamento
            </p>
          </div>
        </div>
      </div>

      {/* Categories with Budgets */}
      <div className="space-y-3">
        {db.categories
          .filter(c => c.type === 'expense')
          .map(cat => {
            const budget = db.budgets.find(b => b.category_id === cat.id && b.month === currentMonthStr);
            const spent = categorySpending[cat.id] || 0;
            const limit = budget?.limit_amount;
            const percent = limit ? Math.min(150, (spent / limit) * 100) : null;
            const isOver = limit ? spent > limit : false;
            const isWarning = limit ? spent >= limit * 0.8 && !isOver : false;

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {limit ? (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isOver
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                      }`}>
                        {isOver ? 'Estourado!' : isWarning ? 'Atenção 80%' : `${percent?.toFixed(0)}%`}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400">Sem teto</span>
                    )}

                    <button
                      onClick={() => {
                        setEditingBudget({ categoryId: cat.id, limit: limit || 1000, categoryName: cat.name });
                        setLimitStr(limit ? limit.toFixed(2).replace('.', ',') : '1000,00');
                        setErrorMsg('');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title="Definir Limite"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{limit ? 'Editar Teto' : 'Definir Teto'}</span>
                    </button>

                    {limit && (
                      <button
                        onClick={() => setBudgetToDelete({ categoryId: cat.id, categoryName: cat.name })}
                        className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                        title="Remover teto da categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Gasto: <b className="text-stone-800 dark:text-stone-200">{formatBRL(spent, hideValues)}</b></span>
                  <span>Teto: <b className="text-stone-800 dark:text-stone-200">{limit ? formatBRL(limit, hideValues) : 'Não definido'}</b></span>
                </div>

                {limit && (
                  <div className="w-full bg-stone-100 dark:bg-black/30 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percent || 0)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#23122c] w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100">
                Definir Limite ({editingBudget.categoryName})
              </h3>
              <button
                onClick={() => setEditingBudget(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 flex items-center justify-center active:scale-95"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Valor Máximo para este Mês (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={limitStr}
                onChange={e => {
                  setLimitStr(e.target.value);
                  setErrorMsg('');
                }}
                autoFocus
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1a0a2a] border border-black/10 dark:border-white/10 rounded-xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              {errorMsg && (
                <p className="text-xs text-rose-500 mt-1">{errorMsg}</p>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSaveLimit}
                className="w-full py-3 bg-[#ffcc00] hover:bg-amber-400 active:scale-95 text-purple-950 font-bold text-sm rounded-xl shadow-md transition-all"
              >
                Salvar Limite da Categoria
              </button>

              {db.budgets.some(b => b.category_id === editingBudget.categoryId && b.month === currentMonthStr) && (
                <button
                  onClick={() => {
                    setBudgetToDelete({
                      categoryId: editingBudget.categoryId,
                      categoryName: editingBudget.categoryName,
                    });
                  }}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 active:scale-95 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover Teto desta Categoria
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Budget */}
      <ConfirmDeleteModal
        isOpen={Boolean(budgetToDelete)}
        title="Remover Limite de Categoria"
        description="Tem certeza que deseja remover o teto mensal definido para esta categoria?"
        itemName={budgetToDelete?.categoryName}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setBudgetToDelete(null)}
      />
    </div>
  );
};
