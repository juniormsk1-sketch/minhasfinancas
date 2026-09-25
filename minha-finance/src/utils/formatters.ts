export function formatBRL(amount: number, hideValues = false): string {
  if (hideValues) {
    return 'R$ ••••••';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatDatePT(dateStr: string): string {
  if (!dateStr) return '';
  // dateStr can be YYYY-MM-DD or ISO
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${dd}/${mm}/${yyyy}`;
  }
  return dateStr;
}

export function formatShortDatePT(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [, mm, dd] = parts;
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const monthName = months[parseInt(mm, 10) - 1] || mm;
    return `${parseInt(dd, 10)} de ${monthName}`;
  }
  return dateStr;
}

export function formatTimePT(isoStr: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function getDaysLeftInMonth(): number {
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const diffTime = lastDayOfMonth.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 1);
}

export function getCurrentMonthFormatted(): string {
  const today = new Date();
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${months[today.getMonth()]} de ${today.getFullYear()}`;
}
