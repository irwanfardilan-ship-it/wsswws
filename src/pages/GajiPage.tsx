import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/common/GlassCard';
import { useAuth } from '../hooks/useAuth';
import { useReports } from '../hooks/useReports';
import { useRecruiters } from '../hooks/useRecruiters';
import { 
  Coins, 
  Calendar, 
  User, 
  Hash, 
  Clock, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Percent, 
  Sliders, 
  Calculator, 
  Copy, 
  Check, 
  RefreshCw, 
  Search,
  UserCheck,
  Award,
  Wallet,
  Info,
  Archive,
  ChevronDown,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { triggerHaptic } from '../telegram/webapp';

// Helper to generate the last 6 weekly working periods (Monday - Sunday)
const getWeekRanges = () => {
  const ranges = [];
  const today = new Date();
  
  // Get current Monday
  const currentMonday = new Date(today);
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  currentMonday.setDate(diff);
  currentMonday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 6; i++) {
    const monday = new Date(currentMonday);
    monday.setDate(currentMonday.getDate() - (i * 7));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const formatShortDate = (d: Date) => {
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      return d.toLocaleDateString('id-ID', options);
    };

    const formatDbDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayStr}`;
    };

    const label = `${formatShortDate(monday)} - ${formatShortDate(sunday)}`;
    ranges.push({
      label,
      mondayDate: formatDbDate(monday),
      sundayDate: formatDbDate(sunday),
      key: `week-${i}`,
      isPreviousWeek: i === 1,
      isCurrentWeek: i === 0,
    });
  }
  return ranges;
};

export const GajiPage: React.FC = () => {
  const { userProfile, telegramUser } = useAuth();
  const { reports, isLoading, refetch } = useReports();
  const { users } = useRecruiters();

  const weekRanges = useMemo(() => getWeekRanges(), []);
  
  // Active Selected Tab: 'gaji' (Calculated Slip) or 'riwayat' (Archive / History)
  const [activeTab, setActiveTab] = useState<'gaji' | 'riwayat'>('gaji');

  // Active selected week key for custom inspection inside Gaji tab
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(weekRanges[0].key);
  
  // Selected Recruiter for Admin/Owner view
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>('');
  
  // Search state for recruiter list
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // UI States
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedArchiveKey, setCopiedArchiveKey] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [expandedArchiveKey, setExpandedArchiveKey] = useState<string | null>(null);

  // Manual Override states (Specifically for Selected week)
  const [overrideHriKerja, setOverrideHriKerja] = useState<string>('');
  const [overrideTotalPostingan, setOverrideTotalPostingan] = useState<string>('');
  const [overrideDeklarasiT0, setOverrideDeklarasiT0] = useState<string>('');
  const [overrideSebenarnyaT0, setOverrideSebenarnyaT0] = useState<string>('');
  const [overrideT3, setOverrideT3] = useState<string>('');
  const [overrideDeklarasiV0, setOverrideDeklarasiV0] = useState<string>('');
  const [overrideSebenarnyaV0, setOverrideSebenarnyaV0] = useState<string>('');

  // Additional customizable salary fields (Applies as parameters)
  const [selectedLevel, setSelectedLevel] = useState<string>('Level 1');
  const [customTingkatPenerimaan, setCustomTingkatPenerimaan] = useState<string>('');
  const [rasioPeningkatan, setRasioPeningkatan] = useState<number>(0);
  const [gajiPokok, setGajiPokok] = useState<number>(1000000); // Default basic salary
  const [bonusT0, setBonusT0] = useState<number>(0);
  const [bonusT3, setBonusT3] = useState<number>(0);
  const [otherBonus, setOtherBonus] = useState<number>(0);
  const [deduksi, setDeduksi] = useState<number>(0);

  // Rate config for automatic commission
  const [ratePosting, setRatePosting] = useState<number>(2000);
  const [rateT0, setRateT0] = useState<number>(5000);
  const [rateT3, setRateT3] = useState<number>(10000);
  const [rateV0, setRateV0] = useState<number>(100);

  const isAdminOrOwner = userProfile?.role === 'Admin' || userProfile?.role === 'Owner';

  // Determine active recruiter ID
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

  // Approved reports (ACC) for the active recruiter
  const approvedReports = useMemo(() => {
    return reports.filter(r => r.telegramId === activeRecruiterId && r.result === 'ACC');
  }, [reports, activeRecruiterId]);

  // CALCULATE STATS FOR ANY GIVEN WEEK RANGE
  const getWeekStats = (week: typeof weekRanges[0]) => {
    // Filter approved reports within this week range
    const weekReports = approvedReports.filter(r => {
      if (!r.date) return false;
      return r.date >= week.mondayDate && r.date <= week.sundayDate;
    });

    // Unique dates with ACC reports
    const uniqueDays = new Set(weekReports.map(r => r.date));
    const hriKerja = uniqueDays.size;

    let totalPostingan = 0;
    let deklarasiT0 = 0;
    let sebenarnyaT0 = 0;
    let t3Count = 0;
    let deklarasiV0 = 0;
    let sebenarnyaV0 = 0;

    weekReports.forEach(r => {
      totalPostingan += (r.posting || 0);

      if (r.grup === 'T0') {
        deklarasiT0 += (r.applicant || 0);
        sebenarnyaT0 += (r.quality || 0);
      } else if (r.grup === 'T3') {
        t3Count += (r.quality || r.applicant || 0);
      } else if (r.grup === 'V0') {
        deklarasiV0 += (r.visit || 0);
        sebenarnyaV0 += (r.quality || r.applicant || 0);
      }
    });

    const tingkatPenerimaan = deklarasiT0 === 0 ? 0 : Math.round((sebenarnyaT0 / deklarasiT0) * 100);

    const komisi = (totalPostingan * ratePosting) + 
                   (sebenarnyaT0 * rateT0) + 
                   (t3Count * rateT3) + 
                   (sebenarnyaV0 * rateV0);

    const totalGajiNet = gajiPokok + komisi + bonusT0 + bonusT3 + otherBonus - deduksi;

    return {
      hriKerja,
      totalPostingan,
      deklarasiT0,
      sebenarnyaT0,
      t3: t3Count,
      deklarasiV0,
      sebenarnyaV0,
      tingkatPenerimaan,
      komisi,
      totalGajiNet
    };
  };

  // 1. Selected Week Stats - With possible manual overrides
  const selectedWeekObj = useMemo(() => {
    return weekRanges.find(w => w.key === selectedWeekKey) || weekRanges[0];
  }, [weekRanges, selectedWeekKey]);

  const autoStats = useMemo(() => getWeekStats(selectedWeekObj), [approvedReports, selectedWeekObj, ratePosting, rateT0, rateT3, rateV0, gajiPokok, bonusT0, bonusT3, otherBonus, deduksi]);

  const finalStats = useMemo(() => {
    const hriKerja = overrideHriKerja !== '' ? Number(overrideHriKerja) || 0 : autoStats.hriKerja;
    const totalPostingan = overrideTotalPostingan !== '' ? Number(overrideTotalPostingan) || 0 : autoStats.totalPostingan;
    const deklarasiT0 = overrideDeklarasiT0 !== '' ? Number(overrideDeklarasiT0) || 0 : autoStats.deklarasiT0;
    const sebenarnyaT0 = overrideSebenarnyaT0 !== '' ? Number(overrideSebenarnyaT0) || 0 : autoStats.sebenarnyaT0;
    const t3 = overrideT3 !== '' ? Number(overrideT3) || 0 : autoStats.t3;
    const deklarasiV0 = overrideDeklarasiV0 !== '' ? Number(overrideDeklarasiV0) || 0 : autoStats.deklarasiV0;
    const sebenarnyaV0 = overrideSebenarnyaV0 !== '' ? Number(overrideSebenarnyaV0) || 0 : autoStats.sebenarnyaV0;

    const tingkatPenerimaan = customTingkatPenerimaan !== '' 
      ? Number(customTingkatPenerimaan) || 0 
      : (deklarasiT0 === 0 ? 0 : Math.round((sebenarnyaT0 / deklarasiT0) * 100));

    const komisi = (totalPostingan * ratePosting) + 
                   (sebenarnyaT0 * rateT0) + 
                   (t3 * rateT3) + 
                   (sebenarnyaV0 * rateV0);

    const totalGajiNet = gajiPokok + komisi + bonusT0 + bonusT3 + otherBonus - deduksi;

    return {
      hriKerja,
      totalPostingan,
      deklarasiT0,
      sebenarnyaT0,
      t3,
      deklarasiV0,
      sebenarnyaV0,
      tingkatPenerimaan,
      komisi,
      totalGajiNet
    };
  }, [autoStats, overrideHriKerja, overrideTotalPostingan, overrideDeklarasiT0, overrideSebenarnyaT0, overrideT3, overrideDeklarasiV0, overrideSebenarnyaV0, customTingkatPenerimaan, ratePosting, rateT0, rateT3, rateV0, gajiPokok, bonusT0, bonusT3, otherBonus, deduksi]);

  // Previous weeks ranges (index 1 to index 5) which go directly into Archive / Riwayat
  const archiveWeeks = useMemo(() => {
    return weekRanges.slice(1);
  }, [weekRanges]);

  // Recruiter selection filters for Admins/Owners
  const filteredRecruiters = useMemo(() => {
    const activeUsers = users.filter(u => u.status === 'Active');
    if (!searchQuery) return activeUsers;
    return activeUsers.filter(u => 
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Share text builder for any week and its stats
  const getShareText = (week: typeof weekRanges[0], stats: any, isArchive: boolean = false) => {
    return `📋 *SLIP GAJI AZURLIZE TEAM${isArchive ? ' (ARSIP)' : ''}*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 *Tanggal (Periode):* ${week.label}
👤 *Username Recruiter:* @${activeRecruiterProfile?.username || 'no-username'}
🔑 *UID 9 Kucing:* ${activeRecruiterProfile?.akun9Kucing || '-'}
🗓️ *Hari Kerja:* ${stats.hriKerja} Hari

📊 *PERFORMA REKRUTMEN*
- Total Postingan: ${stats.totalPostingan}
- Deklarasi T0: ${stats.deklarasiT0}
- Sebenarnya T0: ${stats.sebenarnyaT0}
- T3: ${stats.t3}
- Deklarasi V0: ${stats.deklarasiV0}
- Sebenarnya V0: ${stats.sebenarnyaV0}

🌟 *PENCAPAIAN*
- Level: ${selectedLevel}
- Tingkat Penerimaan: ${stats.tingkatPenerimaan}%
- Rasio Peningkatan: ${rasioPeningkatan}%

💰 *RINCIAN KEUANGAN*
- Gaji Pokok: ${formatIDR(gajiPokok)}
- Komisi: ${formatIDR(stats.komisi)}
- Bonus (T0): ${formatIDR(bonusT0)}
- Bonus (T3): ${formatIDR(bonusT3)}
- Other Bonus: ${formatIDR(otherBonus)}
- Deduksi: ${formatIDR(deduksi)}

💵 *TOTAL GAJI NET:* ${formatIDR(stats.totalGajiNet)}
━━━━━━━━━━━━━━━━━━━━━━━━━━
_AzurLize Recruitment Automation System_`;
  };

  const handleCopySlip = (week: typeof weekRanges[0], stats: any, isArchive: boolean = false) => {
    triggerHaptic('notification', 'success');
    const text = getShareText(week, stats, isArchive);
    navigator.clipboard.writeText(text);
    if (isArchive) {
      setCopiedArchiveKey(week.key);
      setTimeout(() => setCopiedArchiveKey(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetOverrides = () => {
    triggerHaptic('impact', 'medium');
    setOverrideHriKerja('');
    setOverrideTotalPostingan('');
    setOverrideDeklarasiT0('');
    setOverrideSebenarnyaT0('');
    setOverrideT3('');
    setOverrideDeklarasiV0('');
    setOverrideSebenarnyaV0('');
    setCustomTingkatPenerimaan('');
  };

  // Set selected week and switch back to calculator tab to inspect older slips
  const handleInspectWeek = (week: typeof weekRanges[0]) => {
    triggerHaptic('impact', 'light');
    setSelectedWeekKey(week.key);
    handleResetOverrides();
    setActiveTab('gaji');
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Coins className="w-5.5 h-5.5 text-emerald-400" />
            <span>Kalkulator Gaji iOS</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Perhitungan slip komisi & upah mingguan terintegrasi.
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('impact', 'light');
            refetch();
          }}
          disabled={isLoading}
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Recruiter Selector for Admins */}
      {isAdminOrOwner && (
        <GlassCard className="p-4 border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Pilih Recruiter Yang Ditinjau</span>
            </span>
            <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full">
              {userProfile?.role} Panel
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 max-h-36 divide-y divide-slate-900/50 flex-col">
            <button
              onClick={() => {
                triggerHaptic('selection');
                setSelectedRecruiterId(String(telegramUser?.id));
                setSearchQuery('');
              }}
              className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-left text-xs ${
                activeRecruiterId === String(telegramUser?.id)
                  ? 'bg-blue-600 text-white font-bold'
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
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-left text-xs ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-950/40 hover:bg-slate-900/50 text-slate-300'
                  }`}
                >
                  <span className="truncate">{rec.firstName}</span>
                  <span className="text-[9px] opacity-75">@{rec.username || 'no-user'}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Tabs Navigation */}
      <div className="flex p-1 bg-slate-950/80 border border-slate-900 rounded-2xl">
        <button
          onClick={() => {
            triggerHaptic('selection');
            setActiveTab('gaji');
          }}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'gaji'
              ? 'bg-gradient-to-r from-emerald-500/15 to-blue-500/15 border border-emerald-500/25 text-white shadow-lg shadow-black/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Slip Gaji & Kalkulator</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            setActiveTab('riwayat');
          }}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'riwayat'
              ? 'bg-gradient-to-r from-blue-500/15 to-emerald-500/15 border border-blue-500/25 text-white shadow-lg shadow-black/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Archive className="w-4 h-4 text-amber-500" />
          <span>Arsip & Riwayat</span>
        </button>
      </div>

      {/* TAB CONTENT: GAJI / KALKULATOR */}
      {activeTab === 'gaji' && (
        <div className="flex flex-col items-center justify-center py-16 px-5 text-center space-y-5 bg-slate-950/40 border border-slate-900 rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-slate-800/80 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-950/20">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2 max-w-xs">
            <h3 className="text-base font-black text-white">Dalam Pengembangan</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kalkulator Gaji & Slip Komisi saat ini sedang disesuaikan oleh tim pengembang kami. Silakan gunakan tab <span className="text-amber-500 font-bold">Arsip & Riwayat</span> untuk melihat arsip.
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ARSIP / RIWAYAT */}
      {activeTab === 'riwayat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
              <Archive className="w-4 h-4 text-amber-500" />
              <span>Arsip Mingguan Terkunci</span>
            </span>
            <span className="text-[9px] text-slate-400 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
              History
            </span>
          </div>

          <div className="space-y-3">
            {archiveWeeks.map((week) => {
              const stats = getWeekStats(week);
              const isExpanded = expandedArchiveKey === week.key;
              const isWeekCopied = copiedArchiveKey === week.key;

              return (
                <div 
                  key={week.key}
                  className="rounded-3xl bg-slate-950/40 border border-slate-850/80 hover:border-slate-800 transition-all overflow-hidden"
                >
                  {/* Accordion header */}
                  <div 
                    onClick={() => {
                      triggerHaptic('selection');
                      setExpandedArchiveKey(isExpanded ? null : week.key);
                    }}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none active:bg-slate-900/20"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-white block">
                          {week.label}
                        </span>
                        {week.isPreviousWeek && (
                          <span className="text-[8px] uppercase font-black bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                            Minggu Lalu
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span>{stats.hriKerja} Hari Kerja</span>
                        <span className="text-slate-600">•</span>
                        <span>{stats.totalPostingan} Postingan</span>
                        <span className="text-slate-600">•</span>
                        <span>Acceptance {stats.tingkatPenerimaan}%</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2.5">
                      <div>
                        <span className="text-xs font-black text-emerald-400 block">
                          {formatIDR(stats.totalGajiNet)}
                        </span>
                        <span className="text-[8.5px] text-slate-500 font-medium block">Total Gaji Net</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Accordion body containing full calculated statement (Fields 1-20) */}
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="px-4 pb-4 pt-1 border-t border-slate-900 bg-slate-950/80 space-y-4"
                    >
                      {/* Actions panel */}
                      <div className="flex justify-end items-center pt-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopySlip(week, stats, true);
                          }}
                          className={`flex items-center gap-1 text-[9px] font-black py-1 px-2.5 rounded-lg transition-all ${
                            isWeekCopied 
                              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25' 
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isWeekCopied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                          <span>{isWeekCopied ? 'Tersalin' : 'Salin Slip'}</span>
                        </button>
                      </div>

                      {/* Fields 1-4 */}
                      <div className="grid grid-cols-2 gap-3 text-xs border-b border-dashed border-slate-900 pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] text-slate-500 block uppercase font-medium">1. Tanggal (Periode)</span>
                          <span className="font-bold text-white block">{week.label}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] text-slate-500 block uppercase font-medium">2. Username Recruiter</span>
                          <span className="font-bold text-blue-400 block">@{activeRecruiterProfile?.username || 'no-username'}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] text-slate-500 block uppercase font-medium">3. UID 9 Kucing</span>
                          <span className="font-bold text-slate-300 block">{activeRecruiterProfile?.akun9Kucing || '-'}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8.5px] text-slate-500 block uppercase font-medium">4. Hri Kerja</span>
                          <span className="font-bold text-white block">{stats.hriKerja} Hari</span>
                        </div>
                      </div>

                      {/* Fields 5-10 */}
                      <div className="space-y-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Metrik Kerja</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div className="bg-slate-900/30 p-2 rounded-xl border border-slate-900 flex flex-col">
                            <span className="text-[8px] font-semibold text-slate-400">5. Total Postingan</span>
                            <span className="font-bold text-white mt-0.5">{stats.totalPostingan}</span>
                          </div>
                          <div className="bg-slate-900/30 p-2 rounded-xl border border-slate-900 flex flex-col">
                            <span className="text-[8px] font-semibold text-slate-400">6. Deklarasi T0</span>
                            <span className="font-bold text-white mt-0.5">{stats.deklarasiT0}</span>
                          </div>
                          <div className="bg-slate-900/30 p-2 rounded-xl border border-slate-900 flex flex-col">
                            <span className="text-[8px] font-semibold text-slate-400">7. Sebenarnya T0</span>
                            <span className="font-bold text-emerald-400 mt-0.5">{stats.sebenarnyaT0}</span>
                          </div>
                          <div className="bg-slate-900/30 p-2 rounded-xl border border-slate-900 flex flex-col">
                            <span className="text-[8px] font-semibold text-slate-400">8. T3 (Quality)</span>
                            <span className="font-bold text-white mt-0.5">{stats.t3}</span>
                          </div>
                          <div className="bg-slate-900/30 p-2 rounded-xl border border-slate-900 flex flex-col">
                            <span className="text-[8px] font-semibold text-slate-400">9. Deklarasi V0</span>
                            <span className="font-bold text-white mt-0.5">{stats.deklarasiV0}</span>
                          </div>
                          <div className="bg-slate-900/30 p-2 rounded-xl border border-slate-900 flex flex-col">
                            <span className="text-[8px] font-semibold text-slate-400">10. Sebenarnya V0</span>
                            <span className="font-bold text-emerald-400 mt-0.5">{stats.sebenarnyaV0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Fields 11-13 */}
                      <div className="grid grid-cols-3 gap-2 border-t border-b border-dashed border-slate-900 py-3">
                        <div className="text-center">
                          <span className="text-[7.5px] text-slate-500 uppercase font-semibold block">11. Level</span>
                          <span className="text-xs font-bold text-blue-400 mt-0.5 block">{selectedLevel}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[7.5px] text-slate-500 uppercase font-semibold block">12. Penerimaan</span>
                          <span className="text-xs font-bold text-emerald-400 mt-0.5 block">{stats.tingkatPenerimaan}%</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[7.5px] text-slate-500 uppercase font-semibold block">13. Rasio Naik</span>
                          <span className="text-xs font-bold text-amber-400 mt-0.5 block">{rasioPeningkatan}%</span>
                        </div>
                      </div>

                      {/* Fields 14-20 */}
                      <div className="space-y-1.5 text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>14. Gaji Pokok</span>
                          <span className="font-bold text-white">{formatIDR(gajiPokok)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>15. Komisi Kerja</span>
                          <span className="font-bold text-emerald-400">{formatIDR(stats.komisi)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>16. Bonus (T0)</span>
                          <span className="font-bold text-white">{formatIDR(bonusT0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>17. Bonus (T3)</span>
                          <span className="font-bold text-white">{formatIDR(bonusT3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>18. Other Bonus</span>
                          <span className="font-bold text-white">{formatIDR(otherBonus)}</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                          <span>19. Deduksi</span>
                          <span className="font-bold">-{formatIDR(deduksi)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-900 text-white font-black">
                          <span className="text-emerald-400">20. Gaji (Total Gaji Net)</span>
                          <span className="text-emerald-400">{formatIDR(stats.totalGajiNet)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
