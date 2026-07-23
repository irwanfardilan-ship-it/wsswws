import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/common/GlassCard';
import { Button } from '../components/common/Button';
import { AzurLizeLogo } from '../components/logo/AzurLizeLogo';
import { useAuth } from '../hooks/useAuth';
import { Clock, RefreshCw, CheckCircle2 } from 'lucide-react';

export const PendingPage: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Auto check status every 8 seconds
    const interval = setInterval(async () => {
      await refreshProfile();
    }, 8000);
    return () => clearInterval(interval);
  }, [refreshProfile]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    await refreshProfile();
    setTimeout(() => {
      setIsChecking(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 pt-safe-header pb-safe text-center overflow-x-hidden">
      <div className="max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <AzurLizeLogo size="lg" />
        </div>

        <GlassCard className="space-y-6 border-amber-500/30 p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 relative"
          >
            <Clock className="w-10 h-10 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 font-bold text-xs">
              ⌛
            </div>
          </motion.div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Status Pendaftaran: Pending
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight pt-2">
              Menunggu Persetujuan Admin
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed px-2">
              Data pendaftaran Anda telah berhasil dikirim ke sistem <strong className="text-blue-400">AzurLizeTeam</strong>. Silakan tunggu hingga Admin menyetujui akun Anda.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
            <span className="font-semibold text-slate-300 block">Detail Pendaftar:</span>
            <div className="space-y-1 text-slate-400">
              <p>📍 Nama: <span className="text-white font-medium">{userProfile?.firstName} {userProfile?.lastName}</span></p>
              <p>📍 Email: <span className="text-white font-medium">{userProfile?.email}</span></p>
              <p>📍 WhatsApp: <span className="text-white font-medium">{userProfile?.whatsapp}</span></p>
              <p>📍 UID 9Kucing: <span className="text-white font-medium">{userProfile?.akun9Kucing}</span></p>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Button
              fullWidth
              variant="secondary"
              isLoading={isChecking}
              onClick={handleManualCheck}
              icon={<RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />}
            >
              Cek Status Persetujuan
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Auto-sync aktif. Halaman akan otomatis masuk ketika disetujui.
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
