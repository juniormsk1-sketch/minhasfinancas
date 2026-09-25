import React, { useState } from 'react';
import { FileText, Download, Printer, Table, Check } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatBRL, formatDatePT } from '../utils/formatters';

export const RelatoriosView: React.FC = () => {
  const { db, activeUser, summary } = useFinance();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const exportCSV = () => {
    const headers = [
      'Data',
      'Tipo',
      'Natureza',
      'Descrição',
      'Valor (R$)',
      'Categoria',
      'Quem Fez',
      'Forma de Pagamento',
      'Privacidade',
    ];

    const rows = db.transactions.map(t => {
      const cat = db.categories.find(c => c.id === t.category_id)?.name || 'Outras';
      const author = db.wallets[0]?.members.find(m => m.user_id === t.person_id)?.name || 'Membro';
      return [
        t.date,
        t.type === 'income' ? 'Entrada' : 'Despesa',
        t.nature === 'fixed' ? 'Fixa' : 'Variável',
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        `"${cat}"`,
        author,
        t.payment_method,
        t.privacy === 'shared' ? 'Compartilhado' : 'Privado',
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `minha_finance_extrato_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif-display font-bold text-base text-purple-950 dark:text-purple-100">
              Relatórios & Exportação
            </h2>
            <p className="text-xs text-stone-500">
              Baixe as finanças da casa em planilha ou imprima para declaração
            </p>
          </div>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          Planilha CSV exportada com sucesso!
        </div>
      )}

      {/* Export Options */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={exportCSV}
          className="p-5 bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl shadow-xs text-left hover:border-purple-300 transition-colors group space-y-2"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Table className="w-5 h-5" />
          </div>
          <p className="font-semibold text-xs text-stone-800 dark:text-stone-200">
            Exportar Planilha (CSV / Excel)
          </p>
          <p className="text-[11px] text-stone-400">
            Compatível com Excel, Google Planilhas e Numbers
          </p>
        </button>

        <button
          onClick={handlePrint}
          className="p-5 bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl shadow-xs text-left hover:border-purple-300 transition-colors group space-y-2"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Printer className="w-5 h-5" />
          </div>
          <p className="font-semibold text-xs text-stone-800 dark:text-stone-200">
            Imprimir ou Gerar PDF
          </p>
          <p className="text-[11px] text-stone-400">
            Resumo visual com saldo, receitas e despesas
          </p>
        </button>
      </div>

      {/* Printable Report Preview */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-5 shadow-xs space-y-3">
        <h3 className="font-serif-display font-bold text-sm text-purple-950 dark:text-purple-100">
          Resumo Geral da Casa
        </h3>

        <div className="divide-y divide-black/5 dark:divide-white/5 text-xs">
          <div className="py-2 flex justify-between">
            <span className="text-stone-500">Saldo Operacional Disponível:</span>
            <span className="font-bold text-emerald-600">{formatBRL(summary.available)}</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-stone-500">Dinheiro Guardado (Reservas):</span>
            <span className="font-bold text-amber-600">{formatBRL(summary.savedMoney)}</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-stone-500">Total de Entradas no Mês:</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">{formatBRL(summary.monthIncome)}</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-stone-500">Total de Despesas no Mês:</span>
            <span className="font-bold text-rose-600">{formatBRL(summary.monthExpense)}</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-stone-500">Contas Pendentes a Pagar:</span>
            <span className="font-bold text-amber-600">{formatBRL(summary.toPay)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
