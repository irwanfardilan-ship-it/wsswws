import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/common/GlassCard';
import { useAuth } from '../hooks/useAuth';
import { useReports } from '../hooks/useReports';
import { useRecruiters } from '../hooks/useRecruiters';
import { 
  Coins, 
  HelpCircle, 
  ChevronRight, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  Sliders, 
  Calculator, 
  FileCheck,
  UserCheck,
  ArrowUpRight,
  RefreshCw,
  Search,
  Wallet
} from 'lucide-react';
import { triggerHaptic } from '../telegram/webapp';

export const GajiPage: React.FC = () => {
  const { userProfile, telegramUser } = useAuth();
  const { reports, isLoading, refetch } = useReports();
  const { users, isLoading: isLoadingUsers } = useRecruiters();

  // Selected Recruiter for Admin/Owner view
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>('');
  
  // Custom rate states (IDR)
  const [ratePosting, setRatePosting] = useState<number>(2000);
  const [rateApplicant, setRateApplicant] = useState<number>(5000);
  const [rateQuality, setRateQuality] = useState<number>(10000);
  const [rateVisit, setRateVisit] = useState<number>(100);

  // Simulation states
  const [simPosting, setSimPosting] = useState<string>('5');
  const [simApplicant, setSimApplicant] = useState<string>('3');
  const [simQuality, setSimQuality] = useState<string>('1');
  const [simVisit, setSimVisit] = useState<string>('50');

  // Filter state
  const [filterPeriod, setFilterPeriod] = useState<'bulan_ini' | 'minggu_ini' | 'semua'>('bulan_ini');
  const [showRateSettings, setShowRateSettings] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // Set default selected recruiter to logged in user if they are recruiter
  const isAdminOrOwner = userProfile?.role === 'Admin' || userProfile?.role === 'Owner';

  // Search recruiter filter for dropdown
  const [searchRecruiter, setSearchRecruiter] = useState('');

  // Determine active target recruiter
  const activeRecruiterId = isAdminOrOwner 
    ? (selectedRecruiterId || String(telegramUser?.id)) 
    : String(telegramUser?.id);

  // Find user profile for the active recruiter
  const activeRecruiterProfile = useMemo(() => {
    if (activeRecruiterId === String(telegramUser?.id)) {
      return userProfile;
    }
    return users.find(u => u.telegramId === activeRecruiterId);
  }, [activeRecruiterId, userProfile, users, telegramUser]);

  // Filter reports of active target recruiter
  const targetReports = useMemo(() => {
    return reports.filter(r => r.telegramId === activeRecruiterId);
  }, [reports, activeRecruiterId]);

  // Approved (ACC) reports only
  const accReports = useMemo(() => {
    return targetReports.filter(r => r.result === 'ACC');
  }, [targetReports]);

  // Filtered reports by period
  const filteredAccReports = useMemo(() => {
    const now = new Date();
    return accReports.filter(r => {
      if (!r.date) return false;
      const reportDate = new Date(r.date);
      
      if (filterPeriod === 'minggu_ini') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return reportDate >= oneWeekAgo;
      }
      
      if (filterPeriod === 'bulan_ini') {
        return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
      }
      
      return true; // semua
    });
  }, [accReports, filterPeriod]);

  // Calculate stats based on filtered approved reports
  const stats = useMemo(() => {
    let posting = 0;
    let applicant = 0;
    let quality = 0;
    let visit = 0;

    filteredAccReports.forEach(r => {
      posting += (r.posting || 0);
      applicant += (r.applicant || 0);
      quality += (r.quality || 0);
      visit += (r.visit || 0);
    });

    const incomePosting = posting * ratePosting;
    const incomeApplicant = applicant * rateApplicant;
    const incomeQuality = quality * rateQuality;
    const incomeVisit = visit * rateVisit;
    const totalEarnings = incomePosting + incomeApplicant + incomeQuality + incomeVisit;

    return {
      posting,
      applicant,
      quality,
      visit,
      incomePosting,
      incomeApplicant,
      incomeQuality,
      incomeVisit,
      totalEarnings
    };
  }, [filteredAccReports, ratePosting, rateApplicant, rateQuality, rateVisit]);

  // Active recruiters list for dropdown
  const recruitersList = useMemo(() => {
    return users.filter(u => u.status === 'Active');
  }, [users]);

  const filteredRecruiters = useMemo(() => {
    if (!searchRecruiter) return recruitersList;
    return recruitersList.filter(u => 
      u.firstName.toLowerCase().includes(searchRecruiter.toLowerCase()) || 
      (u.username || '').toLowerCase().includes(searchRecruiter.toLowerCase())
    );
  }, [recruitersList, searchRecruiter]);

  // Simulation calculations
  const simEarnings = useMemo(() => {
    const p = Number(simPosting) || 0;
    const a = Number(simApplicant) || 0;
    const q = Number(simQuality) || 0;
    const v = Number(simVisit) || 0;

    const daily = (p * ratePosting) + (a * rateApplicant) + (q * rateQuality) + (v * rateVisit);
    const weekly = daily * 7;
    const monthly = daily * 30;

    return { daily, weekly, monthly };
  }, [simPosting, simApplicant, simQuality, simVisit, ratePosting, rateApplicant, rateQuality, rateVisit]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const handlePeriodChange = (period: 'bulan_ini' | 'minggu_ini' | 'semua') => {
    triggerHaptic('selection');
    setFilterPeriod(period);
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Coins className="w-5.5 h-5.5 text-blue-400" />
            <span>Gaji Saya</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Kalkulasi komisi & performa rekrutmen Anda.
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('impact', 'light');
            refetch();
          }}
          disabled={isLoading}
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Admin/Owner Selector */}
      {isAdminOrOwner && (
        <GlassCard className="p-4 border-slate-800/85">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Mode Tinjau Recruiter</span>
              </span>
              <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full">
                {userProfile?.role} Panel
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari & pilih nama rekrutir..."
                  value={searchRecruiter}
                  onChange={(e) => setSearchRecruiter(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 max-h-32 divide-y divide-slate-900/50 flex-col">
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedRecruiterId(String(telegramUser?.id));
                    setSearchRecruiter('');
                  }}
                  className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-left text-xs ${
                    activeRecruiterId === String(telegramUser?.id)
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'bg-slate-950/40 hover:bg-slate-900/50 text-slate-300'
                  }`}
                >
                  <span>Saya Sendiri ({userProfile?.firstName})</span>
                  <span className="text-[9px] opacity-75">Active</span>
                </button>

                {filteredRecruiters.map((rec) => {
                  if (rec.telegramId === String(telegramUser?.id)) return null;
                  const isSelected = activeRecruiterId === rec.telegramId;
                  return (
                    <button
                      key={rec.telegramId}
                      onClick={() => {
                        triggerHaptic('selection');
                        setSelectedRecruiterId(rec.telegramId);
                        setSearchRecruiter('');
                      }}
                      className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-left text-xs ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'bg-slate-950/40 hover:bg-slate-900/50 text-slate-300'
                      }`}
                    >
                      <span className="truncate">{rec.firstName}</span>
                      <span className="text-[9px] opacity-75">@{rec.username || 'no-user'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Main Income Estimator Display Card */}
      <GlassCard className="border-slate-800/80 p-5 bg-gradient-to-b from-slate-900/40 to-slate-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Estimasi Komisi {activeRecruiterId === String(telegramUser?.id) ? 'Saya' : (activeRecruiterProfile?.firstName || 'Recruiter')}</span>
            </div>

            {/* Period Filters inside main card */}
            <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => handlePeriodChange('minggu_ini')}
                className={`px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all ${
                  filterPeriod === 'minggu_ini'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => handlePeriodChange('bulan_ini')}
                className={`px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all ${
                  filterPeriod === 'bulan_ini'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => handlePeriodChange('semua')}
                className={`px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all ${
                  filterPeriod === 'semua'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-emerald-400 tracking-tight leading-none">
              {formatIDR(stats.totalEarnings)}
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1.5 flex items-center gap-1">
              <span>Berdasarkan {filteredAccReports.length} laporan disetujui (ACC).</span>
              <button 
                onClick={() => setShowTooltip(p => !p)} 
                className="text-slate-400 hover:text-white inline-flex items-center"
              >
                <HelpCircle className="w-3.5 h-3.5 inline" />
              </button>
            </p>

            {showTooltip && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px] text-slate-400 leading-relaxed space-y-1"
              >
                <p className="font-bold text-white mb-1">💡 Cara Kalkulasi Gaji:</p>
                <p>Uang yang dihitung murni bersumber dari formulir data harian Anda yang memiliki status <span className="text-emerald-400 font-bold">ACC</span>.</p>
                <p>Status <span className="text-amber-400 font-bold">Pending</span> atau <span className="text-rose-400 font-bold">REJECT</span> tidak akan dihitung masuk ke dalam estimasi pembayaran komisi ini.</p>
              </motion.div>
            )}
          </div>

          {/* Quick Rates Button toggler */}
          <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center">
            <span className="text-[10px] text-slate-400">Rate Komisi Aktif: <span className="text-blue-400 font-bold">{formatIDR(ratePosting)}/Post</span></span>
            <button
              onClick={() => {
                triggerHaptic('impact', 'light');
                setShowRateSettings(!showRateSettings);
              }}
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Sliders className="w-3 h-3" />
              <span>{showRateSettings ? 'Sembunyikan Rate' : 'Sesuaikan Rate'}</span>
            </button>
          </div>

          {/* Interactive rate configurator sliders/inputs */}
          {showRateSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 pt-3 border-t border-slate-800/50"
            >
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Ubah Tarif Komisi per Metrik:</p>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Rate Postingan (ACC)</label>
                  <input
                    type="number"
                    value={ratePosting}
                    onChange={(e) => setRatePosting(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Rate Pelamar (ACC)</label>
                  <input
                    type="number"
                    value={rateApplicant}
                    onChange={(e) => setRateApplicant(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Rate Kualitas (ACC)</label>
                  <input
                    type="number"
                    value={rateQuality}
                    onChange={(e) => setRateQuality(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Rate Visit (ACC)</label>
                  <input
                    type="number"
                    value={rateVisit}
                    onChange={(e) => setRateVisit(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </GlassCard>

      {/* Stats Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Postings Card */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-400">Total Postings</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-white">{stats.posting}</span>
            <span className="text-[10px] font-bold text-emerald-400">{formatIDR(stats.incomePosting)}</span>
          </div>
        </div>

        {/* Applicants Card */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-400">Total Pelamar</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-white">{stats.applicant}</span>
            <span className="text-[10px] font-bold text-emerald-400">{formatIDR(stats.incomeApplicant)}</span>
          </div>
        </div>

        {/* Quality Card */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-400">Total Kualitas</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-white">{stats.quality}</span>
            <span className="text-[10px] font-bold text-emerald-400">{formatIDR(stats.incomeQuality)}</span>
          </div>
        </div>

        {/* Visits Card */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-400">Total Kunjungan</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-white">{stats.visit}</span>
            <span className="text-[10px] font-bold text-emerald-400">{formatIDR(stats.incomeVisit)}</span>
          </div>
        </div>
      </div>

      {/* Target Salary Simulation (Motivational Panel) */}
      <GlassCard className="border-slate-800/80 p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight">Simulasi Pendapatan Impian</h3>
              <p className="text-[9.5px] text-slate-400">Prediksikan komisi bulanan dari target harian Anda.</p>
            </div>
          </div>

          {/* Silder/Input targets */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block">Postingan / Hari</label>
              <input
                type="number"
                value={simPosting}
                onChange={(e) => setSimPosting(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 font-bold outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block">Pelamar / Hari</label>
              <input
                type="number"
                value={simApplicant}
                onChange={(e) => setSimApplicant(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 font-bold outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block">Kualitas / Hari</label>
              <input
                type="number"
                value={simQuality}
                onChange={(e) => setSimQuality(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 font-bold outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block">Visit Link / Hari</label>
              <input
                type="number"
                value={simVisit}
                onChange={(e) => setSimVisit(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 font-bold outline-none"
              />
            </div>
          </div>

          {/* Predictions payout card */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Pendapatan per Hari</span>
              <span className="font-extrabold text-white">{formatIDR(simEarnings.daily)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Pendapatan per Minggu (7 Hari)</span>
              <span className="font-extrabold text-white">{formatIDR(simEarnings.weekly)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-400">
              <span className="font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Estimasi per Bulan (30 Hari)</span>
              </span>
              <span className="font-black text-sm">{formatIDR(simEarnings.monthly)}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* List of ACC Reports contributing to salary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Rincian Laporan ACC ({filteredAccReports.length})</span>
          </span>
        </div>

        <div className="space-y-2">
          {filteredAccReports.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
              Tidak ada data laporan berstatus ACC untuk periode yang dipilih.
            </div>
          ) : (
            filteredAccReports.map((report, idx) => {
              const repPostingVal = (report.posting || 0) * ratePosting;
              const repApplicantVal = (report.applicant || 0) * rateApplicant;
              const repQualityVal = (report.quality || 0) * rateQuality;
              const repVisitVal = (report.visit || 0) * rateVisit;
              const repTotal = repPostingVal + repApplicantVal + repQualityVal + repVisitVal;

              return (
                <div 
                  key={report.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-800 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-white">{report.date}</span>
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        {report.grup || 'Umum'}
                      </span>
                    </div>
                    <div className="flex gap-2 text-[10px] text-slate-400 mt-1 flex-wrap">
                      {report.posting ? <span>{report.posting} Post</span> : null}
                      {report.applicant ? <span>{report.applicant} Pelamar</span> : null}
                      {report.quality ? <span>{report.quality} Qual</span> : null}
                      {report.visit ? <span>{report.visit} Visit</span> : null}
                    </div>
                    {report.channel && (
                      <div className="text-[9px] text-slate-500">
                        Channel: <span className="text-slate-400">{report.channel}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-white text-xs">{formatIDR(repTotal)}</div>
                    <div className="text-[9px] text-slate-500 font-medium mt-1">Estimasi Komisi</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
