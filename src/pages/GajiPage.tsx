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
  
  // Active selected week key for custom inspection (if needed, otherwise we focus on Minggu Ini & Archive)
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

  // Manual Override states (Specifically for Minggu Ini / Current week)
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

  // 1. Current Week ("Minggu Ini") Stats - With possible manual overrides
  const currentWeekObj = weekRanges[0];
  const autoCurrentStats = useMemo(() => getWeekStats(currentWeekObj), [approvedReports, currentWeekObj, ratePosting, rateT0, rateT3, rateV0, gajiPokok, bonusT0, bonusT3, otherBonus, deduksi]);

  const finalCurrentStats = useMemo(() => {
    const hriKerja = overrideHriKerja !== '' ? Number(overrideHriKerja) || 0 : autoCurrentStats.hriKerja;
    const totalPostingan = overrideTotalPostingan !== '' ? Number(overrideTotalPostingan) || 0 : autoCurrentStats.totalPostingan;
    const deklarasiT0 = overrideDeklarasiT0 !== '' ? Number(overrideDeklarasiT0) || 0 : autoCurrentStats.deklarasiT0;
    const sebenarnyaT0 = overrideSebenarnyaT0 !== '' ? Number(overrideSebenarnyaT0) || 0 : autoCurrentStats.sebenarnyaT0;
    const t3 = overrideT3 !== '' ? Number(overrideT3) || 0 : autoCurrentStats.t3;
    const deklarasiV0 = overrideDeklarasiV0 !== '' ? Number(overrideDeklarasiV0) || 0 : autoCurrentStats.deklarasiV0;
    const sebenarnyaV0 = overrideSebenarnyaV0 !== '' ? Number(overrideSebenarnyaV0) || 0 : autoCurrentStats.sebenarnyaV0;

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
  }, [autoCurrentStats, overrideHriKerja, overrideTotalPostingan, overrideDeklarasiT0, overrideSebenarnyaT0, overrideT3, overrideDeklarasiV0, overrideSebenarnyaV0, customTingkatPenerimaan, ratePosting, rateT0, rateT3, rateV0, gajiPokok, bonusT0, bonusT3, otherBonus, deduksi]);

  // Previous weeks ranges (index 1 to index 5) which directly go into Archive
  const archiveWeeks = useMemo(() => {
    return weekRanges.slice(1);
  }, [weekRanges]);

  // Recruiter selection filters
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
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
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

      {/* SECTION 1: MINGGU INI (CURRENT ACTIVE WEEK) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Gaji Minggu Ini (Aktif)</span>
          </span>
          <span className="text-[9px] text-emerald-400/80 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Realtime
          </span>
        </div>

        {/* Main Interactive Slip Card (Elegant, iOS receipt-like design) */}
        <div className="relative">
          {/* Soft elegant mesh backdrops */}
          <div className="absolute top-0 right-1/4 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="p-5 rounded-3xl bg-slate-950/95 border border-slate-800/90 shadow-2xl space-y-5 relative">
            
            {/* Slip Header watermark */}
            <div className="flex items-start justify-between pb-3 border-b border-dashed border-slate-800/80">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Official Statement
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">Slip Gaji Recruiter</h3>
                <p className="text-[9px] text-slate-500 font-medium">AzurLize Team System • Minggu Ini</p>
              </div>
              
              <button
                onClick={() => handleCopySlip(currentWeekObj, finalCurrentStats, false)}
                className={`flex items-center gap-1 text-[10px] font-bold py-1.5 px-3 rounded-xl transition-all ${
                  copied 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin Slip'}</span>
              </button>
            </div>

            {/* Core Recruiter & Period info (Fields 1, 2, 3, 4) */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 block uppercase font-semibold">1. Tanggal (Periode)</span>
                <span className="font-extrabold text-white truncate block">{currentWeekObj.label}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 block uppercase font-semibold">2. Username Recruiter</span>
                <span className="font-extrabold text-blue-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-400 inline" />
                  <span>@{activeRecruiterProfile?.username || 'no-user'}</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 block uppercase font-semibold">3. UID 9 Kucing Recruiter</span>
                <span className="font-extrabold text-slate-300 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-500 inline" />
                  <span>{activeRecruiterProfile?.akun9Kucing || 'Belum diisi'}</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 block uppercase font-semibold">4. Hri Kerja</span>
                <span className="font-extrabold text-white flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500 inline" />
                  <span>{finalCurrentStats.hriKerja} Hari</span>
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-900" />

            {/* Recruiter Recruitment Performance metrics (Fields 5, 6, 7, 8, 9, 10) */}
            <div className="space-y-2.5">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Metrik Pekerjaan</span>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Field 5: TOTAL POSTINGAN */}
                <div className="bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-semibold text-slate-400 uppercase">5. Total Postingan</span>
                  <span className="text-sm font-black text-white mt-1">{finalCurrentStats.totalPostingan}</span>
                </div>

                {/* Field 6: Deklarasi T0 */}
                <div className="bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-semibold text-slate-400 uppercase">6. Deklarasi T0</span>
                  <span className="text-sm font-black text-white mt-1">{finalCurrentStats.deklarasiT0}</span>
                </div>

                {/* Field 7: Sebenarnya T0 */}
                <div className="bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-semibold text-slate-400 uppercase">7. Sebenarnya T0</span>
                  <span className="text-sm font-black text-emerald-400 mt-1">{finalCurrentStats.sebenarnyaT0}</span>
                </div>

                {/* Field 8: T3 */}
                <div className="bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-semibold text-slate-400 uppercase">8. T3 (Quality)</span>
                  <span className="text-sm font-black text-white mt-1">{finalCurrentStats.t3}</span>
                </div>

                {/* Field 9: Deklarasi V0 */}
                <div className="bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-semibold text-slate-400 uppercase">9. Deklarasi V0</span>
                  <span className="text-sm font-black text-white mt-1">{finalCurrentStats.deklarasiV0}</span>
                </div>

                {/* Field 10: Sebenarnya V0 */}
                <div className="bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-semibold text-slate-400 uppercase">10. Sebenarnya V0</span>
                  <span className="text-sm font-black text-emerald-400 mt-1">{finalCurrentStats.sebenarnyaV0}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-900" />

            {/* Level and Achievement metrics (Fields 11, 12, 13) */}
            <div className="grid grid-cols-3 gap-2">
              {/* Field 11: Level */}
              <div className="bg-blue-950/20 border border-blue-500/10 p-2 rounded-xl text-center">
                <span className="text-[7.5px] text-slate-500 uppercase font-semibold block">11. Level</span>
                <span className="text-xs font-black text-blue-400 uppercase mt-0.5 block">{selectedLevel}</span>
              </div>

              {/* Field 12: Tingkat Penerimaan */}
              <div className="bg-emerald-950/20 border border-emerald-500/10 p-2 rounded-xl text-center">
                <span className="text-[7.5px] text-slate-500 uppercase font-semibold block">12. Penerimaan</span>
                <span className="text-xs font-black text-emerald-400 mt-0.5 block">{finalCurrentStats.tingkatPenerimaan}%</span>
              </div>

              {/* Field 13: Rasio Peningkatan */}
              <div className="bg-amber-950/20 border border-amber-500/10 p-2 rounded-xl text-center">
                <span className="text-[7.5px] text-slate-500 uppercase font-semibold block">13. Rasio Naik</span>
                <span className="text-xs font-black text-amber-400 mt-0.5 block">{rasioPeningkatan}%</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-800/80" />

            {/* Detailed Financial Breakdown (Fields 14, 15, 16, 17, 18, 19, 20) */}
            <div className="space-y-2">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Rincian Finansial</span>
              
              <div className="space-y-1.5 text-xs text-slate-400">
                {/* Field 14: Gaji Pokok */}
                <div className="flex justify-between items-center">
                  <span>14. Gaji Pokok</span>
                  <span className="font-extrabold text-white">{formatIDR(gajiPokok)}</span>
                </div>

                {/* Field 15: Komisi */}
                <div className="flex justify-between items-center">
                  <span>15. Komisi Kerja</span>
                  <span className="font-extrabold text-emerald-400">{formatIDR(finalCurrentStats.komisi)}</span>
                </div>

                {/* Field 16: Bonus (T0) */}
                <div className="flex justify-between items-center">
                  <span>16. Bonus (T0)</span>
                  <span className="font-extrabold text-white">{formatIDR(bonusT0)}</span>
                </div>

                {/* Field 17: Bonus (T3) */}
                <div className="flex justify-between items-center">
                  <span>17. Bonus (T3)</span>
                  <span className="font-extrabold text-white">{formatIDR(bonusT3)}</span>
                </div>

                {/* Field 18: Other Bonus */}
                <div className="flex justify-between items-center">
                  <span>18. Other Bonus</span>
                  <span className="font-extrabold text-white">{formatIDR(otherBonus)}</span>
                </div>

                {/* Field 19: Deduksi */}
                <div className="flex justify-between items-center text-rose-400">
                  <span>19. Deduksi (Potongan)</span>
                  <span className="font-extrabold">-{formatIDR(deduksi)}</span>
                </div>

                {/* Field 20: Net Salary */}
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-white">
                  <span className="font-black text-sm text-emerald-400 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>20. Gaji (Total Gaji Net)</span>
                  </span>
                  <span className="text-xl font-black text-emerald-400">{formatIDR(finalCurrentStats.totalGajiNet)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel / Override Settings Form for current week */}
      <GlassCard className="p-4 border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('impact', 'light');
              setShowConfig(!showConfig);
            }}
            className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300"
          >
            <Sliders className="w-4 h-4" />
            <span>{showConfig ? 'Sembunyikan Parameter & Pengalihan' : 'Sesuaikan Parameter & Pengalihan Manual'}</span>
          </button>
          
          {(overrideHriKerja !== '' || overrideTotalPostingan !== '' || overrideDeklarasiT0 !== '' || overrideSebenarnyaT0 !== '' || overrideT3 !== '' || overrideDeklarasiV0 !== '' || overrideSebenarnyaV0 !== '') && (
            <button
              onClick={handleResetOverrides}
              className="text-[9px] font-black bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-lg uppercase animate-pulse"
            >
              Reset Overrides
            </button>
          )}
        </div>

        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-3 border-t border-slate-900"
          >
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-3 flex gap-2 text-[10px] text-slate-400 leading-normal">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p>
                Ubah parameter perhitungan komisi kerja di bawah ini. Nilai kosong akan dihitung otomatis secara realtime dari data laporan disetujui (<span className="text-emerald-400 font-bold">ACC</span>).
              </p>
            </div>

            {/* Overrides form fields */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Override Performa Manual (Minggu Ini):</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Hari Kerja</label>
                  <input
                    type="number"
                    value={overrideHriKerja}
                    onChange={(e) => setOverrideHriKerja(e.target.value)}
                    placeholder={`${autoCurrentStats.hriKerja} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Total Postingan</label>
                  <input
                    type="number"
                    value={overrideTotalPostingan}
                    onChange={(e) => setOverrideTotalPostingan(e.target.value)}
                    placeholder={`${autoCurrentStats.totalPostingan} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Deklarasi T0</label>
                  <input
                    type="number"
                    value={overrideDeklarasiT0}
                    onChange={(e) => setOverrideDeklarasiT0(e.target.value)}
                    placeholder={`${autoCurrentStats.deklarasiT0} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Sebenarnya T0</label>
                  <input
                    type="number"
                    value={overrideSebenarnyaT0}
                    onChange={(e) => setOverrideSebenarnyaT0(e.target.value)}
                    placeholder={`${autoCurrentStats.sebenarnyaT0} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override T3</label>
                  <input
                    type="number"
                    value={overrideT3}
                    onChange={(e) => setOverrideT3(e.target.value)}
                    placeholder={`${autoCurrentStats.t3} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Deklarasi V0</label>
                  <input
                    type="number"
                    value={overrideDeklarasiV0}
                    onChange={(e) => setOverrideDeklarasiV0(e.target.value)}
                    placeholder={`${autoCurrentStats.deklarasiV0} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Sebenarnya V0</label>
                  <input
                    type="number"
                    value={overrideSebenarnyaV0}
                    onChange={(e) => setOverrideSebenarnyaV0(e.target.value)}
                    placeholder={`${autoCurrentStats.sebenarnyaV0} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override % Penerimaan</label>
                  <input
                    type="number"
                    value={customTingkatPenerimaan}
                    onChange={(e) => setCustomTingkatPenerimaan(e.target.value)}
                    placeholder={`${autoCurrentStats.tingkatPenerimaan}% (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-900">Rincian Finansial & Level:</h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Level Recruiter</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="Level 1">Level 1 (Basic)</option>
                    <option value="Level 2">Level 2 (Bronze)</option>
                    <option value="Level 3">Level 3 (Silver)</option>
                    <option value="Level 4">Level 4 (Gold)</option>
                    <option value="Custom">Level Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Rasio Peningkatan (%)</label>
                  <input
                    type="number"
                    value={rasioPeningkatan}
                    onChange={(e) => setRasioPeningkatan(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    value={gajiPokok}
                    onChange={(e) => setGajiPokok(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Bonus T0 (Rp)</label>
                  <input
                    type="number"
                    value={bonusT0}
                    onChange={(e) => setBonusT0(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Bonus T3 (Rp)</label>
                  <input
                    type="number"
                    value={bonusT3}
                    onChange={(e) => setBonusT3(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Other Bonus (Rp)</label>
                  <input
                    type="number"
                    value={otherBonus}
                    onChange={(e) => setOtherBonus(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Deduksi (Potongan Rp)</label>
                  <input
                    type="number"
                    value={deduksi}
                    onChange={(e) => setDeduksi(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-rose-400 font-bold"
                  />
                </div>
              </div>

              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-900">Konfigurasi Tarif Komisi (Global/Default):</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Rate Postingan (Rp)</label>
                  <input
                    type="number"
                    value={ratePosting}
                    onChange={(e) => setRatePosting(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Rate T0 (Rp)</label>
                  <input
                    type="number"
                    value={rateT0}
                    onChange={(e) => setRateT0(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Rate T3 (Rp)</label>
                  <input
                    type="number"
                    value={rateT3}
                    onChange={(e) => setRateT3(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Rate V0 (Rp)</label>
                  <input
                    type="number"
                    value={rateV0}
                    onChange={(e) => setRateV0(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </GlassCard>

      {/* SECTION 2: ARSIP GAJI MINGGUAN (RIWAYAT) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
            <Archive className="w-4 h-4 text-amber-500" />
            <span>Arsip Gaji Mingguan (Riwayat)</span>
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
                className="rounded-3xl bg-slate-950/40 border border-slate-800 hover:border-slate-700/80 transition-all overflow-hidden"
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
                    <div className="flex justify-between items-center pt-2.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15">
                        Arsip Rincian Slip
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySlip(week, stats, true);
                        }}
                        className={`flex items-center gap-1 text-[9px] font-black py-1 px-2.5 rounded-lg transition-all ${
                          isWeekCopied 
                            ? 'bg-emerald-500 text-slate-950' 
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
    </div>
  );
};
