import React, { useState, useMemo } from 'react';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shield,
  Tag
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatBRL } from '../utils/formatters';

export const AnaliseView: React.FC = () => {
  const { db, hideValues } = useFinance();

  const [monthOffset, setMonthOffset] = useState(0);

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthYearStr = useMemo(() => {
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }, [selectedDate]);

  const monthLabel = useMemo(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`;
  }, [selectedDate]);

  // Monthly transactions
  const monthTransactions = useMemo(() => {
    return db.transactions.filter(t => t.date.startsWith(monthYearStr));
  }, [db.transactions, monthYearStr]);

  // Expenses & Income calculations
  const {
    totalIncome,
    totalExpense,
    fixedExpenses,
    varExpenses,
    byCategory,
    byPerson,
  } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let fix = 0;
    let variable = 0;
    const catMap: Record<string, number> = {};
    const personMap: Record<string, number> = {};

    for (const tx of monthTransactions) {
      if (tx.type === 'income') {
        inc += tx.amount;
      } else {
        exp += tx.amount;
        if (tx.nature === 'fixed') fix += tx.amount;
        else variable += tx.amount;

        catMap[tx.category_id] = (catMap[tx.category_id] || 0) + tx.amount;
        personMap[tx.person_id] = (personMap[tx.person_id] || 0) + tx.amount;
      }
    }

    // Sort categories
    const sortedCategories = Object.entries(catMap)
      .map(([catId, amount]) => {
        const cat = db.categories.find(c => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Outras',
          color: cat?.color || '#94a3b8',
          amount,
          percent: exp > 0 ? (amount / exp) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome: inc,
      totalExpense: exp,
      fixedExpenses: fix,
      varExpenses: variable,
      byCategory: sortedCategories,
      byPerson: personMap,
    };
  }, [monthTransactions, db.categories]);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white dark:bg-[#23122c] p-3 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs">
        <button
          onClick={() => setMonthOffset(prev => prev - 1)}
          className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-purple-900/40 text-stone-600 dark:text-stone-300"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-serif-display font-bold text-base text-purple-950 dark:text-purple-100">
            {monthLabel}
          </p>
          <p className="text-[11px] text-stone-500">
            Análise & Saúde Financeira do Casal
          </p>
        </div>
        <button
          onClick={() => setMonthOffset(prev => prev + 1)}
          className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-purple-900/40 text-stone-600 dark:text-stone-300"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Couple Financial Health Insight Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-[#19042b] text-white p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
          <Sparkles className="w-4 h-4" />
          <span>Diagnóstico do Mês</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-200">Taxa de Poupança da Casa</p>
            <p className="font-serif-display text-3xl font-bold">
              {savingsRate >= 0 ? `+${savingsRate.toFixed(1)}%` : `${savingsRate.toFixed(1)}%`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-purple-200">Sobra / Déficit</p>
            <p className={`font-semibold text-lg ${totalIncome >= totalExpense ? 'text-emerald-300' : 'text-rose-300'}`}>
              {formatBRL(totalIncome - totalExpense, hideValues)}
            </p>
          </div>
        </div>

        <p className="text-xs text-purple-200/90 leading-relaxed border-t border-white/10 pt-2">
          {savingsRate >= 20
            ? '🎉 Parabéns! Vocês estão poupando acima da meta recomendada (20%) para alimentar as reservas do casal.'
            : savingsRate >= 0
            ? '👍 Orçamento equilibrado! As receitas cobrem os custos, mas fiquem atentos aos gastos variáveis.'
            : '⚠️ As despesas do mês superaram as entradas. Verifiquem os orçamentos e compras parceladas.'}
        </p>
      </div>

      {/* Comparison: Fixas vs Variáveis */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Estrutura de Gastos (Fixas vs Variáveis)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl">
            <span className="text-xs text-indigo-700 dark:text-indigo-300 block font-medium">
              Despesas Fixas
            </span>
            <span className="font-serif-display text-lg font-bold text-indigo-950 dark:text-indigo-100">
              {formatBRL(fixedExpenses, hideValues)}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">
              {totalExpense > 0 ? `${((fixedExpenses / totalExpense) * 100).toFixed(0)}% do total` : '0%'}
            </span>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl">
            <span className="text-xs text-amber-700 dark:text-amber-300 block font-medium">
              Despesas Variáveis
            </span>
            <span className="font-serif-display text-lg font-bold text-amber-950 dark:text-amber-100">
              {formatBRL(varExpenses, hideValues)}
            </span>
            <span className="text-[11px] text-stone-400 block mt-0.5">
              {totalExpense > 0 ? `${((varExpenses / totalExpense) * 100).toFixed(0)}% do total` : '0%'}
            </span>
          </div>
        </div>

        {/* Proportional dual bar */}
        <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-black/30 flex overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all"
            style={{ width: `${totalExpense > 0 ? (fixedExpenses / totalExpense) * 100 : 50}%` }}
          />
          <div
            className="bg-amber-500 h-full transition-all"
            style={{ width: `${totalExpense > 0 ? (varExpenses / totalExpense) * 100 : 50}%` }}
          />
        </div>
      </div>

      {/* Divisão de Gastos do Casal (Junior vs Shtefany) */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-700 dark:text-amber-400" />
            Divisão de Gastos no Casal
          </span>
        </div>

        <div className="space-y-3">
          {db.wallets[0]?.members.map(member => {
            const spent = byPerson[member.user_id] || 0;
            const pct = totalExpense > 0 ? (spent / totalExpense) * 100 : 0;

            return (
              <div key={member.user_id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {member.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {formatBRL(spent, hideValues)}
                    </span>
                    <span className="text-stone-400 text-[10px] ml-1">
                      ({pct.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div className="w-full bg-stone-100 dark:bg-black/30 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: member.color || '#8b5cf6',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Despesas por Categoria */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Maiores Gastos por Categoria
          </span>
          <span className="text-xs text-stone-400">
            Total {formatBRL(totalExpense, hideValues)}
          </span>
        </div>

        {byCategory.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-4">
            Nenhuma despesa registrada neste mês
          </p>
        ) : (
          <div className="space-y-3">
            {byCategory.map(cat => (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      {cat.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {formatBRL(cat.amount, hideValues)}
                    </span>
                    <span className="text-stone-400 text-[10px] ml-1.5">
                      {cat.percent.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-stone-100 dark:bg-black/30 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
