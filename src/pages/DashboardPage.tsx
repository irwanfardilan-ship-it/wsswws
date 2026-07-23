import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../components/common/GlassCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { TabType } from '../components/navigation/BottomNav';
import { useAuth } from '../hooks/useAuth';
import { useReports } from '../hooks/useReports';
import { formatUsername, formatWIBDate } from '../utils/format';
import { Announcement } from '../types';
import { subscribeToAnnouncements } from '../firebase/services/announcementService';
import { subscribeToSystemSettings } from '../firebase/services/settingService';
import { 
  ClipboardPen, 
  CalendarClock,
  Clock3, 
  BellRing, 
  BarChart2, 
  UserCheck, 
  ShieldCheck, 
  Crown, 
  ChevronRight, 
  Megaphone, 
  Users, 
  Sparkles, 
  TrendingUp 
} from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: TabType) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const { userProfile, telegramUser } = useAuth();
  const { reports } = useReports();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementHeader, setAnnouncementHeader] = useState<string>('');

  useEffect(() => {
    const unsubAnn = subscribeToAnnouncements((anns) => {
      setAnnouncements(anns || []);
    });

    const unsubSettings = subscribeToSystemSettings((sysSettings) => {
      if (sysSettings?.announcementHeader) {
        setAnnouncementHeader(sysSettings.announcementHeader);
      }
    });

    return () => {
      unsubAnn();
      unsubSettings();
    };
  }, []);

  // Calculate my stats - only from approved (ACC) reports
  const approvedReports = reports.filter(curr => curr.result === 'ACC');
  const totalVisits = approvedReports.reduce((acc, curr) => acc + (curr.visit || 0), 0);
  const totalApplicants = approvedReports.reduce((acc, curr) => acc + (curr.applicant || 0), 0);
  const totalQuality = approvedReports.reduce((acc, curr) => acc + (curr.quality || 0), 0);
  const totalPostings = approvedReports.reduce((acc, curr) => acc + (curr.posting || 0), 0);

  const quickMenus = [
    {
      id: 'data_harian' as TabType,
      title: 'Data Harian',
      desc: 'Siklus data harian baru',
      icon: CalendarClock,
      color: 'from-emerald-400 via-teal-500 to-sky-600',
      glow: 'shadow-emerald-500/20 hover:shadow-emerald-500/40',
      badge: 'Harian'
    },
    {
      id: 'laporan' as TabType,
      title: 'Form Laporan',
      desc: 'Isi & kirim laporan',
      icon: ClipboardPen,
      color: 'from-sky-400 via-blue-500 to-indigo-600',
      glow: 'shadow-sky-500/20 hover:shadow-sky-500/40',
      badge: 'Utama'
    },
    {
      id: 'riwayat' as TabType,
      title: 'Riwayat Laporan',
      desc: 'Arsip & histori kinerja',
      icon: Clock3,
      color: 'from-blue-500 via-indigo-500 to-purple-600',
      glow: 'shadow-indigo-500/20 hover:shadow-indigo-500/40',
      badge: `${reports.length} Data`
    },
    {
      id: 'pengumuman' as TabType,
      title: 'Pengumuman',
      desc: 'Instruksi resmi tim',
      icon: BellRing,
      color: 'from-amber-400 via-orange-500 to-rose-500',
      glow: 'shadow-orange-500/20 hover:shadow-orange-500/40',
      badge: announcements.length ? `${announcements.length} Baru` : undefined
    },
    {
      id: 'profil' as TabType,
      title: 'Profil Saya',
      desc: 'Identitas & status akun',
      icon: UserCheck,
      color: 'from-emerald-400 via-teal-500 to-cyan-600',
      glow: 'shadow-emerald-500/20 hover:shadow-emerald-500/40',
      badge: undefined
    }
  ];

  if (userProfile?.role === 'Admin') {
    quickMenus.push({
      id: 'admin' as TabType,
      title: 'Admin Panel',
      desc: 'Persetujuan recruiter',
      icon: ShieldCheck,
      color: 'from-purple-500 via-violet-600 to-indigo-600',
      glow: 'shadow-purple-500/20 hover:shadow-purple-500/40',
      badge: 'Management'
    });
  } else if (userProfile?.role === 'Owner') {
    quickMenus.push({
      id: 'owner' as TabType,
      title: 'Owner Panel',
      desc: 'Akses penuh & sistem',
      icon: Crown,
      color: 'from-rose-500 via-pink-600 to-purple-600',
      glow: 'shadow-rose-500/20 hover:shadow-rose-500/40',
      badge: 'System Admin'
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 pb-24"
    >
      {/* Welcome User Banner */}
      <GlassCard className="relative overflow-hidden border-sky-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-blue-950/60 p-5 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="relative shrink-0">
            {telegramUser?.photo_url ? (
              <img
                src={telegramUser.photo_url}
                alt="Profile"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-400/50 shadow-xl shadow-sky-500/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-sky-500/20 border border-white/20">
                {(userProfile?.firstName?.[0] || telegramUser?.first_name?.[0] || 'A').toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-md" />
          </div>

          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Selamat Datang 👋
            </div>
            <h2 className="text-lg font-black text-white truncate tracking-tight mt-0.5">
              {userProfile?.firstName} {userProfile?.lastName}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {formatUsername(userProfile?.username || telegramUser?.username)}
            </span>

            <div className="flex items-center gap-2 mt-2">
              {userProfile?.role && <StatusBadge role={userProfile.role} size="sm" />}
              {userProfile?.status && <StatusBadge status={userProfile.status} size="sm" />}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* System Announcement Banner */}
      {announcementHeader && (
        <GlassCard className="bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-slate-900/90 p-4 border-blue-500/30 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 shrink-0 border border-blue-500/30">
            <Megaphone className="w-5 h-5 animate-pulse" />
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {announcementHeader}
          </p>
        </GlassCard>
      )}

      {/* Quick Menu Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Menu Utama Recruiter</span>
          </h3>
          <span className="text-[10px] text-sky-400/80 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
            AzurLize System
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {quickMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <GlassCard
                key={menu.id}
                hoverable
                onClick={() => setActiveTab(menu.id)}
                className="p-4 space-y-3 flex flex-col justify-between group border-white/10 hover:border-sky-500/50 relative overflow-hidden transition-all duration-300 shadow-xl"
              >
                {/* Background ambient glow effect on hover */}
                <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${menu.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 pointer-events-none`} />

                <div className="flex items-center justify-between relative z-10">
                  <div className="relative">
                    {/* Glowing halo ring */}
                    <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r ${menu.color} opacity-40 group-hover:opacity-100 blur transition duration-300`} />
                    
                    <div className={`w-12 h-12 rounded-2xl bg-slate-950/90 flex items-center justify-center text-white relative border border-white/20 shadow-xl group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${menu.color} flex items-center justify-center text-white shadow-md`}>
                        <Icon className="w-5 h-5 drop-shadow-md text-white" />
                      </div>
                    </div>
                  </div>

                  {menu.badge && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/90 text-sky-400 border border-sky-500/30 shadow-md backdrop-blur-md">
                      {menu.badge}
                    </span>
                  )}
                </div>

                <div className="relative z-10 pt-1">
                  <h4 className="text-sm font-black text-white group-hover:text-sky-300 transition-colors flex items-center justify-between">
                    <span>{menu.title}</span>
                    <div className="p-1 rounded-lg bg-white/5 group-hover:bg-sky-500/20 group-hover:text-sky-300 transition-all">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-300 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5 line-clamp-1">{menu.desc}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* My Stats Summary Card */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          Ringkasan Performa Saya
        </h3>

        <GlassCard className="p-4 space-y-4 border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400">
                <BarChart2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Metrik Akumulasi Laporan
              </span>
            </div>
            <span className="text-[10px] text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full font-semibold border border-slate-700/60 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> {approvedReports.length} Laporan ACC
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Kunjungan</span>
              <span className="text-xl font-black text-blue-400 mt-0.5 block">{totalVisits}</span>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Pelamar</span>
              <span className="text-xl font-black text-sky-400 mt-0.5 block">{totalApplicants}</span>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Berkualitas</span>
              <span className="text-xl font-black text-emerald-400 mt-0.5 block">{totalQuality}</span>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Postingan</span>
              <span className="text-xl font-black text-indigo-400 mt-0.5 block">{totalPostings}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Announcements Stream */}
      {announcements.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Pengumuman Terbaru
            </h3>
            <button
              onClick={() => setActiveTab('pengumuman')}
              className="text-xs text-sky-400 font-bold hover:underline"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {announcements.slice(0, 2).map((ann) => (
              <GlassCard key={ann.id} className="p-4 space-y-1.5 border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400">{ann.title}</span>
                  {ann.pinned && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                      📌 Pinned
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {ann.content}
                </p>
                <span className="text-[10px] text-slate-500 block pt-1">
                  Oleh: {ann.author} &bull; {formatWIBDate(ann.createdAt)}
                </span>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

