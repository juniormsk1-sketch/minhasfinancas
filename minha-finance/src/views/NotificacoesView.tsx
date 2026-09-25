import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  Tag,
  CreditCard,
  Target,
  AlertTriangle,
  Trash2,
  Check,
  Smartphone,
  BellRing,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatShortDatePT, formatTimePT } from '../utils/formatters';
import { PWAInstallModal } from '../components/PWAInstallModal';

export const NotificacoesView: React.FC = () => {
  const {
    db,
    activeUser,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
    requestDeviceNotificationPermission,
    deviceNotificationPermission,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [permissionFeedback, setPermissionFeedback] = useState<string | null>(null);

  // All notifications visible to the active user (or to the wallet in general)
  const userNotifications = db.notifications.filter(
    n => n.user_id === activeUser.user_id || !n.user_id
  );

  const displayedNotifications = activeTab === 'unread'
    ? userNotifications.filter(n => !n.read)
    : userNotifications;

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'movement_new':
        return <Tag className="w-4 h-4 text-emerald-500" />;
      case 'bill_due':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'invoice_due':
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      case 'budget_alert':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-purple-500" />;
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestDeviceNotificationPermission();
    if (granted) {
      setPermissionFeedback('Notificações no celular ativadas com sucesso!');
    } else {
      setPermissionFeedback('Permissão não concedida. Verifique as configurações do seu navegador.');
    }
    setTimeout(() => setPermissionFeedback(null), 5000);
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* 1. Header Card */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif-display font-bold text-lg text-purple-950 dark:text-purple-100 flex items-center gap-2">
              Notificações do Casal
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400 text-purple-950 font-bold">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Avisos em tempo real de entradas, despesas, faturas e contas
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsRead()}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-amber-300 rounded-xl hover:bg-purple-200 active:scale-95 transition-all"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar lidas
              </button>
            )}

            {userNotifications.length > 0 && (
              <button
                onClick={() => clearAllNotifications()}
                className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Limpar todas as notificações"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Device Notifications Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-2xl p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-purple-950 flex items-center justify-center shrink-0 shadow-xs font-bold mt-0.5">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">
                  Notificações no Celular
                </p>
                <p className="text-[11px] text-purple-200 mt-0.5">
                  {deviceNotificationPermission === 'granted'
                    ? '✅ O seu aparelho está autorizado a receber avisos sonoros e na tela de bloqueio!'
                    : 'Receba alertas automáticos no seu celular quando seu parceiro fizer um lançamento.'}
                </p>
              </div>
            </div>

            {deviceNotificationPermission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-purple-950 font-bold text-[11px] rounded-xl shrink-0 shadow-sm transition-all"
              >
                Ativar no celular
              </button>
            )}
          </div>

          {permissionFeedback && (
            <p className="text-[11px] font-semibold text-amber-300 bg-white/10 px-2.5 py-1 rounded-lg">
              {permissionFeedback}
            </p>
          )}

          {/* Quick install button */}
          <div className="border-t border-white/15 pt-2 flex items-center justify-between">
            <span className="text-[11px] text-purple-200 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              Como baixar e usar como aplicativo?
            </span>
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="text-[11px] font-bold text-amber-300 hover:underline flex items-center gap-1"
            >
              Ver guia de instalação
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-black/5 dark:border-white/10 pt-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-purple-800 dark:border-amber-400 text-purple-900 dark:text-amber-300 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Todas ({userNotifications.length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'border-purple-800 dark:border-amber-400 text-purple-900 dark:text-amber-300 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Não lidas ({unreadCount})
          </button>
        </div>
      </div>

      {/* 2. Notifications List */}
      <div className="space-y-2.5">
        {displayedNotifications.length === 0 ? (
          <div className="bg-white dark:bg-[#23122c] rounded-3xl p-8 text-center border border-black/5 dark:border-white/10 space-y-2">
            <Bell className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
            <p className="font-semibold text-sm text-stone-700 dark:text-stone-300">
              {activeTab === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação no momento'}
            </p>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              Quando você ou seu amor registrarem um lançamento ou uma conta estiver perto de vencer, ela aparecerá aqui!
            </p>
          </div>
        ) : (
          displayedNotifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 rounded-3xl border transition-all ${
                notif.read
                  ? 'bg-white dark:bg-[#23122c] border-black/5 dark:border-white/5 opacity-80'
                  : 'bg-purple-50/80 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white dark:bg-black/30 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-xs" title="Não lida" />
                    )}
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                    {notif.body}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="text-[10px] text-stone-400">
                      {formatShortDatePT(notif.created_date)} às {formatTimePT(notif.created_date)}
                    </span>

                    <div className="flex items-center gap-2">
                      {!notif.read && (
                        <button
                          onClick={() => markNotificationRead(notif.id)}
                          className="text-[11px] font-semibold text-purple-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Marcar como lida
                        </button>
                      )}

                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-[11px] text-stone-400 hover:text-rose-600 flex items-center gap-0.5 transition-colors p-1"
                        title="Excluir notificação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
