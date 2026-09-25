import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Sparkles,
  Lock,
  Users,
  Calendar,
  CreditCard,
  Building,
  Check,
  Loader2,
  FileText,
  DollarSign,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { NewLaunchTrigger } from './BottomNav';
import { PaymentMethod, RecurrenceType, PrivacyType, ExpenseNature } from '../types/finance';

interface NewTransactionModalProps {
  isOpen: boolean;
  initialTrigger?: NewLaunchTrigger;
  onClose: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  initialTrigger,
  onClose,
}) => {
  const {
    db,
    activeUser,
    partner,
    addTransaction,
    addTransfer,
  } = useFinance();

  // Mode: normal transaction or transfer
  const [isTransfer, setIsTransfer] = useState(false);

  // Form State
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [nature, setNature] = useState<ExpenseNature>('variable');
  const [incomeStatus, setIncomeStatus] = useState<'pending' | 'completed'>('completed');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [personId, setPersonId] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyType>('shared');
  const [recurring, setRecurring] = useState<RecurrenceType>('none');
  const [installments, setInstallments] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(undefined);

  // Transfer specific
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');

  // AI Scanner state
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiScanFeedback, setAiScanFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial trigger on open
  useEffect(() => {
    if (!isOpen) return;

    if (initialTrigger) {
      if (initialTrigger.type === 'transfer') {
        setIsTransfer(true);
        if (db.accounts.length > 1) {
          setFromAccountId(db.accounts[0].id);
          setToAccountId(db.accounts[1].id);
        }
      } else if (initialTrigger.type === 'card') {
        setIsTransfer(false);
        setType('expense');
        setNature('variable');
        setPaymentMethod('credito');
        if (db.credit_cards.length > 0) {
          setCardId(db.credit_cards[0].id);
        }
      } else {
        setIsTransfer(false);
        setType(initialTrigger.type as 'income' | 'expense');
        if (initialTrigger.nature) {
          setNature(initialTrigger.nature);
        }
        if (initialTrigger.type === 'income') {
          setCategoryId('cat_salario');
        } else {
          setCategoryId(initialTrigger.nature === 'fixed' ? 'cat_aluguel' : 'cat_mercado');
        }
      }
    }

    setPersonId(activeUser.user_id);
    if (db.accounts.length > 0 && !accountId) {
      setAccountId(db.accounts[0].id);
    }
  }, [isOpen, initialTrigger, activeUser.user_id, db.accounts, db.credit_cards]);

  if (!isOpen) return null;

  // Filter categories by type
  const availableCategories = db.categories.filter(c => c.type === type);

  // Handle AI Receipt Scanner
  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiScanning(true);
    setAiScanFeedback('Lendo comprovante com IA...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        setAttachmentUrl(base64Data);

        try {
          const res = await fetch('/api/extract-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type || 'image/jpeg',
            }),
          });

          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            if (d.description) setDescription(d.description);
            if (d.amount) setAmountStr(d.amount.toFixed(2).replace('.', ','));
            if (d.date) setDate(d.date);
            if (d.is_income !== undefined) {
              setType(d.is_income ? 'income' : 'expense');
            }
            if (d.payment_method_suggestion) {
              setPaymentMethod(d.payment_method_suggestion as PaymentMethod);
            }
            // Match category suggestion
            if (d.category_suggestion) {
              const matchedCat = db.categories.find(c =>
                c.name.toLowerCase().includes(d.category_suggestion.toLowerCase())
              );
              if (matchedCat) setCategoryId(matchedCat.id);
            }

            setAiScanFeedback('✨ Comprovante lido com sucesso pela IA!');
            setTimeout(() => setAiScanFeedback(null), 4000);
          } else {
            setAiScanFeedback('⚠️ Não foi possível ler todos os dados. Preencha os campos abaixo.');
          }
        } catch (apiErr) {
          console.error('API receipt scan error:', apiErr);
          setAiScanFeedback('⚠️ Erro na IA. Preencha os valores manualmente.');
        } finally {
          setIsAiScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File read error:', err);
      setIsAiScanning(false);
      setAiScanFeedback('Erro ao abrir o arquivo');
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanAmount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return;
    }

    setIsSaving(true);
    try {
      if (isTransfer) {
        if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
          setIsSaving(false);
          return;
        }
        await addTransfer({
          amount: cleanAmount,
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          date,
          description: description || 'Transferência entre contas',
        });
        onClose();
        return;
      }

      if (!description.trim()) {
        setIsSaving(false);
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const isPending = type === 'income' && (incomeStatus === 'pending' || date > todayStr);

      await addTransaction({
        type,
        nature: type === 'expense' ? nature : undefined,
        status: isPending ? 'pending' : 'completed',
        description: description.trim(),
        amount: cleanAmount,
        date,
        category_id: categoryId || availableCategories[0]?.id || 'cat_outras_despesas',
        payment_method: paymentMethod,
        account_id: paymentMethod !== 'credito' ? accountId : undefined,
        card_id: paymentMethod === 'credito' ? cardId : undefined,
        person_id: personId || activeUser.user_id,
        privacy,
        recurring,
        installments: paymentMethod === 'credito' ? installments : 1,
        notes: notes.trim() || undefined,
        attachment_url: attachmentUrl,
      });

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] dark:bg-[#1f0e2b] w-full max-w-[512px] max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="font-serif-display text-xl font-bold text-purple-950 dark:text-purple-100">
              {isTransfer ? 'Transferência' : type === 'income' ? 'Nova Entrada' : 'Nova Despesa'}
            </h2>
            {!isTransfer && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                type === 'income'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                  : nature === 'fixed'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
              }`}>
                {type === 'income' ? 'Receita' : nature === 'fixed' ? 'Fixa' : 'Variável'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
          {/* AI Scanner Banner */}
          {!isTransfer && (
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-3.5 shadow-md relative overflow-hidden space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-purple-950 flex items-center justify-center font-bold shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">
                    Leitura Automática de Comprovante
                  </p>
                  <p className="text-[11px] text-purple-200">
                    A IA extrai valor, descrição e data pelo cupom ou comprovante
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAiScanning}
                className="w-full py-2.5 px-3 bg-[#ffcc00] hover:bg-amber-300 active:scale-95 text-purple-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {isAiScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Lendo comprovante com IA...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 stroke-[2.5]" />
                    Ler comprovante e preencher automático
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleReceiptFileChange}
              />

              {aiScanFeedback && (
                <div className="mt-2 text-xs bg-black/30 backdrop-blur-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{aiScanFeedback}</span>
                </div>
              )}
            </div>
          )}

          {/* Amount Input (Display Style) */}
          <div className="bg-white dark:bg-[#281434] rounded-2xl p-4 border border-black/5 dark:border-white/10 text-center shadow-xs">
            <label className="block text-xs font-semibold text-stone-400 dark:text-stone-400 uppercase tracking-wider mb-1">
              Valor do Lançamento
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl font-bold text-stone-400">R$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                autoFocus
                className="font-serif-display text-4xl font-bold bg-transparent text-center text-purple-950 dark:text-purple-100 focus:outline-none w-56"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Supermercado, Aluguel, Salário..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#281434] border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Income Status selector (A receber vs Já recebido) */}
          {type === 'income' && !isTransfer && (
            <div className="bg-white dark:bg-[#281434] rounded-2xl p-3 border border-black/5 dark:border-white/10 space-y-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Situação desta Entrada
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIncomeStatus('pending')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    incomeStatus === 'pending' || date > new Date().toISOString().split('T')[0]
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-stone-100 dark:bg-black/30 text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  A receber (previsto)
                </button>

                <button
                  type="button"
                  onClick={() => setIncomeStatus('completed')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    incomeStatus === 'completed' && date <= new Date().toISOString().split('T')[0]
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-stone-100 dark:bg-black/30 text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Já recebido (no saldo)
                </button>
              </div>
              <p className="text-[10px] text-stone-400">
                {incomeStatus === 'pending' || date > new Date().toISOString().split('T')[0]
                  ? 'ℹ️ Entrará no painel como "A receber" e NÃO somará no Saldo Atual até você receber.'
                  : 'ℹ️ Somará imediatamente no Saldo Atual da conta.'}
              </p>
            </div>
          )}

          {/* Transfer Origin and Destination */}
          {isTransfer ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  De (Origem)
                </label>
                <select
                  value={fromAccountId}
                  onChange={e => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#281434] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  {db.accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.is_reserve ? 'Reserva' : 'Conta'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Para (Destino)
                </label>
                <select
                  value={toAccountId}
                  onChange={e => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#281434] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  {db.accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.is_reserve ? 'Reserva' : 'Conta'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Categoria
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-white/60 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5">
                  {availableCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(cat.id);
                        if (type === 'expense' && cat.nature) {
                          setNature(cat.nature);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        categoryId === cat.id
                          ? 'bg-purple-900 text-white font-medium shadow-xs'
                          : 'bg-white dark:bg-[#281434] text-stone-700 dark:text-stone-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      {type === 'expense' && (
                        <span className={`text-[9px] px-1 py-0.2 rounded font-medium shrink-0 ${
                          categoryId === cat.id
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-100 dark:bg-black/30 text-stone-500'
                        }`}>
                          {cat.nature === 'fixed' ? 'Fixa' : 'Var'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method & Account/Card */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#281434] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="pix">PIX</option>
                    <option value="debito">Cartão de Débito</option>
                    <option value="credito">Cartão de Crédito</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="dinheiro">Dinheiro Físico</option>
                    <option value="transferencia">Transferência / TED</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  {paymentMethod === 'credito' ? (
                    <>
                      <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                        Qual Cartão?
                      </label>
                      <select
                        value={cardId}
                        onChange={e => setCardId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#281434] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        {db.credit_cards.map(card => (
                          <option key={card.id} value={card.id}>
                            {card.name} ({card.bank})
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                        Conta / Carteira
                      </label>
                      <select
                        value={accountId}
                        onChange={e => setAccountId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#281434] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        {db.accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>

              {/* Installments if Credit Card */}
              {paymentMethod === 'credito' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Parcelamento
                  </label>
                  <select
                    value={installments}
                    onChange={e => setInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#281434] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value={1}>À vista (1 parcela)</option>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(n => (
                      <option key={n} value={n}>
                        {n}x de {amountStr ? (parseFloat(amountStr.replace(',', '.')) / n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : `parcelas`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Date & Who paid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#281434] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Quem fez?
              </label>
              <select
                value={personId}
                onChange={e => setPersonId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#281434] border border-black/10 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {db.wallets[0]?.members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Privacy Switcher */}
          {!isTransfer && (
            <div className="bg-white dark:bg-[#281434] p-3 rounded-2xl border border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {privacy === 'shared' ? (
                  <Users className="w-5 h-5 text-purple-700 dark:text-amber-400" />
                ) : (
                  <Lock className="w-5 h-5 text-stone-500" />
                )}
                <div>
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {privacy === 'shared' ? 'Compartilhado com o casal' : 'Lançamento Privado (Individual)'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {privacy === 'shared'
                      ? 'Ambos visualizam e editam em tempo real'
                      : 'Visível e editável apenas por você'}
                  </p>
                </div>
              </div>

              <div className="flex bg-stone-100 dark:bg-black/30 p-0.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setPrivacy('shared')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    privacy === 'shared'
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Casal
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacy('individual')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    privacy === 'individual'
                      ? 'bg-stone-800 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Privado
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 bg-[#ffcc00] hover:bg-amber-400 text-purple-950 font-bold text-base rounded-2xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando Lançamento...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                Salvar Lançamento
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
