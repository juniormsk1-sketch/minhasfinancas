import React from 'react';
import {
  PiggyBank,
  CreditCard,
  Clock,
  Target,
  Users,
  Bell,
  History,
  Shield,
  FileText,
  Moon,
  Sun,
  Laptop,
  ChevronRight,
  DownloadCloud,
  Heart,
  User,
  Camera,
  RotateCcw,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface ConfiguracoesViewProps {
  onSelectSubView: (viewName: string) => void;
  themeMode: 'light' | 'dark' | 'auto';
  onChangeThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  onOpenProfile: (userId?: string) => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  onSelectSubView,
  themeMode,
  onChangeThemeMode,
  onOpenProfile,
}) => {
  const { wallet, activeUser, partner } = useFinance();

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Wallet info card */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-900 to-indigo-800 text-amber-400 flex items-center justify-center font-bold shadow-xs">
            <Heart className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <h2 className="font-serif-display font-bold text-base text-purple-950 dark:text-purple-100">
              {wallet?.name || 'Casa do Junior & Shtefany 💜'}
            </h2>
            <p className="text-xs text-stone-500">
              {wallet?.members.map(m => m.name).join(' & ')} · Código {wallet?.invite_code}
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectSubView('convite')}
          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-purple-950 font-bold text-xs rounded-xl shadow-xs transition-transform"
        >
          Convidar
        </button>
      </div>

      {/* Couple Profiles Card: Junior & Shtefany */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
            Perfis & Fotos do Casal
          </span>
          <button
            onClick={() => onOpenProfile()}
            className="text-[11px] font-bold text-purple-700 dark:text-amber-400 hover:underline"
          >
            Gerenciar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {wallet?.members.map(member => (
            <div
              key={member.user_id}
              className="p-3 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200/60 dark:border-white/5 flex flex-col items-center text-center relative group"
            >
              <div className="relative mb-2">
                <img
                  src={member.avatar_url}
                  alt={member.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-600/30 dark:ring-amber-400/40 shadow-xs"
                />
                <button
                  onClick={() => onOpenProfile(member.user_id)}
                  title={`Alterar foto de ${member.name}`}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-amber-400 text-purple-950 shadow-xs hover:scale-105 active:scale-95 transition-transform"
                >
                  <Camera className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>

              <p className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate w-full">
                {member.name}
              </p>
              <span className="text-[10px] text-stone-400">
                {member.user_id === activeUser.user_id ? 'Você (ativo)' : 'Parceiro(a)'}
              </span>

              <button
                onClick={() => onOpenProfile(member.user_id)}
                className="mt-2 w-full py-1 px-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-900 dark:text-amber-300 font-bold text-[11px] rounded-xl active:scale-95 transition-all"
              >
                Alterar nome e foto
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Feature Menu Items */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl divide-y divide-black/5 dark:divide-white/5 overflow-hidden shadow-xs">
        {/* Dinheiro Guardado */}
        <button
          onClick={() => onSelectSubView('dinheiro-guardado')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-purple-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                Dinheiro Guardado & Reservas
              </p>
              <p className="text-[11px] text-stone-400">
                Reserva de emergência, viagens e patrimônio protegido
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Cartões de Crédito */}
        <button
          onClick={() => onSelectSubView('cartoes')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-purple-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                Cartões de Crédito & Faturas
              </p>
              <p className="text-[11px] text-stone-400">
                Limites, faturas do mês e compras parceladas
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Contas a Pagar / Receber */}
        <button
          onClick={() => onSelectSubView('contas')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-purple-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                Contas a Pagar & A Receber
              </p>
              <p className="text-[11px] text-stone-400">
                Boletos, contas fixas com vencimento e pagamentos
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Limites e Orçamentos */}
        <button
          onClick={() => onSelectSubView('limites')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-purple-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                Limites & Orçamentos
              </p>
              <p className="text-[11px] text-stone-400">
                Tetos de gastos por categoria para não estourar o mês
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Histórico e Auditoria */}
        <button
          onClick={() => onSelectSubView('atividades')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-purple-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                Histórico & Auditoria
              </p>
              <p className="text-[11px] text-stone-400">
                Registro de quem lançou, editou ou apagou despesas
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Segurança PIN */}
        <button
          onClick={() => onSelectSubView('seguranca')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-purple-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                Segurança (PIN & Biometria)
              </p>
              <p className="text-[11px] text-stone-400">
                Bloqueio local do aplicativo no aparelho
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Relatórios */}
        <button
          onClick={() => onSelectSubView('relatorios')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-purple-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                Relatórios & Exportar Planilha
              </p>
              <p className="text-[11px] text-stone-400">
                Exportação em CSV/Excel e PDF para impressão
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Notificações */}
        <button
          onClick={() => onSelectSubView('notificacoes')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-purple-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-amber-300 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                Notificações & Alertas no Celular
              </p>
              <p className="text-[11px] text-stone-400">
                Gerenciar avisos de compras e notificações no aparelho
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      {/* Instalar App no Celular Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-bold shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-serif-display font-bold text-sm">
                Baixar Aplicativo no Celular
              </p>
              <p className="text-xs text-purple-200">
                Instale no seu Android ou iPhone em segundos
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectSubView('notificacoes')}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-purple-950 font-bold text-xs rounded-xl shadow-xs transition-transform"
          >
            Como Baixar
          </button>
        </div>
      </div>

      {/* Preferences Card: Theme (Claro / Escuro / Automático) */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Aparência do Aplicativo
        </span>

        <div className="grid grid-cols-3 gap-2 p-1.5 bg-stone-100 dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5">
          <button
            onClick={() => onChangeThemeMode('light')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              themeMode === 'light'
                ? 'bg-white text-purple-950 shadow-md ring-2 ring-amber-400'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            Claro
          </button>

          <button
            onClick={() => onChangeThemeMode('dark')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              themeMode === 'dark'
                ? 'bg-purple-900 text-amber-300 shadow-md ring-2 ring-amber-400'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Moon className="w-4 h-4 text-amber-300" />
            Escuro
          </button>

          <button
            onClick={() => onChangeThemeMode('auto')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              themeMode === 'auto'
                ? 'bg-purple-950 text-white shadow-md ring-2 ring-purple-600'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Laptop className="w-4 h-4 text-blue-400" />
            Auto
          </button>
        </div>

        <p className="text-[11px] text-stone-400 px-1">
          {themeMode === 'auto'
            ? 'O aplicativo acompanha automaticamente as configurações de tema claro/escuro do seu aparelho.'
            : themeMode === 'dark'
            ? 'Modo escuro ativado com tons roxos profundos e contraste suave.'
            : 'Modo claro ativado com paleta creme acolhedora.'}
        </p>
      </div>

      {/* Reset Numbers Option Card */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <p className="font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            Zerar Números do Aplicativo
          </p>
          <p className="text-[11px] text-stone-400">
            Zerar contas, extrato e saldos para R$ 0,00
          </p>
        </div>
        <button
          onClick={() => onOpenProfile()}
          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl active:scale-95 transition-all border border-rose-200/60 dark:border-rose-900/50"
        >
          Zerar Dados
        </button>
      </div>
    </div>
  );
};
