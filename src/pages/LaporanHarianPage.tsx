import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/common/GlassCard';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useReports } from '../hooks/useReports';
import { DailyReportFormData } from '../types';
import { Calendar, Eye, UserCheck, Star, Share2, AlertCircle, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { getWIBDate } from '../utils/format';

export const LaporanHarianPage: React.FC = () => {
  const { submitReport, isLoading } = useReports();

  const todayStr = getWIBDate();

  const [formData, setFormData] = useState<DailyReportFormData>({
    date: todayStr,
    visit: 0,
    applicant: 0,
    quality: 0,
    posting: 0,
    permission: 0,
    note: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

      <GlassCard className="border-sky-500/20 shadow-2xl">
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
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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

            <Input
              label="Jumlah Postingan"
              type="number"
              min="0"
              placeholder="0"
              icon={<Share2 className="w-4 h-4 text-indigo-400" />}
              value={formData.posting}
              onChange={(e) => setFormData({ ...formData, posting: Number(e.target.value) })}
              required
            />
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

