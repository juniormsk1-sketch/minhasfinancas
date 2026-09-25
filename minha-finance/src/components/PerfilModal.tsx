import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Loader2,
  Trash2,
  Heart,
  User,
  Image as ImageIcon
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface PerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserId?: string;
}

const PRESET_AVATARS_MEN = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=200&auto=format&fit=crop&q=80',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Junior&backgroundColor=b6e3f4',
];

const PRESET_AVATARS_WOMEN = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Shtefany&backgroundColor=ffd5dc',
];

export const PerfilModal: React.FC<PerfilModalProps> = ({
  isOpen,
  onClose,
  initialUserId,
}) => {
  const {
    wallet,
    activeUser,
    partner,
    updateMemberProfile,
    updateWalletName,
    resetAllNumbers,
  } = useFinance();

  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialUserId || activeUser.user_id
  );

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [walletName, setWalletName] = useState(wallet?.name || 'Casa do Junior & Shtefany 💜');

  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever selected member changes
  useEffect(() => {
    if (!wallet) return;
    const member = wallet.members.find(m => m.user_id === selectedUserId) || activeUser;
    setName(member.name);
    setAvatarUrl(member.avatar_url);
    setEmail(member.email || '');
    setWalletName(wallet.name || 'Casa do Junior & Shtefany 💜');
    setShowUrlField(false);
  }, [selectedUserId, wallet, activeUser]);

  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId);
    }
  }, [initialUserId, isOpen]);

  if (!isOpen) return null;

  const currentMember = wallet?.members.find(m => m.user_id === selectedUserId) || activeUser;
  const isEditingPartner = currentMember.user_id !== activeUser.user_id;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Por favor selecione uma imagem menor que 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await updateMemberProfile(selectedUserId, {
        name: name.trim(),
        avatar_url: avatarUrl,
        email: email.trim(),
      });

      if (walletName.trim() && walletName !== wallet?.name) {
        await updateWalletName(walletName.trim());
      }

      setShowSavedToast(true);
      setTimeout(() => {
        setShowSavedToast(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetNumbers = async () => {
    setIsResetting(true);
    try {
      await resetAllNumbers();
      setShowResetConfirm(false);
      setShowSavedToast(true);
      setTimeout(() => {
        setShowSavedToast(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error resetting numbers:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const presetList = selectedUserId === 'usr_shtefany' || name.toLowerCase().includes('shtefany')
    ? PRESET_AVATARS_WOMEN
    : PRESET_AVATARS_MEN;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#201027] w-full max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-black/10 dark:border-white/10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-stone-50/70 dark:bg-black/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-display font-bold text-base text-purple-950 dark:text-purple-100">
                Perfil do Casal
              </h2>
              <p className="text-xs text-stone-500">
                Altere nome e foto de perfil a qualquer momento
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member selector tabs (Junior vs Shtefany) */}
        <div className="p-3 bg-stone-100/70 dark:bg-black/30 border-b border-black/5 dark:border-white/5 flex gap-2 shrink-0">
          {wallet?.members.map(member => {
            const isSelected = member.user_id === selectedUserId;
            return (
              <button
                key={member.user_id}
                type="button"
                onClick={() => setSelectedUserId(member.user_id)}
                className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 ${
                  isSelected
                    ? 'bg-white dark:bg-[#2d123d] text-purple-950 dark:text-amber-300 shadow-sm border border-purple-200 dark:border-purple-800/60'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <img
                  src={member.avatar_url}
                  alt={member.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-black/10"
                />
                <span className="truncate">{member.name}</span>
                {member.user_id === activeUser.user_id && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    Você
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Avatar Section */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-600/30 dark:ring-amber-400/50 shadow-md bg-stone-100"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-amber-400 text-purple-950 hover:bg-amber-300 shadow-md active:scale-95 transition-transform"
                title="Tirar foto ou escolher arquivo"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Foto de {name || 'Perfil'}
              </p>
              <p className="text-[11px] text-stone-400">
                Tire uma foto com a câmera ou escolha da galeria
              </p>
            </div>

            {/* Quick action buttons for photo */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs font-semibold hover:bg-purple-100 flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Upload className="w-3.5 h-3.5" />
                Enviar foto do celular
              </button>

              <button
                type="button"
                onClick={() => setShowUrlField(!showUrlField)}
                className="py-1.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Inserir link (URL)
              </button>
            </div>

            {/* URL Input field toggle */}
            {showUrlField && (
              <div className="w-full flex gap-1.5 pt-1 animate-in fade-in duration-150">
                <input
                  type="url"
                  placeholder="https://exemplo.com/sua-foto.jpg"
                  value={customUrlInput}
                  onChange={e => setCustomUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrlInput.trim()) {
                      setAvatarUrl(customUrlInput.trim());
                      setCustomUrlInput('');
                      setShowUrlField(false);
                    }
                  }}
                  className="px-3 py-2 bg-purple-900 text-amber-300 font-bold text-xs rounded-xl active:scale-95"
                >
                  Usar
                </button>
              </div>
            )}

            {/* Presets Gallery */}
            <div className="w-full text-left pt-2">
              <span className="text-[11px] font-semibold uppercase text-stone-400 block mb-2">
                Ou escolha um avatar pré-definido:
              </span>
              <div className="grid grid-cols-6 gap-2">
                {presetList.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`relative rounded-full aspect-square overflow-hidden ring-2 transition-all active:scale-95 ${
                      avatarUrl === preset
                        ? 'ring-amber-400 ring-offset-2 scale-105'
                        : 'ring-transparent hover:ring-purple-400/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                    {avatarUrl === preset && (
                      <div className="absolute inset-0 bg-amber-400/30 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-purple-950 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Email Fields */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Nome de exibição
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Junior"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                E-mail (opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex: junior@casal.com"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Nome da Casa Compartilhada
              </label>
              <input
                type="text"
                value={walletName}
                onChange={e => setWalletName(e.target.value)}
                placeholder="Ex: Casa do Junior & Shtefany 💜"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 active:scale-98 text-purple-950 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 mt-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando alterações...
                </>
              ) : showSavedToast ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Perfil atualizado com sucesso!
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Salvar Perfil de {name}
                </>
              )}
            </button>
          </form>

          {/* Reset Numbers Section */}
          <div className="pt-4 border-t border-black/5 dark:border-white/10">
            <div className="bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Zerar Números do Aplicativo
                </span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                Zera o saldo atual, reservas, faturas de cartão, contas e extrato para <strong>R$ 0,00</strong>, deixando o app limpo para novos lançamentos.
              </p>

              {showResetConfirm ? (
                <div className="space-y-2 pt-1 animate-in fade-in">
                  <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                    Tem certeza? Todos os lançamentos serão apagados e os saldos ficarão em zero.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      disabled={isResetting}
                      className="py-2 px-3 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleResetNumbers}
                      disabled={isResetting}
                      className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Zerando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          Confirmar e Zerar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-2 px-3 bg-white dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-98 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Zerar todos os números do app
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
