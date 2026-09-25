import React, { useState } from 'react';
import { Home, ListFilter, PieChart, MoreHorizontal, Plus, ArrowDownLeft, Pin, ShoppingBag, CreditCard, ArrowLeftRight, X } from 'lucide-react';
import { ExpenseNature, TransactionType } from '../types/finance';

export type ActiveTab = 'home' | 'movimentos' | 'analise' | 'menu';

export interface NewLaunchTrigger {
  type: TransactionType | 'card' | 'transfer';
  nature?: ExpenseNature;
}

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenNewLaunch: (trigger: NewLaunchTrigger) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenNewLaunch,
}) => {
  const [isFabOpen, setIsFabOpen] = useState(false);

  const handleSelectOption = (trigger: NewLaunchTrigger) => {
    setIsFabOpen(false);
    onOpenNewLaunch(trigger);
  };

  return (
    <>
      {/* Backdrop overlay when FAB is opened */}
      {isFabOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsFabOpen(false)}
        />
      )}

      {/* FAB Popup Menu with 5 options */}
      {isFabOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-6 z-50 animate-in slide-in-from-bottom-6 zoom-in-95 duration-200">
          <div className="bg-white dark:bg-[#23122c] border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl p-4 space-y-2">
            <div className="text-xs font-semibold text-stone-400 dark:text-stone-400 uppercase tracking-wider px-2 pt-1 pb-1">
              Novo Lançamento
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {/* 1. Entrada */}
              <button
                onClick={() => handleSelectOption({ type: 'income' })}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-stone-800 dark:text-stone-100 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">Entrada</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Salário, freelance, rendimentos, pix recebido</p>
                </div>
              </button>

              {/* 2. Despesa Fixa */}
              <button
                onClick={() => handleSelectOption({ type: 'expense', nature: 'fixed' })}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-stone-800 dark:text-stone-100 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Pin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-indigo-900 dark:text-indigo-300">Despesa Fixa</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Aluguel, condomínio, luz, internet, assinaturas</p>
                </div>
              </button>

              {/* 3. Despesa Variável */}
              <button
                onClick={() => handleSelectOption({ type: 'expense', nature: 'variable' })}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-950/30 text-stone-800 dark:text-stone-100 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-amber-900 dark:text-amber-300">Despesa Variável</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Mercado, restaurante, farmácia, lazer, roupas</p>
                </div>
              </button>

              {/* 4. Cartão de Crédito */}
              <button
                onClick={() => handleSelectOption({ type: 'card' })}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-950/30 text-stone-800 dark:text-stone-100 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-purple-900 dark:text-purple-300">Compra no Cartão</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Lançamento em fatura com ou sem parcelamento</p>
                </div>
              </button>

              {/* 5. Transferência */}
              <button
                onClick={() => handleSelectOption({ type: 'transfer' })}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-950/30 text-stone-800 dark:text-stone-100 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-300">Transferência</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Entre contas, reservas ou entre os parceiros</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Fixed Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1a0a2a]/95 backdrop-blur-md border-t border-black/5 dark:border-white/10 safe-bottom">
        <div className="max-w-[512px] mx-auto px-4 h-16 flex items-center justify-around relative">
          {/* Tab 1: Início */}
          <button
            onClick={() => {
              setIsFabOpen(false);
              onChangeTab('home');
            }}
            className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
              activeTab === 'home'
                ? 'text-purple-900 dark:text-amber-400 font-semibold'
                : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-1">Início</span>
          </button>

          {/* Tab 2: Movimentos (Extrato) */}
          <button
            onClick={() => {
              setIsFabOpen(false);
              onChangeTab('movimentos');
            }}
            className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
              activeTab === 'movimentos'
                ? 'text-purple-900 dark:text-amber-400 font-semibold'
                : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
            }`}
          >
            <ListFilter className="w-5 h-5" />
            <span className="text-[10px] mt-1">Extrato</span>
          </button>

          {/* Central FAB "+" */}
          <div className="relative -top-5">
            <button
              onClick={() => setIsFabOpen(!isFabOpen)}
              title="Novo lançamento"
              className={`w-14 h-14 rounded-full bg-[#ffcc00] text-purple-950 flex items-center justify-center shadow-lg shadow-amber-500/30 active:scale-95 transition-all transform duration-200 ${
                isFabOpen ? 'rotate-45 bg-purple-900 text-white shadow-purple-900/30' : ''
              }`}
            >
              {isFabOpen ? <X className="w-7 h-7" /> : <Plus className="w-8 h-8 stroke-[2.5]" />}
            </button>
          </div>

          {/* Tab 3: Análise */}
          <button
            onClick={() => {
              setIsFabOpen(false);
              onChangeTab('analise');
            }}
            className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
              activeTab === 'analise'
                ? 'text-purple-900 dark:text-amber-400 font-semibold'
                : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-[10px] mt-1">Análise</span>
          </button>

          {/* Tab 4: Menu / Mais */}
          <button
            onClick={() => {
              setIsFabOpen(false);
              onChangeTab('menu');
            }}
            className={`flex flex-col items-center justify-center w-16 py-1 transition-colors ${
              activeTab === 'menu'
                ? 'text-purple-900 dark:text-amber-400 font-semibold'
                : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-1">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
};
