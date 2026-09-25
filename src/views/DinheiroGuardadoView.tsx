import React, { useState } from 'react';
import {
  PiggyBank,
  Plus,
  ArrowLeftRight,
  ShieldCheck,
  Plane,
  Hammer,
  Sparkles,
  TrendingUp,
  Target,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  ArrowLeft,
  Building
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatBRL } from '../utils/formatters';
import { calculateAccountRealBalance } from '../utils/calculations';
import { Account } from '../types/finance';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface DinheiroGuardadoViewProps {
  onBack: () => void;
}

export const DinheiroGuardadoView: React.FC<DinheiroGuardadoViewProps> = ({ onBack }) => {
  const {
    db,
    hideValues,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransfer,
  } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedReserve, setSelectedReserve] = useState<Account | null>(null);

  // Loading states for immediate feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete modal state
  const [reserveToDelete, setReserveToDelete] = useState<Account | null>(null);

  // New reserve form state
  const [name, setName] = useState('');
  const [balanceStr, setBalanceStr] = useState('');
  const [goalTargetStr, setGoalTargetStr] = useState('');
  const [color, setColor] = useState('#10B981');
  const [icon, setIcon] = useState('ShieldCheck');

  // Edit reserve form state
  const [editName, setEditName] = useState('');
  const [editBalanceStr, setEditBalanceStr] = useState('');
  const [editGoalTargetStr, setEditGoalTargetStr] = useState('');
  const [editColor, setEditColor] = useState('#10B981');

  // Transfer between reserves / accounts state
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [fromAccId, setFromAccId] = useState('');
  const [toAccId, setToAccId] = useState('');
  const [transferDesc, setTransferDesc] = useState('');

  // Filter reserve accounts and checking accounts
  const reserveAccounts = db.accounts.filter(a => a.is_reserve);
  const checkingAccounts = db.accounts.filter(a => !a.is_reserve);

  // Total saved
  const totalSaved = reserveAccounts.reduce(
    (acc, item) => acc + calculateAccountRealBalance(item, db),
    0
  );

  const handleCreateReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    setIsSaving(true);
    const cleanBalance = parseFloat(balanceStr.replace(/\./g, '').replace(',', '.')) || 0;
    const cleanGoal = parseFloat(goalTargetStr.replace(/\./g, '').replace(',', '.')) || undefined;

    try {
      await addAccount({
        name: name.trim(),
        type: 'reserve',
        balance: cleanBalance,
        goal_target: cleanGoal,
        color,
        icon,
        is_reserve: true,
      });

      setName('');
      setBalanceStr('');
      setGoalTargetStr('');
      setIsAddModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (res: Account) => {
    setSelectedReserve(res);
    setEditName(res.name);
    setEditBalanceStr(res.balance > 0 ? res.balance.toString().replace('.', ',') : '');
    setEditGoalTargetStr(res.goal_target ? res.goal_target.toString().replace('.', ',') : '');
    setEditColor(res.color);
    setIsEditModalOpen(true);
  };

  const handleUpdateReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReserve || !editName.trim()) return;

    setIsSaving(true);
    const cleanBalance = parseFloat(editBalanceStr.replace(/\./g, '').replace(',', '.')) || 0;
    const cleanGoal = parseFloat(editGoalTargetStr.replace(/\./g, '').replace(',', '.')) || undefined;

    try {
      await updateAccount({
        ...selectedReserve,
        name: editName.trim(),
        balance: cleanBalance,
        goal_target: cleanGoal,
        color: editColor,
      });
      setIsEditModalOpen(false);
      setSelectedReserve(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = parseFloat(transferAmountStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(cleanAmt) || cleanAmt <= 0) {
      return;
    }
    if (!fromAccId || !toAccId || fromAccId === toAccId) {
      return;
    }

    setIsTransferring(true);
    try {
      await addTransfer({
        amount: cleanAmt,
        from_account_id: fromAccId,
        to_account_id: toAccId,
        description: transferDesc.trim() || 'Aporte / Movimentação de Reserva',
      });

      setTransferAmountStr('');
      setTransferDesc('');
      setIsTransferModalOpen(false);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!reserveToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAccount(reserveToDelete.id);
      setReserveToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Back button and page title bar */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-purple-950 dark:hover:text-amber-400 py-1.5 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Início
        </button>
        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Patrimônio do Casal
        </span>
      </div>

      {/* Top Header Card: Dinheiro Guardado */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-purple-950 p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-900/80">
            Total em Dinheiro Guardado
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-950/10 text-purple-950">
            Isolado do saldo do mês
          </span>
        </div>

        <h1 className="font-serif-display text-4xl font-bold tracking-tight mb-4">
          {formatBRL(totalSaved, hideValues)}
        </h1>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-2.5 px-3 bg-purple-950 hover:bg-purple-900 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nova Reserva
          </button>
          <button
            onClick={() => {
              if (db.accounts.length > 1) {
                setFromAccId(db.accounts[0].id);
                setToAccId(db.accounts[1].id);
              }
              setIsTransferModalOpen(true);
            }}
            className="py-2.5 px-3 bg-white hover:bg-amber-50 active:scale-95 text-purple-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Transferir / Guardar
          </button>
        </div>
      </div>

      {/* Info notice explaining reserve separation */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 p-3.5 rounded-2xl text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <p className="leading-relaxed">
          O <strong>dinheiro guardado</strong> não entra no cálculo do saldo disponível do mês. Ele é a reserva segura do casal (reserva de emergência, viagens, reformas ou objetivos a longo prazo).
        </p>
      </div>

      {/* Reserves List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Suas Reservas ({reserveAccounts.length})
          </span>
          <span className="text-xs text-stone-400">Edite ou transfira a qualquer momento</span>
        </div>

        {reserveAccounts.length === 0 ? (
          <div className="bg-white dark:bg-[#23122c] rounded-3xl p-8 text-center border border-black/5 dark:border-white/10 space-y-3">
            <PiggyBank className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
            <p className="font-semibold text-stone-700 dark:text-stone-300">
              Nenhuma reserva criada ainda
            </p>
            <p className="text-xs text-stone-400">
              Crie uma reserva de emergência ou caixinha de viagem para começar a guardar dinheiro juntos.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="py-2.5 px-4 bg-amber-400 text-purple-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Criar Primeira Reserva
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {reserveAccounts.map(res => {
              const realBal = calculateAccountRealBalance(res, db);
              const progress = res.goal_target ? Math.min(100, (realBal / res.goal_target) * 100) : null;

              return (
                <div
                  key={res.id}
                  className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs space-y-3 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: res.color }}
                      >
                        <PiggyBank className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                          {res.name}
                        </h3>
                        <p className="text-xs text-stone-500">
                          Saldo acumulado: <span className="font-bold text-stone-900 dark:text-stone-100">{formatBRL(realBal, hideValues)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const normalAcc = db.accounts.find(a => !a.is_reserve);
                          setFromAccId(normalAcc?.id || '');
                          setToAccId(res.id);
                          setIsTransferModalOpen(true);
                        }}
                        className="p-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                        title="Guardar nesta reserva"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Aportar
                      </button>
                      <button
                        onClick={() => handleOpenEdit(res)}
                        className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                        title="Editar reserva"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => setReserveToDelete(res)}
                        className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                        title="Excluir reserva"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>

                  {/* Target Goal Progress */}
                  {res.goal_target && (
                    <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>Meta de economia: {formatBRL(res.goal_target, hideValues)}</span>
                        <span className="font-bold text-stone-700 dark:text-stone-300">
                          {progress?.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 dark:bg-black/30 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: res.color,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contas Correntes & Dia a Dia */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Contas do Dia a Dia ({checkingAccounts.length})
          </span>
          <span className="text-xs text-stone-400">Contas bancárias ativas</span>
        </div>

        <div className="space-y-2.5">
          {checkingAccounts.map(acc => {
            const realBal = calculateAccountRealBalance(acc, db);
            return (
              <div
                key={acc.id}
                className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs flex items-center justify-between hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: acc.color || '#3B82F6' }}
                  >
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                      {acc.name}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Saldo em conta: <span className="font-bold text-stone-900 dark:text-stone-100">{formatBRL(realBal, hideValues)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                    title="Editar dados da conta"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  {checkingAccounts.length > 1 && (
                    <button
                      onClick={() => setReserveToDelete(acc)}
                      className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title="Excluir conta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1. Modal Nova Reserva */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#23122c] w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-amber-500" />
                Nova Reserva / Dinheiro Guardado
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReserve} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                  Nome da Reserva
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reserva de Emergência, Viagem Europa, Carro Novo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-purple-950/30 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                    Saldo Inicial (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={balanceStr}
                    onChange={e => setBalanceStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-purple-950/30 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                    Meta Objetivo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 10000,00"
                    value={goalTargetStr}
                    onChange={e => setGoalTargetStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-purple-950/30 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1.5">
                  Cor da Reserva
                </label>
                <div className="flex gap-2.5">
                  {['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-115 ring-2 ring-purple-900 ring-offset-2' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="w-full py-3 bg-[#ffcc00] hover:bg-amber-400 active:scale-95 text-purple-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando Reserva...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Salvar Reserva
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Editar Reserva */}
      {isEditModalOpen && selectedReserve && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#23122c] w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                Editar Reserva
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateReserve} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                  Nome da Reserva
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-purple-950/30 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                    Saldo Base (R$)
                  </label>
                  <input
                    type="text"
                    value={editBalanceStr}
                    onChange={e => setEditBalanceStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-purple-950/30 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                    Meta Objetivo (R$)
                  </label>
                  <input
                    type="text"
                    value={editGoalTargetStr}
                    onChange={e => setEditGoalTargetStr(e.target.value)}
                    placeholder="Sem meta"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-purple-950/30 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1.5">
                  Cor da Reserva
                </label>
                <div className="flex gap-2.5">
                  {['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${editColor === c ? 'scale-115 ring-2 ring-purple-900 ring-offset-2' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving || !editName.trim()}
                  className="w-full py-3 bg-[#ffcc00] hover:bg-amber-400 active:scale-95 text-purple-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Transferir / Guardar */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#23122c] w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-amber-500" />
                Transferir entre Contas / Guardar
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                  Valor a Transferir (R$)
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={transferAmountStr}
                  onChange={e => setTransferAmountStr(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-purple-950/30 text-stone-900 dark:text-stone-100 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                    Conta de Origem (Sai de)
                  </label>
                  <select
                    value={fromAccId}
                    onChange={e => setFromAccId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-purple-950/30 text-stone-900 dark:text-stone-100 text-xs focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    {db.accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.is_reserve ? 'Reserva' : 'Conta'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                    Conta de Destino (Entra em)
                  </label>
                  <select
                    value={toAccId}
                    onChange={e => setToAccId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-purple-950/30 text-stone-900 dark:text-stone-100 text-xs focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    {db.accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.is_reserve ? 'Reserva' : 'Conta'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 block mb-1">
                  Motivo / Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aporte mensal da reserva, resgate para viagem"
                  value={transferDesc}
                  onChange={e => setTransferDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-purple-950/30 text-stone-900 dark:text-stone-100 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isTransferring || !transferAmountStr.trim()}
                  className="w-full py-3 bg-[#ffcc00] hover:bg-amber-400 active:scale-95 text-purple-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando Transferência...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Confirmar Transferência
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Reserve */}
      <ConfirmDeleteModal
        isOpen={Boolean(reserveToDelete)}
        title="Excluir Reserva"
        description="Tem certeza que deseja excluir esta reserva de dinheiro guardado?"
        itemName={reserveToDelete?.name}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setReserveToDelete(null)}
      />
    </div>
  );
};
