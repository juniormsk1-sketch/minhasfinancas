import { FinanceDatabase, FinanceSummary, Transaction, Bill, Category, Budget } from '../types/finance';

export interface FinancialSuggestion {
  id: string;
  type: 'savings' | 'alert' | 'budget' | 'couple' | 'goal';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  impact?: string;
  badge: string;
  actionLabel?: string;
  actionTarget?: 'orcamentos' | 'contas' | 'reservas' | 'cartoes' | 'movimentos';
  iconType: 'sparkles' | 'target' | 'piggy' | 'alert' | 'heart' | 'wallet';
}

/**
 * Intelligent financial heuristic analysis based on actual consumption habits,
 * fixed vs variable distribution, upcoming commitments, and couple goals.
 */
export function generateFinancialSuggestions(
  db: FinanceDatabase,
  summary: FinanceSummary,
  activeUserId: string
): FinancialSuggestion[] {
  const suggestions: FinancialSuggestion[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // 1. Transactions of the current month
  const monthTransactions = db.transactions.filter(
    tx => tx.date.startsWith(currentMonthStr)
  );

  const monthExpenses = monthTransactions.filter(tx => tx.type === 'expense');
  const totalMonthExpense = monthExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  const totalMonthIncome = summary.monthIncome;

  // 2. Spending by category
  const categoryTotals: Record<string, number> = {};
  for (const tx of monthExpenses) {
    categoryTotals[tx.category_id] = (categoryTotals[tx.category_id] || 0) + tx.amount;
  }

  // Find top category
  let topCategoryId = '';
  let topCategoryAmount = 0;
  for (const [catId, amount] of Object.entries(categoryTotals)) {
    if (amount > topCategoryAmount) {
      topCategoryAmount = amount;
      topCategoryId = catId;
    }
  }

  const topCategory = db.categories.find(c => c.id === topCategoryId);

  // 3. Rule 50/30/20 & Fixed vs Variable Check
  if (totalMonthIncome > 0 && totalMonthExpense > 0) {
    const fixedRatio = (summary.monthFixedExpense / totalMonthIncome) * 100;
    const varRatio = (summary.monthVarExpense / totalMonthIncome) * 100;

    if (varRatio > 35) {
      const estimatedSaving = Math.round(summary.monthVarExpense * 0.15);
      suggestions.push({
        id: 'sug_variable_expenses',
        type: 'savings',
        priority: 'high',
        title: 'Otimização de Gastos do Dia a Dia',
        message: `As despesas variáveis somam ${varRatio.toFixed(0)}% da renda do casal. Pequenos ajustes em lanches, saídas ou supérfluos podem liberar cerca de R$ ${estimatedSaving}/mês para o casal guardar.`,
        impact: `Potencial de economia: R$ ${estimatedSaving}/mês`,
        badge: 'Hábito de Consumo',
        actionLabel: 'Ver despesas variáveis',
        actionTarget: 'movimentos',
        iconType: 'sparkles',
      });
    }

    if (fixedRatio > 55) {
      suggestions.push({
        id: 'sug_fixed_ratio',
        type: 'alert',
        priority: 'medium',
        title: 'Comprometimento de Custos Fixos',
        message: `Custos fixos e essenciais representam ${fixedRatio.toFixed(0)}% dos ganhos do mês. Tente renegociar assinaturas, planos de internet ou energia para aliviar a margem da casa.`,
        impact: 'Margem de segurança apertada',
        badge: 'Atenção ao Orçamento',
        actionLabel: 'Analisar despesas',
        actionTarget: 'movimentos',
        iconType: 'alert',
      });
    }
  }

  // 4. Category Dominance Suggestion (e.g. Mercado or Alimentação fora)
  if (topCategory && totalMonthExpense > 0 && (topCategoryAmount / totalMonthExpense) > 0.3) {
    const sharePercent = Math.round((topCategoryAmount / totalMonthExpense) * 100);
    const existingBudget = db.budgets.find(b => b.category_id === topCategory.id && b.month === currentMonthStr);

    if (!existingBudget) {
      suggestions.push({
        id: 'sug_top_category_budget',
        type: 'budget',
        priority: 'high',
        title: `Maior foco de gastos: ${topCategory.name}`,
        message: `A categoria "${topCategory.name}" concentra ${sharePercent}% de todas as saídas do casal (R$ ${topCategoryAmount.toFixed(2).replace('.', ',')}). Criar um teto de gastos evita surpresas no fim do mês!`,
        impact: `Concentra ${sharePercent}% dos gastos`,
        badge: 'Recomendação de Limite',
        actionLabel: 'Definir teto de gastos',
        actionTarget: 'orcamentos',
        iconType: 'target',
      });
    }
  }

  // 5. Budget Threshold Alerts (Limit reached or near 85%)
  for (const budget of db.budgets) {
    if (budget.month === currentMonthStr) {
      const spent = categoryTotals[budget.category_id] || 0;
      const pct = (spent / budget.limit_amount) * 100;
      const cat = db.categories.find(c => c.id === budget.category_id);
      const catName = cat?.name || 'Categoria';

      if (pct >= 85 && pct < 100) {
        const remaining = budget.limit_amount - spent;
        suggestions.push({
          id: `sug_budget_near_${budget.category_id}`,
          type: 'alert',
          priority: 'high',
          title: `Alerta de Limite: ${catName}`,
          message: `Vocês já utilizaram ${pct.toFixed(0)}% do orçamento estipulado para ${catName}. Restam apenas R$ ${remaining.toFixed(2).replace('.', ',')} para o fechamento do mês.`,
          impact: `Restam R$ ${remaining.toFixed(2).replace('.', ',')}`,
          badge: 'Orçamento Próximo do Limite',
          actionLabel: 'Ver orçamentos',
          actionTarget: 'orcamentos',
          iconType: 'alert',
        });
      } else if (pct >= 100) {
        const exceeded = spent - budget.limit_amount;
        suggestions.push({
          id: `sug_budget_exceeded_${budget.category_id}`,
          type: 'alert',
          priority: 'high',
          title: `Limite Excedido: ${catName}`,
          message: `O limite de ${catName} foi ultrapassado em R$ ${exceeded.toFixed(2).replace('.', ',')}. Sugerimos compensar reduzindo despesas de outras categorias opcionais nos próximos dias.`,
          impact: `Excedeu R$ ${exceeded.toFixed(2).replace('.', ',')}`,
          badge: 'Atenção Imediata',
          actionLabel: 'Ajustar orçamentos',
          actionTarget: 'orcamentos',
          iconType: 'alert',
        });
      }
    }
  }

  // 6. Emergency Fund & Savings Opportunity
  const emergencyReserve = db.accounts.find(a => a.is_reserve && a.type === 'reserve');
  if (emergencyReserve) {
    const reserveBalance = Number(emergencyReserve.balance) || 0;
    const targetAmount = emergencyReserve.goal_target || 15000;

    if (reserveBalance === 0 && summary.available > 100) {
      const suggestValue = Math.min(Math.round(summary.available * 0.2), 300);
      suggestions.push({
        id: 'sug_start_emergency_fund',
        type: 'goal',
        priority: 'high',
        title: 'Iniciar a Reserva de Emergência 🛡️',
        message: `Vocês possuem R$ ${summary.available.toFixed(2).replace('.', ',')} livre de contas hoje. Guardar R$ ${suggestValue},00 agora criará o colchão de proteção financeira da casa.`,
        impact: 'Proteção contra imprevistos',
        badge: 'Saúde Financeira',
        actionLabel: 'Guardar na Reserva',
        actionTarget: 'reservas',
        iconType: 'piggy',
      });
    } else if (reserveBalance > 0 && reserveBalance < targetAmount && summary.available > 200) {
      const pct = Math.round((reserveBalance / targetAmount) * 100);
      suggestions.push({
        id: 'sug_grow_reserve',
        type: 'goal',
        priority: 'medium',
        title: `Reserva do Casal: ${pct}% Concluída`,
        message: `Com o saldo disponível atual, que tal fazer um aporte adicional para acelerar a meta de R$ ${targetAmount.toLocaleString('pt-BR')}? Cada aporte garante tranquilidade futura.`,
        impact: `Meta em ${pct}%`,
        badge: 'Crescimento Patrimonial',
        actionLabel: 'Fazer Aporte',
        actionTarget: 'reservas',
        iconType: 'piggy',
      });
    }
  }

  // 7. Upcoming Bills in the Next 3 Days
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);
  const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

  const billsDueSoon = db.bills.filter(
    b => b.status === 'pending' && b.type === 'payable' && b.due_date >= todayStr && b.due_date <= threeDaysStr
  );

  if (billsDueSoon.length > 0) {
    const totalDueSoon = billsDueSoon.reduce((sum, b) => sum + b.amount, 0);
    const billNames = billsDueSoon.map(b => b.description).slice(0, 2).join(' e ');
    suggestions.push({
      id: 'sug_bills_due_soon',
      type: 'alert',
      priority: 'high',
      title: 'Contas com Vencimento Próximo',
      message: `${billNames} vencem nos próximos 3 dias (Total R$ ${totalDueSoon.toFixed(2).replace('.', ',')}). Pagar com antecedência evita encargos e mantém o score do casal elevado.`,
      impact: `${billsDueSoon.length} conta${billsDueSoon.length > 1 ? 's' : ''} a vencer`,
      badge: 'Alerta de Prazo',
      actionLabel: 'Ver contas a pagar',
      actionTarget: 'contas',
      iconType: 'alert',
    });
  }

  // 8. Couple Transparency & Harmony Insight
  const sharedCount = monthTransactions.filter(t => t.privacy === 'shared').length;
  if (monthTransactions.length >= 3 && sharedCount / monthTransactions.length >= 0.8) {
    suggestions.push({
      id: 'sug_couple_transparency',
      type: 'couple',
      priority: 'low',
      title: 'Transparência Financeira Exemplar 💜',
      message: `${Math.round((sharedCount / monthTransactions.length) * 100)}% das transações deste mês foram compartilhadas. Vocês estão construindo um planejamento maduro e sem ruídos!`,
      impact: 'Alinhamento em alta',
      badge: 'Harmonia do Casal',
      iconType: 'heart',
    });
  }

  // 9. Default positive encouragement if fresh / zeroed
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'sug_smart_start',
      type: 'savings',
      priority: 'medium',
      title: 'Dica de Ouro: Regra 50-30-20',
      message: 'Organizem a renda mensal dividindo em: 50% para necessidades básicas, 30% para lazer/desejos do casal e 20% para reservas e metas futuras.',
      impact: 'Equilíbrio ideal',
      badge: 'Educação Financeira',
      actionLabel: 'Planejar orçamentos',
      actionTarget: 'orcamentos',
      iconType: 'sparkles',
    });
  }

  return suggestions;
}
