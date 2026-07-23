import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/common/GlassCard';
import { AzurLizeLogo } from '../components/logo/AzurLizeLogo';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';
import { LogIn, UserPlus, ChevronLeft, Hash, User, ShieldAlert, Sparkles } from 'lucide-react';

export const BrowserNoticePage: React.FC = () => {
  const { loginManually, registerManually } = useAuth();
  
  const [showManualForm, setShowManualForm] = useState(false);
  const [telegramId, setTelegramId] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);

  // Detect if running inside a Capacitor/Native WebView APK environment
  useEffect(() => {
    const isCap = typeof window !== 'undefined' && (
      (window as any).Capacitor ||
      window.location.protocol === 'capacitor:' ||
      navigator.userAgent.includes('Capacitor') ||
      navigator.userAgent.includes('Android') && !navigator.userAgent.includes('Chrome') // Webview fallback
    );
    setIsCapacitor(Boolean(isCap));
    if (isCap) {
      // Auto-open manual login form inside the APK for better UX
      setShowManualForm(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!telegramId.trim()) {
      setError('Mohon masukkan ID Telegram Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginManually(telegramId.trim(), name.trim(), username.trim());
      if (!result.success) {
        setError(result.error || 'Gagal masuk.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    setError(null);

    if (!telegramId.trim()) {
      setError('Mohon masukkan ID Telegram Anda untuk mendaftar.');
      return;
    }

    if (!name.trim()) {
      setError('Mohon masukkan Nama Anda untuk pendaftaran.');
      return;
    }

    registerManually(telegramId.trim(), name.trim(), username.trim());
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--tg-bg-color, #030712)',
        color: 'var(--tg-text-color, #f8fafc)'
      }}
      className="min-h-screen flex flex-col items-center justify-center p-5 text-center transition-colors duration-300 bg-mesh-gradient overflow-x-hidden"
    >
      <GlassCard className="max-w-md w-full p-6 space-y-6 border border-slate-800/80 shadow-sm relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-center">
          <AzurLizeLogo size="lg" />
        </div>

        {/* Capacitor / APK Environment Detector Badge */}
        {isCapacitor && (
          <div className="mx-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
            <Sparkles className="w-3 h-3 animate-pulse" /> Terdeteksi di Aplikasi Android (APK)
          </div>
        )}

        {!showManualForm ? (
          /* SECTION 1: STANDARD INSTRUCTIONS */
          <div className="space-y-6">
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

            <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-3">
              <Button
                fullWidth
                onClick={() => {
                  window.location.href = 'https://t.me/azurlize_recruitment_bot';
                }}
              >
                Buka Telegram Bot
              </Button>

              <button
                type="button"
                onClick={() => setShowManualForm(true)}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors py-1 hover:underline cursor-pointer"
              >
                Gunakan Akses Manual / Masuk dari APK
              </button>
            </div>
          </div>
        ) : (
          /* SECTION 2: MANUAL LOGIN / REGISTER FORM FOR APK / STANDALONE BROWSER */
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <button
                type="button"
                onClick={() => {
                  if (!isCapacitor) {
                    setShowManualForm(false);
                  }
                }}
                disabled={isCapacitor}
                className={`flex items-center gap-1 text-xs font-bold transition-colors ${isCapacitor ? 'text-slate-500 cursor-not-allowed' : 'text-slate-400 hover:text-white cursor-pointer'}`}
              >
                {!isCapacitor && <ChevronLeft className="w-4 h-4" />} Akses Manual
              </button>
              <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full text-slate-300 font-bold">
                APK & Browser
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed text-center">
              Masukkan ID Telegram Anda untuk login ke akun yang sudah terdaftar, atau daftar baru jika Anda adalah recruiter baru.
            </p>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3 rounded-2xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="ID Telegram Anda"
                type="number"
                placeholder="Contoh: 123456789"
                icon={<Hash className="w-4 h-4" />}
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                required
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <p className="text-[10px] text-slate-500 -mt-3 pl-1 leading-relaxed">
                *Dapatkan ID Anda dari bot Telegram seperti <span className="text-sky-400">@userinfobot</span> atau <span className="text-sky-400">@MissRose_bot</span> (ketik /id).
              </p>

              <Input
                label="Nama Lengkap / Panggilan"
                type="text"
                placeholder="Masukkan Nama Anda"
                icon={<User className="w-4 h-4" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!telegramId} // Required to register
              />

              <Input
                label="Username Telegram (Opsional)"
                type="text"
                placeholder="Contoh: username_anda (tanpa @)"
                icon={<span className="text-xs text-slate-400 font-bold">@</span>}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  icon={<LogIn className="w-4 h-4" />}
                  className="bg-sky-600 hover:bg-sky-500 text-white rounded-2xl"
                >
                  Masuk Sesi
                </Button>

                <Button
                  type="button"
                  onClick={handleRegister}
                  variant="secondary"
                  icon={<UserPlus className="w-4 h-4" />}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-2xl"
                >
                  Daftar Baru
                </Button>
              </div>
            </form>

            {!isCapacitor && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-300 hover:underline cursor-pointer"
                >
                  Lihat Cara Buka dengan Bot Telegram
                </button>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
