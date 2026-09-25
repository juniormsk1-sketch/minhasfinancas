import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingDown,
  Target,
  PiggyBank,
  AlertTriangle,
  Heart,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  X,
  Lightbulb,
  TrendingUp,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { generateFinancialSuggestions, FinancialSuggestion } from '../utils/financialSuggestions';

interface SmartFinancialInsightsCardProps {
  onNavigateTarget?: (target: 'orcamentos' | 'contas' | 'reservas' | 'cartoes' | 'movimentos') => void;
  onOpenDinheiroGuardado?: () => void;
}

export const SmartFinancialInsightsCard: React.FC<SmartFinancialInsightsCardProps> = ({
  onNavigateTarget,
  onOpenDinheiroGuardado,
}) => {
  const { db, summary, activeUser } = useFinance();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Compute suggestions based on current consumption habits
  const rawSuggestions = useMemo(() => {
    return generateFinancialSuggestions(db, summary, activeUser.user_id);
  }, [db, summary, activeUser.user_id]);

  const activeSuggestions = useMemo(() => {
    return rawSuggestions.filter(s => !dismissedIds.includes(s.id));
  }, [rawSuggestions, dismissedIds]);

  // Handle bounds
  const safeIndex = activeSuggestions.length > 0
    ? Math.min(currentIndex, activeSuggestions.length - 1)
    : 0;

  const currentSuggestion = activeSuggestions[safeIndex];

  if (!currentSuggestion) return null;

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeSuggestions.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activeSuggestions.length) % activeSuggestions.length);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  const handleAction = (suggestion: FinancialSuggestion) => {
    if (!suggestion.actionTarget) return;

    if (suggestion.actionTarget === 'reservas') {
      if (onOpenDinheiroGuardado) {
        onOpenDinheiroGuardado();
        return;
      }
    }

    if (onNavigateTarget) {
      onNavigateTarget(suggestion.actionTarget);
    }
  };

  const getIcon = (type: FinancialSuggestion['iconType']) => {
    switch (type) {
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400/20" />;
      case 'target':
        return <Target className="w-5 h-5 text-purple-600 dark:text-purple-300" />;
      case 'piggy':
        return <PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'heart':
        return <Heart className="w-5 h-5 text-pink-500 fill-pink-400/20" />;
      default:
        return <Lightbulb className="w-5 h-5 text-amber-500" />;
    }
  };

  const getPriorityBadgeClass = (priority: FinancialSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-900/50';
      case 'medium':
        return 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800/50';
      default:
        return 'bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800/50';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-purple-50/40 to-amber-50/30 dark:from-[#23122c] dark:via-[#1c0c24] dark:to-[#271533] border border-purple-200/70 dark:border-purple-800/40 shadow-sm p-4 sm:p-5 transition-all">
      {/* Decorative top accent glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 dark:bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Title and Pagination */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif-display font-bold text-xs uppercase tracking-wider text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
              Sugestão Financeira Inteligente
            </h3>
            <span className="text-[10px] text-stone-500 dark:text-stone-400">
              Análise baseada nos hábitos de consumo do casal
            </span>
          </div>
        </div>

        {/* Carousel indicators and arrows if multiple */}
        {activeSuggestions.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handlePrev}
              title="Sugestão anterior"
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 px-1">
              {safeIndex + 1}/{activeSuggestions.length}
            </span>
            <button
              onClick={handleNext}
              title="Próxima sugestão"
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="bg-white/80 dark:bg-black/25 backdrop-blur-xs rounded-2xl p-4 border border-black/5 dark:border-white/5 space-y-2.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-50 dark:bg-white/5 flex items-center justify-center shrink-0 shadow-xs border border-black/5 dark:border-white/10 mt-0.5">
              {getIcon(currentSuggestion.iconType)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(currentSuggestion.priority)}`}>
                  {currentSuggestion.badge}
                </span>

                {currentSuggestion.impact && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                    {currentSuggestion.impact}
                  </span>
                )}
              </div>

              <h4 className="font-serif-display font-bold text-sm text-stone-900 dark:text-stone-100">
                {currentSuggestion.title}
              </h4>
            </div>
          </div>

          <button
            onClick={() => handleDismiss(currentSuggestion.id)}
            title="Dispensar sugestão"
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-13 sm:pl-13">
          {currentSuggestion.message}
        </p>

        {/* Action Button */}
        {currentSuggestion.actionLabel && currentSuggestion.actionTarget && (
          <div className="pt-1 flex justify-end">
            <button
              onClick={() => handleAction(currentSuggestion)}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-purple-900 hover:bg-purple-950 active:scale-95 text-amber-300 dark:text-amber-400 font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <span>{currentSuggestion.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Progress pagination dots */}
      {activeSuggestions.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-2.5">
          {activeSuggestions.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === safeIndex
                  ? 'w-5 bg-purple-800 dark:bg-amber-400'
                  : 'w-1.5 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
