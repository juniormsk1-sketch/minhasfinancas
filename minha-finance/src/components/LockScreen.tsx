import React, { useState } from 'react';
import { Shield, Fingerprint, Delete, Unlock } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const LockScreen: React.FC = () => {
  const { isLocked, unlockApp, securitySettings, updateSecuritySettings } = useFinance();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLocked) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');

      // If matches length of pin code
      const targetLength = securitySettings.pin_code?.length || 4;
      if (nextPin.length === targetLength) {
        setTimeout(() => {
          const success = unlockApp(nextPin);
          if (!success) {
            setErrorMsg('PIN incorreto. Tente novamente.');
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleBiometrics = () => {
    // Simulated biometrics or local WebAuthn
    unlockApp(securitySettings.pin_code || '');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#170a1e] text-white flex flex-col items-center justify-between p-6 safe-top safe-bottom select-none">
      {/* Top Branding */}
      <div className="flex flex-col items-center mt-8 space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 text-purple-950 flex items-center justify-center shadow-lg shadow-amber-400/20">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="font-serif-display text-2xl font-bold tracking-tight">Minha Finance</h1>
        <p className="text-stone-400 text-xs text-center">
          Finanças compartilhadas protegidas
        </p>
      </div>

      {/* Pin Dots */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex gap-3">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-amber-400 scale-110 shadow-sm shadow-amber-400/50'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
        {errorMsg && (
          <p className="text-red-400 text-xs animate-bounce font-medium">{errorMsg}</p>
        )}
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-4 mb-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
          <button
            key={digit}
            onClick={() => handleKeyPress(digit)}
            className="w-16 h-16 mx-auto rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-2xl font-semibold transition-all flex items-center justify-center"
          >
            {digit}
          </button>
        ))}

        {/* Biometrics button */}
        <button
          onClick={handleBiometrics}
          className="w-16 h-16 mx-auto rounded-full bg-white/5 hover:bg-white/15 active:scale-90 text-amber-400 transition-all flex items-center justify-center"
          title="Usar Biometria"
        >
          <Fingerprint className="w-7 h-7" />
        </button>

        {/* Zero */}
        <button
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 mx-auto rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-2xl font-semibold transition-all flex items-center justify-center"
        >
          0
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="w-16 h-16 mx-auto rounded-full bg-white/5 hover:bg-white/15 active:scale-90 text-stone-300 transition-all flex items-center justify-center"
          title="Apagar"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* Forgot PIN / emergency bypass */}
      <button
        onClick={() => {
          if (confirm('Deseja desativar o PIN de segurança local para recuperar o acesso?')) {
            updateSecuritySettings({ pin_enabled: false });
            unlockApp('');
          }
        }}
        className="text-stone-500 hover:text-stone-300 text-xs py-2"
      >
        Redefinir / Esqueci o PIN
      </button>
    </div>
  );
};
