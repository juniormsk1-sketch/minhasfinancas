import React from 'react';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemName?: string;
  isDeleting?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  description,
  itemName,
  isDeleting = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#23122c] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-black/5 dark:border-white/10 space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="font-serif-display text-lg font-bold text-stone-900 dark:text-stone-100">
            {title}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {description}
          </p>
          {itemName && (
            <div className="mt-2 p-2.5 bg-stone-100 dark:bg-purple-950/40 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
              "{itemName}"
            </div>
          )}
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
          ⚠️ O extrato será recalculado e a atividade ficará registrada no histórico da casa.
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-95 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/30 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Sim, Excluir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
