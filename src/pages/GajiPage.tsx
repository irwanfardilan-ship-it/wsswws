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
  ShieldCheck,
  ChevronDown,
  Info
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
  
  // Select active week (default to current week)
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(weekRanges[0].key);
  
  // Selected Recruiter for Admin/Owner view
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>('');
  
  // Search state for recruiter list
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // UI States
  const [copied, setCopied] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Manual Override states (if the owner/admin or user wants to customize any exact field)
  const [overrideHriKerja, setOverrideHriKerja] = useState<string>('');
  const [overrideTotalPostingan, setOverrideTotalPostingan] = useState<string>('');
  const [overrideDeklarasiT0, setOverrideDeklarasiT0] = useState<string>('');
  const [overrideSebenarnyaT0, setOverrideSebenarnyaT0] = useState<string>('');
  const [overrideT3, setOverrideT3] = useState<string>('');
  const [overrideDeklarasiV0, setOverrideDeklarasiV0] = useState<string>('');
  const [overrideSebenarnyaV0, setOverrideSebenarnyaV0] = useState<string>('');

  // Additional customizable salary fields
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

  // Active week range details
  const activeWeek = useMemo(() => {
    return weekRanges.find(w => w.key === selectedWeekKey) || weekRanges[0];
  }, [weekRanges, selectedWeekKey]);

  // Filter reports of active recruiter within selected week range
  const weekReports = useMemo(() => {
    return reports.filter(r => {
      if (r.telegramId !== activeRecruiterId) return false;
      if (!r.date) return false;
      return r.date >= activeWeek.mondayDate && r.date <= activeWeek.sundayDate;
    });
  }, [reports, activeRecruiterId, activeWeek]);

  // Approved (ACC) reports in the week
  const accWeekReports = useMemo(() => {
    return weekReports.filter(r => r.result === 'ACC');
  }, [weekReports]);

  // CALCULATED VALUES FROM APPROVED REPORTS
  const calculatedStats = useMemo(() => {
    // Unique dates with ACC reports
    const uniqueDays = new Set(accWeekReports.map(r => r.date));
    const hriKerja = uniqueDays.size;

    let totalPostingan = 0;
    let deklarasiT0 = 0;
    let sebenarnyaT0 = 0;
    let t3Count = 0;
    let deklarasiV0 = 0;
    let sebenarnyaV0 = 0;

    accWeekReports.forEach(r => {
      // Total Postingan
      totalPostingan += (r.posting || 0);

      if (r.grup === 'T0') {
        deklarasiT0 += (r.applicant || 0);
        sebenarnyaT0 += (r.quality || 0);
      } else if (r.grup === 'T3') {
        t3Count += (r.quality || r.applicant || 0); // Sum of quality / applicant for T3
      } else if (r.grup === 'V0') {
        deklarasiV0 += (r.visit || 0);
        sebenarnyaV0 += (r.quality || r.applicant || 0);
      }
    });

    return {
      hriKerja,
      totalPostingan,
      deklarasiT0,
      sebenarnyaT0,
      t3: t3Count,
      deklarasiV0,
      sebenarnyaV0
    };
  }, [accWeekReports]);

  // FINAL VALUES (Either manual override or calculated)
  const finalHriKerja = overrideHriKerja !== '' ? Number(overrideHriKerja) || 0 : calculatedStats.hriKerja;
  const finalTotalPostingan = overrideTotalPostingan !== '' ? Number(overrideTotalPostingan) || 0 : calculatedStats.totalPostingan;
  const finalDeklarasiT0 = overrideDeklarasiT0 !== '' ? Number(overrideDeklarasiT0) || 0 : calculatedStats.deklarasiT0;
  const finalSebenarnyaT0 = overrideSebenarnyaT0 !== '' ? Number(overrideSebenarnyaT0) || 0 : calculatedStats.sebenarnyaT0;
  const finalT3 = overrideT3 !== '' ? Number(overrideT3) || 0 : calculatedStats.t3;
  const finalDeklarasiV0 = overrideDeklarasiV0 !== '' ? Number(overrideDeklarasiV0) || 0 : calculatedStats.deklarasiV0;
  const finalSebenarnyaV0 = overrideSebenarnyaV0 !== '' ? Number(overrideSebenarnyaV0) || 0 : calculatedStats.sebenarnyaV0;

  // Tingkat Penerimaan (%)
  const tingkatPenerimaanVal = useMemo(() => {
    if (customTingkatPenerimaan !== '') {
      return Number(customTingkatPenerimaan) || 0;
    }
    if (finalDeklarasiT0 === 0) return 0;
    return Math.round((finalSebenarnyaT0 / finalDeklarasiT0) * 100);
  }, [customTingkatPenerimaan, finalDeklarasiT0, finalSebenarnyaT0]);

  // Auto-calculated Commission
  const calculatedKomisi = useMemo(() => {
    const postingCommission = finalTotalPostingan * ratePosting;
    const t0Commission = finalSebenarnyaT0 * rateT0;
    const t3Commission = finalT3 * rateT3;
    const v0Commission = finalSebenarnyaV0 * rateV0;
    return postingCommission + t0Commission + t3Commission + v0Commission;
  }, [finalTotalPostingan, finalSebenarnyaT0, finalT3, finalSebenarnyaV0, ratePosting, rateT0, rateT3, rateV0]);

  // Final total Net Salary calculation
  const totalGajiNet = useMemo(() => {
    return gajiPokok + calculatedKomisi + bonusT0 + bonusT3 + otherBonus - deduksi;
  }, [gajiPokok, calculatedKomisi, bonusT0, bonusT3, otherBonus, deduksi]);

  // Format utility
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Recruiter selection filters
  const filteredRecruiters = useMemo(() => {
    const activeUsers = users.filter(u => u.status === 'Active');
    if (!searchQuery) return activeUsers;
    return activeUsers.filter(u => 
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Text formatting for sharing / copying to clipboard
  const shareText = useMemo(() => {
    return `📋 *SLIP GAJI AZURLIZE TEAM*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 *Tanggal (Periode):* ${activeWeek.label}
👤 *Username Recruiter:* @${activeRecruiterProfile?.username || 'no-username'}
🔑 *UID 9 Kucing:* ${activeRecruiterProfile?.akun9Kucing || '-'}
🗓️ *Hari Kerja:* ${finalHriKerja} Hari

📊 *PERFORMA REKRUTMEN*
- Total Postingan: ${finalTotalPostingan}
- Deklarasi T0: ${finalDeklarasiT0}
- Sebenarnya T0: ${finalSebenarnyaT0}
- T3: ${finalT3}
- Deklarasi V0: ${finalDeklarasiV0}
- Sebenarnya V0: ${finalSebenarnyaV0}

🌟 *PENCAPAIAN*
- Level: ${selectedLevel}
- Tingkat Penerimaan: ${tingkatPenerimaanVal}%
- Rasio Peningkatan: ${rasioPeningkatan}%

💰 *RINCIAN KEUANGAN*
- Gaji Pokok: ${formatIDR(gajiPokok)}
- Komisi: ${formatIDR(calculatedKomisi)}
- Bonus (T0): ${formatIDR(bonusT0)}
- Bonus (T3): ${formatIDR(bonusT3)}
- Other Bonus: ${formatIDR(otherBonus)}
- Deduksi: ${formatIDR(deduksi)}

💵 *TOTAL GAJI NET:* ${formatIDR(totalGajiNet)}
━━━━━━━━━━━━━━━━━━━━━━━━━━
_AzurLize Recruitment Automation System_`;
  }, [
    activeWeek,
    activeRecruiterProfile,
    finalHriKerja,
    finalTotalPostingan,
    finalDeklarasiT0,
    finalSebenarnyaT0,
    finalT3,
    finalDeklarasiV0,
    finalSebenarnyaV0,
    selectedLevel,
    tingkatPenerimaanVal,
    rasioPeningkatan,
    gajiPokok,
    calculatedKomisi,
    bonusT0,
    bonusT3,
    otherBonus,
    deduksi,
    totalGajiNet
  ]);

  const handleCopySlip = () => {
    triggerHaptic('notification', 'success');
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset override helpers
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
            Perhitungan slip komisi & upah mingguan.
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

      {/* Week Range Filter */}
      <GlassCard className="p-4 border-slate-800/80">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Pilih Periode Kerja Mingguan</span>
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {weekRanges.map((w) => {
              const isSelected = selectedWeekKey === w.key;
              return (
                <button
                  key={w.key}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedWeekKey(w.key);
                  }}
                  className={`py-2 px-2 rounded-xl text-[10px] font-bold text-center border transition-all ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="block truncate">{w.label}</span>
                  {w.isCurrentWeek && <span className="text-[7.5px] text-emerald-300 block uppercase font-black">Minggu Ini</span>}
                  {w.isPreviousWeek && <span className="text-[7.5px] text-blue-300 block uppercase font-black">Minggu Lalu</span>}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

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
              <p className="text-[9px] text-slate-500 font-medium">AzurLize Team System</p>
            </div>
            
            <button
              onClick={handleCopySlip}
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
              <span className="font-extrabold text-white truncate block">{activeWeek.label}</span>
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
                <span>{finalHriKerja} Hari</span>
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
                <span className="text-sm font-black text-white mt-1">{finalTotalPostingan}</span>
              </div>

              {/* Field 6: Deklarasi T0 */}
              <div className="bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col">
                <span className="text-[8px] font-semibold text-slate-400 uppercase">6. Deklarasi T0</span>
                <span className="text-sm font-black text-white mt-1">{finalDeklarasiT0}</span>
              </div>

              {/* Field 7: Sebenarnya T0 */}
              <div className="bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col">
                <span className="text-[8px] font-semibold text-slate-400 uppercase">7. Sebenarnya T0</span>
                <span className="text-sm font-black text-emerald-400 mt-1">{finalSebenarnyaT0}</span>
              </div>

              {/* Field 8: T3 */}
              <div className="bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col">
                <span className="text-[8px] font-semibold text-slate-400 uppercase">8. T3 (Quality)</span>
                <span className="text-sm font-black text-white mt-1">{finalT3}</span>
              </div>

              {/* Field 9: Deklarasi V0 */}
              <div className="bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col">
                <span className="text-[8px] font-semibold text-slate-400 uppercase">9. Deklarasi V0</span>
                <span className="text-sm font-black text-white mt-1">{finalDeklarasiV0}</span>
              </div>

              {/* Field 10: Sebenarnya V0 */}
              <div className="bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col">
                <span className="text-[8px] font-semibold text-slate-400 uppercase">10. Sebenarnya V0</span>
                <span className="text-sm font-black text-emerald-400 mt-1">{finalSebenarnyaV0}</span>
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
              <span className="text-xs font-black text-emerald-400 mt-0.5 block">{tingkatPenerimaanVal}%</span>
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
                <span className="font-extrabold text-emerald-400">{formatIDR(calculatedKomisi)}</span>
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
                <span className="text-xl font-black text-emerald-400">{formatIDR(totalGajiNet)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel / Override Settings Form */}
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
            <span>{showConfig ? 'Sembunyikan Pengaturan Parameter' : 'Tampilkan Pengalihan Manual & Parameter'}</span>
          </button>
          
          {(overrideHriKerja !== '' || overrideTotalPostingan !== '' || overrideDeklarasiT0 !== '' || overrideSebenarnyaT0 !== '' || overrideT3 !== '' || overrideDeklarasiV0 !== '' || overrideSebenarnyaV0 !== '') && (
            <button
              onClick={handleResetOverrides}
              className="text-[9px] font-black bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-lg uppercase"
            >
              Reset Manual
            </button>
          )}
        </div>

        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-3 border-t border-slate-900"
          >
            {/* Quick alert reminder */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-3 flex gap-2 text-[10px] text-slate-400 leading-normal">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p>
                Gaji dihitung otomatis berdasarkan data harian dengan status <span className="text-emerald-400 font-black">ACC</span>. Anda dapat memasukkan nilai manual di kolom berikut untuk mengganti perhitungan sistem.
              </p>
            </div>

            {/* Overrides form fields */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pengalihan Manual Performa:</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Hari Kerja</label>
                  <input
                    type="number"
                    value={overrideHriKerja}
                    onChange={(e) => setOverrideHriKerja(e.target.value)}
                    placeholder={`${calculatedStats.hriKerja} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Total Postingan</label>
                  <input
                    type="number"
                    value={overrideTotalPostingan}
                    onChange={(e) => setOverrideTotalPostingan(e.target.value)}
                    placeholder={`${calculatedStats.totalPostingan} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Deklarasi T0</label>
                  <input
                    type="number"
                    value={overrideDeklarasiT0}
                    onChange={(e) => setOverrideDeklarasiT0(e.target.value)}
                    placeholder={`${calculatedStats.deklarasiT0} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Sebenarnya T0</label>
                  <input
                    type="number"
                    value={overrideSebenarnyaT0}
                    onChange={(e) => setOverrideSebenarnyaT0(e.target.value)}
                    placeholder={`${calculatedStats.sebenarnyaT0} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override T3</label>
                  <input
                    type="number"
                    value={overrideT3}
                    onChange={(e) => setOverrideT3(e.target.value)}
                    placeholder={`${calculatedStats.t3} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Deklarasi V0</label>
                  <input
                    type="number"
                    value={overrideDeklarasiV0}
                    onChange={(e) => setOverrideDeklarasiV0(e.target.value)}
                    placeholder={`${calculatedStats.deklarasiV0} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override Sebenarnya V0</label>
                  <input
                    type="number"
                    value={overrideSebenarnyaV0}
                    onChange={(e) => setOverrideSebenarnyaV0(e.target.value)}
                    placeholder={`${calculatedStats.sebenarnyaV0} (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Override % Penerimaan</label>
                  <input
                    type="number"
                    value={customTingkatPenerimaan}
                    onChange={(e) => setCustomTingkatPenerimaan(e.target.value)}
                    placeholder={`${Math.round((calculatedStats.sebenarnyaT0 / (calculatedStats.deklarasiT0 || 1)) * 100)}% (Auto)`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-900">Parameter Tambahan & Level:</h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Level Recruiter</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
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

              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-900">Tarif Komisi (Konfigurasi Rate):</h4>
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
    </div>
  );
};
