import React from 'react';
import { LayoutGrid, CalendarClock, ClipboardPen, Clock3, UserCheck, ShieldCheck, Crown } from 'lucide-react';
import { triggerHaptic } from '../../telegram/webapp';
import { useAuth } from '../../hooks/useAuth';

export type TabType = 'beranda' | 'postingan' | 'laporan' | 'data_harian' | 'riwayat' | 'profil' | 'admin' | 'owner' | 'pengumuman';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { userProfile } = useAuth();

  const handleTabClick = (tab: TabType) => {
    if (tab !== activeTab) {
      triggerHaptic('selection');
      setActiveTab(tab);
    }
  };

  const navItems = [
    { id: 'beranda' as TabType, label: 'Beranda', icon: LayoutGrid },
    { id: 'postingan' as TabType, label: 'Postingan', icon: ClipboardPen },
    { id: 'data_harian' as TabType, label: 'Data Harian', icon: CalendarClock },
    { id: 'laporan' as TabType, label: 'Laporan', icon: ClipboardPen },
    { id: 'riwayat' as TabType, label: 'Riwayat', icon: Clock3 },
    { id: 'profil' as TabType, label: 'Profil', icon: UserCheck }
  ];

  if (userProfile?.role === 'Admin') {
    navItems.splice(3, 0, { id: 'admin' as TabType, label: 'Admin', icon: ShieldCheck });
  } else if (userProfile?.role === 'Owner') {
    navItems.splice(3, 0, { id: 'owner' as TabType, label: 'Owner', icon: Crown });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 md:px-6 pb-safe mb-3 pointer-events-none">
      <nav 
        style={{
          backgroundColor: 'var(--tg-secondary-bg-color, var(--tg-bg-color, rgba(15, 23, 42, 0.95)))'
        }}
        className="w-full max-w-3xl mx-auto pointer-events-auto backdrop-blur-2xl border border-slate-200 dark:border-white/15 rounded-3xl p-1.5 md:p-2 shadow-2xl flex items-center justify-around shadow-sky-500/10 transition-colors duration-300"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 md:px-5 rounded-2xl transition-all duration-300 relative ${
                isActive
                  ? 'text-sky-500 dark:text-sky-400 font-bold bg-gradient-to-b from-sky-500/20 to-blue-600/10 border border-sky-500/30 shadow-lg shadow-sky-500/15'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-sky-400/20 blur-sm -z-10 animate-pulse" />
                )}
                <Icon className={`w-5 h-5 md:w-5.5 md:h-5.5 transition-all duration-300 ${isActive ? 'scale-110 text-sky-500 dark:text-sky-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]' : 'scale-100'}`} />
              </div>

              <span className={`text-[10px] md:text-xs tracking-tight mt-1 font-bold ${isActive ? 'text-sky-500 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}`}>
                {item.label}
              </span>

              {isActive && (
                <span className="absolute -bottom-1 w-6 md:w-8 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 rounded-full shadow-md shadow-sky-400/80" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

};
