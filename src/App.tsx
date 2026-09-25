/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/Header';
import { BottomNav, ActiveTab, NewLaunchTrigger } from './components/BottomNav';
import { NewTransactionModal } from './components/NewTransactionModal';
import { LockScreen } from './components/LockScreen';
import { HomeView } from './views/HomeView';
import { MovimentosView } from './views/MovimentosView';
import { AnaliseView } from './views/AnaliseView';
import { DinheiroGuardadoView } from './views/DinheiroGuardadoView';
import { CartoesView } from './views/CartoesView';
import { ContasView } from './views/ContasView';
import { LimitesView } from './views/LimitesView';
import { ConviteView } from './views/ConviteView';
import { AtividadesView } from './views/AtividadesView';
import { NotificacoesView } from './views/NotificacoesView';
import { SegurancaView } from './views/SegurancaView';
import { RelatoriosView } from './views/RelatoriosView';
import { ConfiguracoesView } from './views/ConfiguracoesView';
import { PerfilModal } from './components/PerfilModal';
import { ChevronLeft } from 'lucide-react';

function MainAppShell() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [subView, setSubView] = useState<string | null>(null);
  const [contasInitialFilter, setContasInitialFilter] = useState<'payable' | 'receivable'>('payable');

  // Modal State
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [newTxTrigger, setNewTxTrigger] = useState<NewLaunchTrigger | undefined>(undefined);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileTargetUserId, setProfileTargetUserId] = useState<string | undefined>(undefined);

  // Theme Mode State: 'light' | 'dark' | 'auto'
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>(() => {
    return (localStorage.getItem('minha_finance_theme') as any) || 'auto';
  });

  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (themeMode === 'dark') {
        isDark = true;
      } else if (themeMode === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    };

    applyTheme();
    localStorage.setItem('minha_finance_theme', themeMode);

    if (themeMode === 'auto' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Support direct route / hash for /dinheiro-guardado
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      const path = window.location.pathname.replace('/', '');
      if (hash === 'dinheiro-guardado' || path === 'dinheiro-guardado') {
        setSubView('dinheiro-guardado');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleOpenNewLaunch = (trigger?: NewLaunchTrigger) => {
    setNewTxTrigger(trigger || { type: 'expense', nature: 'variable' });
    setIsNewTxModalOpen(true);
  };

  const handleOpenProfile = (userId?: string) => {
    setProfileTargetUserId(userId);
    setIsProfileModalOpen(true);
  };

  const handleNavigateTab = (tab: ActiveTab) => {
    setSubView(null);
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSubViewTitle = (view: string) => {
    switch (view) {
      case 'dinheiro-guardado':
        return 'Dinheiro Guardado & Reservas';
      case 'cartoes':
        return 'Cartões de Crédito';
      case 'contas':
        return 'Contas a Pagar / Receber';
      case 'limites':
        return 'Limites & Orçamentos';
      case 'convite':
        return 'Conectar com o Parceiro(a)';
      case 'atividades':
        return 'Histórico & Auditoria';
      case 'notificacoes':
        return 'Notificações do Casal';
      case 'seguranca':
        return 'Segurança & PIN';
      case 'relatorios':
        return 'Relatórios & Exportação';
      default:
        return 'Menu';
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#170a1e] text-[#1e1329] dark:text-[#f8f6fb] flex justify-center selection:bg-amber-400 selection:text-purple-950 font-inter">
      {/* Mobile-first centered frame with 512px max-width */}
      <div className="w-full max-w-[512px] min-h-screen bg-[#faf8f5] dark:bg-[#170a1e] relative flex flex-col shadow-2xl border-x border-black/5 dark:border-white/5">
        {/* App Header */}
        <Header
          onOpenNotifications={() => setSubView('notificacoes')}
          onOpenInvite={() => setSubView('convite')}
          onOpenSettings={() => {
            setActiveTab('menu');
            setSubView(null);
          }}
          onOpenProfile={handleOpenProfile}
        />

        {/* SubView Back Bar */}
        {subView && (
          <div className="px-4 py-2.5 flex items-center gap-2 border-b border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/20 backdrop-blur-sm sticky top-[61px] z-20">
            <button
              onClick={() => setSubView(null)}
              className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 flex items-center gap-1 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
            <span className="font-serif-display font-bold text-sm truncate text-purple-950 dark:text-purple-100">
              {getSubViewTitle(subView)}
            </span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 px-4 pt-3">
          {subView ? (
            <>
              {subView === 'dinheiro-guardado' && (
                <DinheiroGuardadoView onBack={() => setSubView(null)} />
              )}
              {subView === 'cartoes' && <CartoesView />}
              {subView === 'contas' && <ContasView initialFilter={contasInitialFilter} />}
              {subView === 'limites' && <LimitesView />}
              {subView === 'convite' && <ConviteView />}
              {subView === 'atividades' && <AtividadesView />}
              {subView === 'notificacoes' && <NotificacoesView />}
              {subView === 'seguranca' && <SegurancaView />}
              {subView === 'relatorios' && <RelatoriosView />}
            </>
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeView
                  onNavigateTab={handleNavigateTab}
                  onOpenNewLaunch={handleOpenNewLaunch}
                  onOpenDinheiroGuardado={() => setSubView('dinheiro-guardado')}
                  onOpenCartoes={() => setSubView('cartoes')}
                  onOpenContas={(filter) => {
                    if (filter) setContasInitialFilter(filter);
                    setSubView('contas');
                  }}
                />
              )}

              {activeTab === 'movimentos' && <MovimentosView />}

              {activeTab === 'analise' && <AnaliseView />}

              {activeTab === 'menu' && (
                <ConfiguracoesView
                  onSelectSubView={(viewName) => setSubView(viewName)}
                  themeMode={themeMode}
                  onChangeThemeMode={setThemeMode}
                  onOpenProfile={handleOpenProfile}
                />
              )}
            </>
          )}
        </main>

        {/* Fixed Bottom Navigation with 5-Option Central FAB */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={handleNavigateTab}
          onOpenNewLaunch={handleOpenNewLaunch}
        />

        {/* New Transaction / AI Scanner Modal */}
        <NewTransactionModal
          isOpen={isNewTxModalOpen}
          initialTrigger={newTxTrigger}
          onClose={() => setIsNewTxModalOpen(false)}
        />

        {/* Profile (Name & Photo) Editor Modal */}
        <PerfilModal
          isOpen={isProfileModalOpen}
          initialUserId={profileTargetUserId}
          onClose={() => setIsProfileModalOpen(false)}
        />

        {/* Security PIN Lock Overlay (when active) */}
        <LockScreen />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainAppShell />
    </FinanceProvider>
  );
}
