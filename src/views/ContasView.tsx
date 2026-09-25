import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle,
  X,
  Building,
  Tag,
  Trash2,
  Edit2,
  Loader2,
  Check,
  RotateCcw
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatBRL, formatDatePT } from '../utils/formatters';
import { Bill, Transaction } from '../types/finance';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface ContasViewProps {
  initialFilter?: 'payable' | 'receivable';
}

export const ContasView: React.FC<ContasViewProps> = ({ initialFilter = 'payable' }) => {
  const {
    db,
    activeUser,
    hideValues,
    payBill,
    addBill,
    updateBill,
    deleteBill,
    deleteTransaction,
  } = useFinance();

  const [billTypeFilter, setBillTypeFilter] = useState<'payable' | 'receivable'>(initialFilter);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'paid'>('pending');

  // Pay bill modal
  const [selectedBillToPay, setSelectedBillToPay] = useState<Bill | null>(null);
  const [payAccountId, setPayAccountId] = useState(db.accounts[0]?.id || '');
  const [isPaying, setIsPaying] = useState(false);

  // Bill form modal (Create or Edit)
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billModalMode, setCardModalMode] = useState<'create' | 'edit'>('create');
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [billDesc, setBillDesc] = useState('');
  const [billAmountStr, setBillAmountStr] = useState('');
  const [billDueDate, setBillDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [billCategory, setBillCategory] = useState(db.categories[0]?.id || 'cat_energia');
  const [billType, setBillType] = useState<'payable' | 'receivable'>('payable');
  const [billRecurring, setBillRecurring] = useState<'none' | 'monthly' | 'weekly' | 'yearly'>('monthly');
  const [isSavingBill, setIsSavingBill] = useState(false);

  // Delete bill modal
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [isDeletingBill, setIsDeletingBill] = useState(false);

  // Delete future tx modal
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter bills
  const filteredBills = db.bills.filter(b => {
    if (b.type !== billTypeFilter) return false;
    if (b.status !== statusFilter) return false;
    return true;
  });

  // Also include future transactions when on 'pending' view
  const futureTransactions = useMemo(() => {
    if (statusFilter !== 'pending') return [];
    return db.transactions.filter(t => {
      if (t.date <= todayStr) return false;
      if (billTypeFilter === 'payable' && t.type === 'expense') return true;
      if (billTypeFilter === 'receivable' && t.type === 'income') return true;
      return false;
    });
  }, [db.transactions, billTypeFilter, statusFilter, todayStr]);

  const totalAmount = filteredBills.reduce((acc, b) => acc + b.amount, 0) +
    futureTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Open Create Bill Modal
  const handleOpenCreateBill = () => {
    setCardModalMode('create');
    setEditingBill(null);
    setBillDesc('');
    setBillAmountStr('');
    setBillDueDate(new Date().toISOString().split('T')[0]);
    setBillCategory(billTypeFilter === 'payable' ? 'cat_energia' : 'cat_salario');
    setBillType(billTypeFilter);
    setBillRecurring('monthly');
    setIsBillModalOpen(true);
  };

  // Open Edit Bill Modal
  const handleOpenEditBill = (bill: Bill) => {
    setCardModalMode('edit');
    setEditingBill(bill);
    setBillDesc(bill.description);
    setBillAmountStr(bill.amount.toFixed(2).replace('.', ','));
    setBillDueDate(bill.due_date);
    setBillCategory(bill.category_id);
    setBillType(bill.type);
    setBillRecurring(bill.recurring || 'none');
    setIsBillModalOpen(true);
  };

  // Save Bill
  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billDesc.trim()) return;

    setIsSavingBill(true);
    const cleanAmount = parseFloat(billAmountStr.replace(/\./g, '').replace(',', '.')) || 0;

    try {
      if (billModalMode === 'create') {
        await addBill({
          description: billDesc.trim(),
          amount: cleanAmount,
          due_date: billDueDate,
          category_id: billCategory,
          type: billType,
          recurring: billRecurring,
          person_id: activeUser.user_id,
          privacy: 'shared',
          status: 'pending',
        });
      } else if (editingBill) {
        await updateBill({
          ...editingBill,
          description: billDesc.trim(),
          amount: cleanAmount,
          due_date: billDueDate,
          category_id: billCategory,
          type: billType,
          recurring: billRecurring,
        });
      }
      setIsBillModalOpen(false);
    } finally {
      setIsSavingBill(false);
    }
  };

  // Confirm Pay Bill
  const handleConfirmPay = async () => {
    if (!selectedBillToPay) return;
    setIsPaying(true);
    try {
      await payBill(selectedBillToPay.id, payAccountId);
      setSelectedBillToPay(null);
    } finally {
      setIsPaying(false);
    }
  };

  // Confirm Delete Bill
  const handleConfirmDeleteBill = async () => {
    if (!billToDelete) return;
    setIsDeletingBill(true);
    try {
      await deleteBill(billToDelete.id);
      setBillToDelete(null);
    } finally {
      setIsDeletingBill(false);
    }
  };

  // Confirm Delete Future Tx
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

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Top Filter Buttons */}
      <div className="grid grid-cols-2 gap-2 bg-white dark:bg-[#23122c] p-1.5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs">
        <button
          onClick={() => setBillTypeFilter('payable')}
          className={`py-2 text-xs font-semibold rounded-xl active:scale-95 transition-all ${
            billTypeFilter === 'payable'
              ? 'bg-amber-500 text-purple-950 shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          Contas a Pagar
        </button>
        <button
          onClick={() => setBillTypeFilter('receivable')}
          className={`py-2 text-xs font-semibold rounded-xl active:scale-95 transition-all ${
            billTypeFilter === 'receivable'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          Valores a Receber
        </button>
      </div>

      {/* Sub Filter: Pendentes vs Pagas + Add Button */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex gap-1 bg-stone-100 dark:bg-black/30 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-lg font-medium active:scale-95 transition-all ${
              statusFilter === 'pending'
                ? 'bg-white dark:bg-[#23122c] shadow-xs text-stone-900 dark:text-stone-100'
                : 'text-stone-500'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1 rounded-lg font-medium active:scale-95 transition-all ${
              statusFilter === 'paid'
                ? 'bg-white dark:bg-[#23122c] shadow-xs text-stone-900 dark:text-stone-100'
                : 'text-stone-500'
            }`}
          >
            Pagas / Recebidas
          </button>
        </div>

        <button
          onClick={handleOpenCreateBill}
          className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-purple-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Conta
        </button>
      </div>

      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-stone-500">
          {filteredBills.length + futureTransactions.length} registros
        </span>
        <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
          Total: {formatBRL(totalAmount, hideValues)}
        </span>
      </div>

      {/* Bills & Future items list */}
      {filteredBills.length === 0 && futureTransactions.length === 0 ? (
        <div className="bg-white dark:bg-[#23122c] rounded-3xl p-8 text-center border border-black/5 dark:border-white/10 space-y-3">
          <Calendar className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
          <p className="font-semibold text-sm text-stone-700 dark:text-stone-300">
            Nenhuma conta nesta categoria
          </p>
          <button
            onClick={handleOpenCreateBill}
            className="py-2 px-4 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar {billTypeFilter === 'payable' ? 'Conta a Pagar' : 'Valor a Receber'}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Bills */}
          {filteredBills.map(bill => {
            const isPayable = bill.type === 'payable';

            return (
              <div
                key={bill.id}
                className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                      isPayable ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                      {bill.description}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {isPayable ? 'Vencimento' : 'Data a receber'}: {formatDatePT(bill.due_date)}
                    </p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div>
                    <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                      {formatBRL(bill.amount, hideValues)}
                    </p>
                    <span className="text-[10px] text-stone-400">
                      {bill.recurring !== 'none' ? `Recorrente (${bill.recurring})` : 'Única'}
                    </span>
                  </div>

                  {bill.status === 'pending' && (
                    <button
                      onClick={() => setSelectedBillToPay(bill)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                    >
                      Pagar
                    </button>
                  )}

                  {/* Edit Bill Button */}
                  <button
                    onClick={() => handleOpenEditBill(bill)}
                    className="px-2.5 py-1 text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-xl active:scale-95 transition-all text-xs font-bold flex items-center gap-1"
                    title="Editar conta"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  {/* Delete Bill Button */}
                  <button
                    onClick={() => setBillToDelete(bill)}
                    className="px-2.5 py-1 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 rounded-xl active:scale-95 transition-all text-xs font-bold flex items-center gap-1"
                    title="Excluir conta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Future Transactions linked */}
          {futureTransactions.map(tx => (
            <div
              key={tx.id}
              className="bg-stone-50 dark:bg-[#1c0f24] border border-dashed border-black/10 dark:border-white/10 rounded-3xl p-4 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-300 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                      {tx.description}
                    </p>
                    <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded font-semibold">
                      Agendado
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {tx.type === 'expense' ? 'Vencimento' : 'Data a receber'}: {formatDatePT(tx.date)}
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center gap-2">
                <div>
                  <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                    {formatBRL(tx.amount, hideValues)}
                  </p>
                  <span className="text-[10px] text-stone-400 uppercase">
                    {tx.payment_method}
                  </span>
                </div>

                <button
                  onClick={() => setTxToDelete(tx)}
                  className="px-2.5 py-1 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 rounded-xl active:scale-95 transition-all text-xs font-bold flex items-center gap-1"
                  title="Excluir lançamento futuro"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bill Form Modal (Create or Edit) */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#201027] w-full max-w-md rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100">
                {billModalMode === 'create' ? 'Agendar Nova Conta' : 'Editar Conta'}
              </h3>
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Tipo de Conta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillType('payable')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                      billType === 'payable'
                        ? 'bg-amber-500 text-purple-950 shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Conta a Pagar
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillType('receivable')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                      billType === 'receivable'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Valor a Receber
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Energia Enel, Aluguel, Internet Fibra"
                  value={billDesc}
                  onChange={e => setBillDesc(e.target.value)}
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
                    value={billAmountStr}
                    onChange={e => setBillAmountStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    {billType === 'payable' ? 'Data de Vencimento' : 'Data a Receber'}
                  </label>
                  <input
                    type="date"
                    required
                    value={billDueDate}
                    onChange={e => setBillDueDate(e.target.value)}
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
                    value={billCategory}
                    onChange={e => setBillCategory(e.target.value)}
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
                    Recorrência
                  </label>
                  <select
                    value={billRecurring}
                    onChange={e => setBillRecurring(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="none">Única (Não repete)</option>
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="py-2.5 px-4 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingBill}
                  className="py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSavingBill ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {billModalMode === 'create' ? 'Salvar Conta' : 'Atualizar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Bill Modal */}
      {selectedBillToPay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#23122c] w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="font-serif-display text-lg font-bold text-purple-950 dark:text-purple-100">
                Confirmar Pagamento de Conta
              </h3>
              <button
                onClick={() => setSelectedBillToPay(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-black/20 rounded-2xl space-y-1 text-center">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {selectedBillToPay.description}
              </p>
              <p className="font-serif-display text-3xl font-bold text-purple-950 dark:text-purple-100">
                {formatBRL(selectedBillToPay.amount, hideValues)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                De qual conta debitar?
              </label>
              <select
                value={payAccountId}
                onChange={e => setPayAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1a0a2a] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {db.accounts.filter(a => !a.is_reserve).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatBRL(acc.balance, hideValues)})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleConfirmPay}
              disabled={isPaying}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPaying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando Baixa...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar Baixa de Pagamento
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Bill */}
      <ConfirmDeleteModal
        isOpen={Boolean(billToDelete)}
        title="Excluir Conta Agendada"
        description="Tem certeza que deseja excluir esta conta? Ela não constará mais nos lembretes."
        itemName={billToDelete?.description}
        isDeleting={isDeletingBill}
        onConfirm={handleConfirmDeleteBill}
        onClose={() => setBillToDelete(null)}
      />

      {/* Confirmation Modal for Deleting Future Transaction */}
      <ConfirmDeleteModal
        isOpen={Boolean(txToDelete)}
        title="Excluir Lançamento Agendado"
        description="Tem certeza que deseja excluir este lançamento futuro?"
        itemName={txToDelete?.description}
        isDeleting={isDeletingTx}
        onConfirm={handleConfirmDeleteTx}
        onClose={() => setTxToDelete(null)}
      />
    </div>
  );
};
