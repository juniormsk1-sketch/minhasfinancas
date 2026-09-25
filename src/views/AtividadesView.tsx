import React from 'react';
import { History, PlusCircle, Edit3, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatBRL, formatShortDatePT, formatTimePT } from '../utils/formatters';

export const AtividadesView: React.FC = () => {
  const { db, hideValues } = useFinance();

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <PlusCircle className="w-4 h-4 text-emerald-500" />;
      case 'update':
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'pay':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-stone-400" />;
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Header Info */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif-display font-bold text-base text-purple-950 dark:text-purple-100">
              Histórico & Auditoria do Casal
            </h2>
            <p className="text-xs text-stone-500">
              Transparência total: veja quem criou, editou ou pagou cada item
            </p>
          </div>
        </div>
      </div>

      {/* Activities Feed */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl divide-y divide-black/5 dark:divide-white/5 overflow-hidden shadow-xs">
        {db.activities.length === 0 ? (
          <p className="text-xs text-stone-400 p-6 text-center">Nenhuma atividade registrada ainda</p>
        ) : (
          db.activities.map(act => (
            <div key={act.id} className="p-3.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={act.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={act.user_name}
                    className="w-9 h-9 rounded-full object-cover shadow-xs"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-purple-950 rounded-full p-0.5 shadow-xs">
                    {getActionIcon(act.action)}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 leading-snug">
                    <span className="text-purple-900 dark:text-amber-400">{act.user_name}</span> {act.description.replace(`${act.user_name} `, '')}
                  </p>
                  {act.details && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {act.details}
                    </p>
                  )}
                  <p className="text-[10px] text-stone-400 mt-1">
                    {formatShortDatePT(act.created_date)} às {formatTimePT(act.created_date)}
                  </p>
                </div>
              </div>

              {act.amount != null && (
                <span className="font-semibold text-xs text-stone-800 dark:text-stone-200 shrink-0">
                  {formatBRL(act.amount, hideValues)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
