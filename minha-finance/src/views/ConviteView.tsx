import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Users,
  Copy,
  Check,
  Share2,
  QrCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const ConviteView: React.FC = () => {
  const { wallet, activeUser, partner, joinWalletWithCode } = useFinance();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinFeedback, setJoinFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const inviteCode = wallet?.invite_code || 'AMOR26';
  const inviteUrl = `${window.location.origin}/?convite=${inviteCode}`;

  useEffect(() => {
    QRCode.toDataURL(inviteUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#2a0845',
        light: '#ffffff',
      },
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR code generation error:', err));
  }, [inviteUrl]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Oi meu amor! 💜 Vamos controlar as finanças da nossa casa juntos no Minha Finance? Use o código de convite ${inviteCode} ou abra o link: ${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const res = await joinWalletWithCode(joinCodeInput.trim());
    setJoinFeedback(res);
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Top Card */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-950 via-[#371158] to-[#27103f] text-white p-5 shadow-xl text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center mx-auto shadow-md">
          <Users className="w-6 h-6" />
        </div>

        <div>
          <h2 className="font-serif-display text-2xl font-bold tracking-tight">
            Conectar com o Parceiro(a)
          </h2>
          <p className="text-xs text-purple-200 mt-1 max-w-xs mx-auto">
            Compartilhem despesas, contas e metas da casa em tempo real no mesmo ambiente
          </p>
        </div>

        {/* 6-Character Invite Code Big Badge */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 max-w-xs mx-auto flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase text-purple-200 block">Código da Casa</span>
            <span className="font-mono text-2xl font-bold tracking-widest text-amber-300">
              {inviteCode}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-purple-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Dynamic QR Code Card */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-xs text-center space-y-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Aponte a Câmera para Entrar
        </span>

        {qrDataUrl ? (
          <div className="inline-block p-3 bg-white rounded-2xl shadow-sm border border-black/5">
            <img src={qrDataUrl} alt="QR Code Convite" className="w-48 h-48 mx-auto rounded-xl" />
          </div>
        ) : (
          <div className="w-48 h-48 mx-auto bg-stone-100 rounded-xl flex items-center justify-center">
            <QrCode className="w-8 h-8 text-stone-400 animate-pulse" />
          </div>
        )}

        <div className="flex gap-2 justify-center max-w-xs mx-auto">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Enviar no WhatsApp
          </button>
        </div>
      </div>

      {/* Members already in the house */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Membros na Casa ({wallet?.members.length || 0}/2)
        </span>

        <div className="space-y-2">
          {wallet?.members.map(m => (
            <div key={m.user_id} className="flex items-center justify-between p-2 rounded-2xl bg-stone-50 dark:bg-purple-950/20">
              <div className="flex items-center gap-3">
                <img src={m.avatar_url} alt={m.name} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                    {m.name} {m.user_id === activeUser.user_id ? '(Você)' : ''}
                  </p>
                  <p className="text-[11px] text-stone-400">{m.email}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-semibold">
                Conectado
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Join Another Wallet form */}
      <div className="bg-white dark:bg-[#23122c] border border-black/5 dark:border-white/10 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-purple-700 dark:text-amber-400" />
          <h3 className="font-semibold text-xs text-stone-800 dark:text-stone-200">
            Recebeu um código do parceiro?
          </h3>
        </div>

        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            placeholder="Digite o código (ex: AMOR26)"
            value={joinCodeInput}
            onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
            maxLength={8}
            className="flex-1 px-3 py-2 bg-stone-50 dark:bg-[#1a0a2a] border border-black/10 dark:border-white/10 rounded-xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Entrar
          </button>
        </form>

        {joinFeedback && (
          <p className={`text-xs ${joinFeedback.success ? 'text-emerald-600' : 'text-rose-600'}`}>
            {joinFeedback.message}
          </p>
        )}
      </div>
    </div>
  );
};
