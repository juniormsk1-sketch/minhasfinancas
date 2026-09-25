import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
  BellRing
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'auto' | 'android' | 'ios'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'auto';
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] dark:bg-[#1f0e2b] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-bold shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-display text-lg font-bold">
                Instalar no Celular
              </h3>
              <p className="text-xs text-purple-200">
                Use como aplicativo nativo na tela inicial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/20 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'android'
                ? 'bg-purple-900 text-amber-300 dark:bg-amber-400 dark:text-purple-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Android / Chrome
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'ios'
                ? 'bg-purple-900 text-amber-300 dark:bg-amber-400 dark:text-purple-950 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            iPhone / Safari (iOS)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-stone-800 dark:text-stone-200">
          {/* Quick Install Button for supported browsers */}
          {isInstallable && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl p-4 text-center space-y-2.5">
              <div className="inline-flex p-2 rounded-xl bg-emerald-500 text-white">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Instalação com 1 Clique Disponível!
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Seu navegador permite instalar o Minha Finance diretamente agora.
                </p>
              </div>
              <button
                onClick={async () => {
                  const success = await install();
                  if (success) onClose();
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Instalar Aplicativo Agora
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl p-3.5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-xs text-stone-700 dark:text-stone-300">
                O aplicativo já está instalado no seu dispositivo!
              </p>
            </div>
          )}

          {/* Android Guide */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-amber-400">
                Passo a passo no Android (Chrome):
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-3 bg-white dark:bg-[#23122c] p-3 rounded-2xl border border-black/5 dark:border-white/10">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-amber-300 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-stone-100">
                      Abra o menu do Google Chrome
                    </p>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                      Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito da tela do celular.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white dark:bg-[#23122c] p-3 rounded-2xl border border-black/5 dark:border-white/10">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-amber-300 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-stone-100">
                      Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"
                    </p>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                      O ícone do <strong>Minha Finance</strong> será criado na sua tela de aplicativos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white dark:bg-[#23122c] p-3 rounded-2xl border border-black/5 dark:border-white/10">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-amber-300 font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-stone-100">
                      Abra o app direto pelo ícone
                    </p>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                      Ele abre em tela cheia (sem barra de navegador) e fica rápido e fluido como um app baixado na Play Store.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* iOS Guide */}
          {activeTab === 'ios' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-amber-400">
                Passo a passo no iPhone / iPad (Safari):
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-3 bg-white dark:bg-[#23122c] p-3 rounded-2xl border border-black/5 dark:border-white/10">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-amber-300 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      Abra pelo Safari e toque em Compartilhar
                      <Share className="w-3.5 h-3.5 text-blue-500" />
                    </p>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                      Toque no ícone do quadrado com a seta para cima na barra inferior do Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white dark:bg-[#23122c] p-3 rounded-2xl border border-black/5 dark:border-white/10">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-amber-300 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      Role e toque em "Adicionar à Tela de Início"
                      <PlusSquare className="w-3.5 h-3.5 text-purple-600 dark:text-amber-400" />
                    </p>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                      Procure a opção com o ícone de (+) na lista de ações.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white dark:bg-[#23122c] p-3 rounded-2xl border border-black/5 dark:border-white/10">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-amber-300 font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-stone-100">
                      Toque em "Adicionar" no canto superior
                    </p>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                      Pronto! O app aparecerá na tela inicial do seu iPhone com o ícone oficial roxo e dourado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Explanation about Mobile Notifications */}
          <div className="bg-purple-100/60 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-950 dark:text-purple-200">
              <BellRing className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-bold">
                As notificações aparecem no aparelho?
              </p>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
              <strong>Sim!</strong> Instalando como aplicativo e ativando as notificações, seu celular exibirá alertas com som, vibração e banner na tela de bloqueio sempre que houver novas compras do casal ou contas a vencer.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-black/5 dark:border-white/10 bg-white/40 dark:bg-black/20 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-purple-900 hover:bg-purple-950 active:scale-98 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            Entendido, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
