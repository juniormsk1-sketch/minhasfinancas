import React, { useState } from 'react';
import { Shield, Fingerprint, Lock, KeyRound, Check, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const SegurancaView: React.FC = () => {
  const { securitySettings, updateSecuritySettings, lockApp } = useFinance();

  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleTogglePin = (enabled: boolean) => {
    if (enabled) {
      setIsSettingPin(true);
    } else {
      updateSecuritySettings({ pin_enabled: false, pin_code: '' });
      setMessage('PIN desativado com sucesso.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4 || pinInput.length > 6) {
      alert('O PIN deve conter entre 4 e 6 números.');
      return;
    }
    if (pinInput !== pinConfirm) {
      alert('Os PINs digitados não coincidem.');
      return;
    }

    updateSecuritySettings({
      pin_enabled: true,
      pin_code: pinInput,
    });

    setIsSettingPin(false);
    setPinInput('');
    setPinConfirm('');
    setMessage('✅ PIN configurado com sucesso!');
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif-display font-bold text-base text-purple-950 dark:text-purple-100">
              Segurança & Privacidade
            </h2>
            <p className="text-xs text-stone-500">
              Proteja o aplicativo no seu aparelho com PIN e biometria
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          {message}
        </div>
      )}

      {/* Main Settings */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl divide-y divide-black/5 dark:divide-white/5 overflow-hidden shadow-xs">
        {/* Toggle PIN */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-purple-700 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                Bloqueio por PIN
              </p>
              <p className="text-[11px] text-stone-500">
                Exigir código numérico de 4 a 6 dígitos ao abrir o app
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={securitySettings.pin_enabled}
              onChange={e => handleTogglePin(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-900"></div>
          </label>
        </div>

        {/* Biometrics */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fingerprint className="w-5 h-5 text-purple-700 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                Desbloqueio por Biometria
              </p>
              <p className="text-[11px] text-stone-500">
                Usar Face ID / Touch ID do aparelho (100% local e seguro)
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={securitySettings.biometrics_enabled}
              onChange={e => updateSecuritySettings({ biometrics_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-900"></div>
          </label>
        </div>

        {/* Test Lock */}
        {securitySettings.pin_enabled && (
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-stone-500" />
              <div>
                <p className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                  Testar Bloqueio
                </p>
                <p className="text-[11px] text-stone-500">
                  Bloqueia o app agora para verificar seu PIN
                </p>
              </div>
            </div>

            <button
              onClick={lockApp}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-purple-900/40 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-xl"
            >
              Bloquear Agora
            </button>
          </div>
        )}
      </div>

      {/* Set PIN Form */}
      {isSettingPin && (
        <form onSubmit={handleSavePin} className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-5 shadow-xs space-y-3">
          <h3 className="font-semibold text-sm text-stone-800 dark:text-stone-200">
            Cadastrar Novo PIN
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">
                Digite o PIN (4 a 6 números)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1a0a2a] border border-black/10 dark:border-white/10 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">
                Confirme o PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#1a0a2a] border border-black/10 dark:border-white/10 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsSettingPin(false)}
              className="flex-1 py-2 text-stone-500 hover:text-stone-700 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-purple-900 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl shadow-xs"
            >
              Salvar PIN
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
