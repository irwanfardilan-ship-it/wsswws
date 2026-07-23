import React from 'react';
import { GlassCard } from '../components/common/GlassCard';
import { AzurLizeLogo } from '../components/logo/AzurLizeLogo';
import { Button } from '../components/common/Button';

export const BrowserNoticePage: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: 'var(--tg-bg-color, #030712)',
        color: 'var(--tg-text-color, #f8fafc)'
      }}
      className="min-h-screen flex flex-col items-center justify-center p-5 text-center transition-colors duration-300 bg-mesh-gradient overflow-x-hidden"
    >
      <GlassCard className="max-w-md w-full p-6 space-y-6 border-sky-500/30 shadow-2xl">
        <div className="flex justify-center">
          <AzurLizeLogo size="lg" />
        </div>

        <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-500 dark:text-sky-400 text-3xl">
          📱
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Akses Khusus Telegram Bot
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Aplikasi rekrutmen <strong className="text-sky-400 font-bold">AzurLizeTeam</strong> dikhususkan untuk dibuka melalui Telegram Mini App dari Bot kami.
          </p>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
          <p className="font-bold text-slate-200">Cara Membuka Aplikasi:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-300 font-medium">
            <li>Buka aplikasi Telegram di perangkat Anda.</li>
            <li>Cari Bot Rekrutmen <strong className="text-sky-400 font-bold">@azurlize_recruitment_bot</strong></li>
            <li>Tekan tombol <strong className="text-sky-400 font-bold">"Buka Web App"</strong> atau kirim perintah <code className="text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">/app</code></li>
          </ol>
        </div>

        <div className="pt-2 border-t border-slate-800 flex flex-col gap-3">
          <Button
            fullWidth
            onClick={() => {
              window.location.href = 'https://t.me/azurlize_recruitment_bot';
            }}
          >
            Buka Telegram
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
