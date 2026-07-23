import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/common/GlassCard';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useReports } from '../hooks/useReports';
import { useAuth } from '../hooks/useAuth';
import { subscribeToRecruiterPosts } from '../firebase/services/postService';
import { DailyReportFormData, BatchPost } from '../types';
import { Calendar, Eye, UserCheck, Star, Share2, AlertCircle, FileText, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import { getWIBDate } from '../utils/format';

export const LaporanHarianPage: React.FC = () => {
  const { submitReport, isLoading } = useReports();
  const { userProfile, telegramUser } = useAuth();

  const todayStr = getWIBDate();
  const effectiveTelegramId = userProfile?.telegramId || (telegramUser?.id ? String(telegramUser.id) : '');

  const [formData, setFormData] = useState<DailyReportFormData>({
    date: todayStr,
    visit: 0,
    applicant: 0,
    quality: 0,
    posting: 0,
    permission: 0,
    note: ''
  });

  const [allPosts, setAllPosts] = useState<BatchPost[]>([]);
  const [hasManuallyEditedPosting, setHasManuallyEditedPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Subscribe to recruiter posts
  useEffect(() => {
    if (!effectiveTelegramId) return;

    const unsubscribe = subscribeToRecruiterPosts(
      effectiveTelegramId,
      (fetchedPosts) => {
        setAllPosts(fetchedPosts);
      },
      100
    );

    return () => unsubscribe();
  }, [effectiveTelegramId]);

  // Compute auto-detected posting count for the selected date
  const autoPostingCount = useMemo(() => {
    const normalizeDate = (d: string) => {
      if (!d) return '';
      const parts = d.split('-');
      if (parts.length !== 3) return d;
      if (parts[0].length === 2) return parts.reverse().join('-');
      return d;
    };

    const targetDate = normalizeDate(formData.date);
    const matchedPosts = allPosts.filter(p => normalizeDate(p.date || '') === targetDate && !p.archived);

    return matchedPosts.reduce((sum, post) => {
      const linkCount = Array.isArray(post.links) ? post.links.length : 0;
      return sum + linkCount;
    }, 0);
  }, [allPosts, formData.date]);

  // Sync autoPostingCount with formData.posting
  useEffect(() => {
    if (!hasManuallyEditedPosting) {
      setFormData(prev => ({
        ...prev,
        posting: autoPostingCount
      }));
    }
  }, [autoPostingCount, hasManuallyEditedPosting]);

  const handleDateChange = (newDate: string) => {
    setHasManuallyEditedPosting(false); // Reset manual override flag so new date auto-fills
    setFormData(prev => ({
      ...prev,
      date: newDate
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      setError('Tanggal wajib diisi.');
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      await submitReport(formData);
      setSuccessMsg('Laporan harian berhasil dikirim dan tersimpan!');

      // Reset form counters
      setFormData({
        date: todayStr,
        visit: 0,
        applicant: 0,
        quality: 0,
        posting: 0,
        permission: 0,
        note: ''
      });
      setHasManuallyEditedPosting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim laporan harian.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 pb-28"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <span>Form Laporan Harian</span>
        </h2>
        <p className="text-xs text-slate-400">
          Masukkan metrik rekrutmen harian Anda secara akurat.
        </p>
      </div>

      <GlassCard className="border-slate-800/80 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl flex items-center gap-2 font-medium">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs p-3.5 rounded-2xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <Input
            label="Tanggal Laporan"
            type="date"
            icon={<Calendar className="w-4 h-4" />}
            value={formData.date}
            onChange={(e) => handleDateChange(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kunjungan"
              type="number"
              min="0"
              placeholder="0"
              icon={<Eye className="w-4 h-4 text-blue-400" />}
              value={formData.visit}
              onChange={(e) => setFormData({ ...formData, visit: Number(e.target.value) })}
              required
            />

            <Input
              label="Pelamar"
              type="number"
              min="0"
              placeholder="0"
              icon={<UserCheck className="w-4 h-4 text-sky-400" />}
              value={formData.applicant}
              onChange={(e) => setFormData({ ...formData, applicant: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Berkualitas / Pengujian"
              type="number"
              min="0"
              placeholder="0"
              icon={<Star className="w-4 h-4 text-emerald-400" />}
              value={formData.quality}
              onChange={(e) => setFormData({ ...formData, quality: Number(e.target.value) })}
              required
            />

            <div className="relative flex flex-col">
              <Input
                label="Jumlah Postingan"
                type="number"
                min="0"
                placeholder="0"
                icon={<Share2 className="w-4 h-4 text-indigo-400" />}
                value={formData.posting}
                onChange={(e) => {
                  setFormData({ ...formData, posting: Number(e.target.value) });
                  setHasManuallyEditedPosting(true);
                }}
                required
              />
              <div className="mt-1 flex items-center justify-between px-1 text-[9px] leading-tight">
                <span className="text-slate-400 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse shrink-0" />
                  <span>Auto: <strong className="text-indigo-400">{autoPostingCount}</strong> link</span>
                </span>
                {hasManuallyEditedPosting && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, posting: autoPostingCount }));
                      setHasManuallyEditedPosting(false);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-black flex items-center gap-0.5 transition-colors"
                  >
                    <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                    <span>Sync</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <Input
            label="Izin / Kendala (Jumlah)"
            type="number"
            min="0"
            placeholder="0"
            icon={<AlertCircle className="w-4 h-4 text-amber-400" />}
            value={formData.permission}
            onChange={(e) => setFormData({ ...formData, permission: Number(e.target.value) })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold tracking-wider text-slate-400 uppercase px-1">
              Keterangan / Catatan Laporan
            </label>
            <textarea
              rows={3}
              placeholder="Tuliskan catatan postingan, kendala, atau keterangan tambahan..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full rounded-2xl py-3 px-4 text-sm font-medium outline-none border border-slate-800 bg-slate-900/80 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-white transition-all placeholder:text-slate-500"
            />
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            icon={<Sparkles className="w-4 h-4" />}
            className="mt-2"
          >
            Kirim Laporan
          </Button>
        </form>
      </GlassCard>
    </motion.div>
  );
};

