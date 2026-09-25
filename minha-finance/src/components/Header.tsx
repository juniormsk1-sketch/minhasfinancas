import React, { useState } from 'react';
import { Eye, EyeOff, Bell, RefreshCw, Shield, Users, CheckCircle2, WifiOff, ArrowRightLeft, UserCheck, Camera, Smartphone } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { PWAInstallModal } from './PWAInstallModal';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenInvite: () => void;
  onOpenSettings: () => void;
  onOpenProfile: (userId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenInvite,
  onOpenSettings,
  onOpenProfile,
}) => {
  const {
    wallet,
    activeUser,
    partner,
    isOnline,
    isSyncing,
    hideValues,
    unreadNotificationsCount,
    securitySettings,
    toggleHideValues,
    switchActiveUser,
    lockApp,
    triggerManualSync,
  } = useFinance();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#faf8f5]/90 dark:bg-[#170a1e]/90 backdrop-blur-md border-b border-black/5 dark:border-white/10 px-4 pt-3 pb-3 safe-top">
      <div className="flex items-center justify-between">
        {/* User profile & Couple indicator */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 text-left focus:outline-none group p-1 -ml-1 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Alternar usuário ou editar perfil"
          >
            <div className="relative">
              <img
                src={activeUser.avatar_url}
                alt={activeUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-600/30 dark:ring-amber-400/50 shadow-sm"
              />
              {partner && (
                <img
                  src={partner.avatar_url}
                  alt={partner.name}
                  className="w-5 h-5 rounded-full object-cover absolute -bottom-1 -right-1 border-2 border-white dark:border-purple-950 shadow-xs"
                />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-purple-950 dark:text-purple-100 flex items-center gap-1">
                  {activeUser.name}
                  <ArrowRightLeft className="w-3 h-3 text-purple-600/60 dark:text-amber-400/70" />
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-medium truncate max-w-[110px]">
                  {wallet?.name || 'Casa'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {partner ? `com ${partner.name}` : 'Toque para editar ou convidar'}
              </p>
            </div>
          </button>

          {/* Quick switcher dropdown */}
          {showUserMenu && (
            <div className="absolute top-12 left-0 w-72 bg-white dark:bg-purple-950/95 rounded-2xl shadow-xl border border-black/10 dark:border-white/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                <span>Visão do Casal</span>
                <span className="text-[10px] text-amber-500 font-bold">Junior & Shtefany</span>
              </div>

              {wallet?.members.map(member => (
                <div
                  key={member.user_id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                    member.user_id === activeUser.user_id
                      ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-950 dark:text-purple-100 font-medium'
                      : 'hover:bg-stone-50 dark:hover:bg-purple-900/20 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <button
                    onClick={() => {
                      switchActiveUser(member.user_id);
                      setShowUserMenu(false);
                    }}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <img src={member.avatar_url} alt={member.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-300 dark:ring-purple-700" />
                    <div>
                      <p className="leading-tight text-sm font-semibold">{member.name}</p>
                      <p className="text-[11px] text-stone-500">{member.user_id === activeUser.user_id ? 'Perfil ativo agora' : 'Alternar para este perfil'}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenProfile(member.user_id);
                    }}
                    title={`Editar nome e foto de ${member.name}`}
                    className="p-1.5 rounded-lg text-purple-700 dark:text-amber-400 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="border-t border-black/5 dark:border-white/10 my-1 pt-1 space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenProfile(activeUser.user_id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-800 dark:text-stone-200 font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                  Alterar meu nome e foto
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenInvite();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-700 dark:text-amber-400 font-medium hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl"
                >
                  <Users className="w-3.5 h-3.5" />
                  Conectar parceiro(a) (Código {wallet?.invite_code})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1.5">
          {/* Online/Sync indicator */}
          <button
            onClick={() => triggerManualSync()}
            title={isOnline ? (isSyncing ? 'Sincronizando...' : 'Sincronizar em tempo real') : 'Modo Offline ativo'}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
          >
            {isOnline ? (
              <RefreshCw className={`w-4 h-4 text-purple-700 dark:text-purple-300 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-600" />
            )}
          </button>

          {/* Hide/Show values toggle */}
          <button
            onClick={toggleHideValues}
            title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
          >
            {hideValues ? <EyeOff className="w-4 h-4 text-stone-500" /> : <Eye className="w-4 h-4 text-purple-700 dark:text-purple-300" />}
          </button>

          {/* Notifications button */}
          <button
            onClick={onOpenNotifications}
            title="Notificações"
            className="relative p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
          >
            <Bell className="w-4 h-4 text-purple-700 dark:text-purple-300" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Install on mobile button */}
          <button
            onClick={() => setIsInstallModalOpen(true)}
            title="Instalar no celular (Como baixar)"
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
          >
            <Smartphone className="w-4 h-4 text-purple-700 dark:text-amber-400" />
          </button>

          {/* Quick Lock if PIN enabled */}
          {securitySettings.pin_enabled && (
            <button
              onClick={lockApp}
              title="Bloquear aplicativo"
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
            >
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>
          )}
        </div>
      </div>

      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </header>
  );
};
