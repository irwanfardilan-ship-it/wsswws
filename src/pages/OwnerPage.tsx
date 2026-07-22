import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/common/GlassCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatUsername } from '../utils/format';
import { Button } from '../components/common/Button';
import { useRecruiters } from '../hooks/useRecruiters';
import { Announcement, SystemSettings, UserRole } from '../types';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} from '../firebase/services/announcementService';
import {
  getSystemSettings,
  updateSystemSettings
} from '../firebase/services/settingService';
import { Key, Megaphone, Settings, Users, ShieldAlert, Plus, Trash2, CheckCircle2, BarChart2, Bot, Globe } from 'lucide-react';

export const OwnerPage: React.FC = () => {
  const { users, changeRole, refetch: refetchUsers } = useRecruiters();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPinned, setAnnPinned] = useState(false);
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);

  // Settings State
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [botInfo, setBotInfo] = useState<{ first_name: string; username: string } | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'announcements' | 'settings'>('users');

  const fetchBotInfo = async () => {
    try {
      const response = await fetch('/api/telegram/bot-info');
      const result = await response.json();
      if (result.success) {
        setBotInfo(result.data);
      }
    } catch (err) {
      console.error('Error fetching bot info:', err);
    }
  };

  const handleSetWebhook = async () => {
    setIsSettingWebhook(true);
    setWebhookStatus(null);
    try {
      const response = await fetch('/api/telegram/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: window.location.origin })
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        const snippet = text.substring(0, 100).replace(/</g, '&lt;');
        setWebhookStatus(`❌ Gagal: Server Vercel mengembalikan HTML/Teks (Bukan JSON).
          Status: ${response.status}
          Snippet: ${snippet}...
          Pastikan backend dideploy sebagai Serverless Function.`);
        return;
      }

      const result = await response.json();
      if (result.success) {
        setWebhookStatus('✅ Webhook Bot berhasil diaktifkan!');
      } else {
        setWebhookStatus('❌ Gagal: ' + (result.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      setWebhookStatus('❌ Gagal menghubungi server');
    } finally {
      setIsSettingWebhook(false);
    }
  };

  const loadOwnerData = async () => {
    try {
      const anns = await getAnnouncements();
      setAnnouncements(anns || []);
      const sys = await getSystemSettings();
      setSettings(sys);
      if (activeSubTab === 'settings') {
        fetchBotInfo();
      }
    } catch (err) {
      console.error('Error loading owner data:', err);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, [activeSubTab]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    setIsSubmittingAnn(true);
    try {
      await createAnnouncement(annTitle, annContent, 'Owner', annPinned);
      setAnnTitle('');
      setAnnContent('');
      setAnnPinned(false);
      await loadOwnerData();
    } catch (err) {
      alert('Gagal membuat pengumuman');
    } finally {
      setIsSubmittingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await deleteAnnouncement(id);
      await loadOwnerData();
    } catch (err) {
      alert('Gagal menghapus pengumuman');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSavingSettings(true);
    setSettingsSuccess(null);
    try {
      const updated = await updateSystemSettings(settings);
      setSettings(updated);
      setSettingsSuccess('Pengaturan sistem berhasil diperbarui!');
    } catch (err) {
      alert('Gagal memperbarui pengaturan');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRoleChange = async (telegramId: string, newRole: UserRole) => {
    try {
      await changeRole(telegramId, newRole);
      await refetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah role');
    }
  };

  // Overall Statistics
  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.status === 'Active').length;
  const pendingCount = users.filter((u) => u.status === 'Pending').length;
  const adminCount = users.filter((u) => u.role === 'Admin').length;

  return (
    <div className="space-y-5 pb-28">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Key className="w-6 h-6 text-amber-400" />
          <span>Owner Control Center</span>
        </h2>
        <p className="text-xs text-slate-400">
          Akses tingkat lanjut untuk mengelola Admin, Pengumuman, dan Sistem.
        </p>
      </div>

      {/* System Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
        <GlassCard className="p-3 border-amber-500/20">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Recruiter</span>
          <span className="text-lg font-black text-white">{totalUsers}</span>
        </GlassCard>
        <GlassCard className="p-3 border-amber-500/20">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Aktif</span>
          <span className="text-lg font-black text-emerald-400">{activeCount}</span>
        </GlassCard>
        <GlassCard className="p-3 border-amber-500/20">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Pending Approval</span>
          <span className="text-lg font-black text-amber-400">{pendingCount}</span>
        </GlassCard>
        <GlassCard className="p-3 border-amber-500/20">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Jumlah Admin</span>
          <span className="text-lg font-black text-indigo-400">{adminCount}</span>
        </GlassCard>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex-1 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'users' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Kelola Role
        </button>
        <button
          onClick={() => setActiveSubTab('announcements')}
          className={`flex-1 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'announcements' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" /> Pengumuman
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex-1 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'settings' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" /> System Setting
        </button>
      </div>

      {/* Sub Tab Content: Role Management */}
      {activeSubTab === 'users' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Daftar Pengguna & Penetapan Role Admin
          </h3>

          {users.map((u) => (
            <GlassCard key={u.telegramId} className="p-4 space-y-3 border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{u.firstName} {u.lastName}</span>
                    <StatusBadge role={u.role} size="sm" />
                  </h4>
                  <span className="text-xs text-sky-400">{formatUsername(u.username)}</span>
                </div>
                <StatusBadge status={u.status} size="sm" />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 font-medium">Ubah Role Pengguna:</span>
                <div className="flex items-center gap-1.5">
                  {(['Recruiter', 'Admin', 'Owner'] as UserRole[]).map((roleOption) => (
                    <button
                      key={roleOption}
                      disabled={u.role === roleOption}
                      onClick={() => handleRoleChange(u.telegramId, roleOption)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer ${
                        u.role === roleOption
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {roleOption}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Sub Tab Content: Announcements Management */}
      {activeSubTab === 'announcements' && (
        <div className="space-y-4">
          <GlassCard className="p-4 space-y-3 border-amber-500/20">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" /> Buat Pengumuman Baru
            </h3>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <input
                type="text"
                placeholder="Judul Pengumuman"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                required
              />

              <textarea
                rows={3}
                placeholder="Isi Pengumuman Resmi..."
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                required
              />

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={annPinned}
                  onChange={(e) => setAnnPinned(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500"
                />
                <span className="text-xs text-slate-300 font-medium">Pin pengumuman di paling atas</span>
              </label>

              <Button type="submit" fullWidth isLoading={isSubmittingAnn}>
                Publikasikan Pengumuman
              </Button>
            </form>
          </GlassCard>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Daftar Pengumuman Aktif
            </h4>
            {announcements.map((a) => (
              <GlassCard key={a.id} className="p-4 space-y-2 border-slate-800">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold text-white">{a.title}</h5>
                  <button
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-line">{a.content}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Sub Tab Content: System Settings */}
      {activeSubTab === 'settings' && settings && (
        <GlassCard className="p-5 space-y-4 border-amber-500/20">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" /> Konfigurasi Sistem AzurLizeTeam
          </h3>

          {settingsSuccess && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Status Operasional Sistem</span>
                <span className="text-[11px] text-slate-400">Pilih status operasional portal rekrutmen</span>
              </div>
              <select
                value={settings.systemStatus}
                onChange={(e) => setSettings({ ...settings, systemStatus: e.target.value as 'Operational' | 'Maintenance' })}
                className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 outline-none"
              >
                <option value="Operational">Operational</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Izinkan Pendaftaran Recruiter Baru</span>
                <span className="text-[11px] text-slate-400">Buka / tutup pendaftaran recruiter baru</span>
              </div>
              <input
                type="checkbox"
                checked={settings.allowRegistrations}
                onChange={(e) => setSettings({ ...settings, allowRegistrations: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1.5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <label className="text-xs font-bold text-white">Header Banner Pengumuman Dashboard</label>
              <textarea
                rows={2}
                value={settings.announcementHeader}
                onChange={(e) => setSettings({ ...settings, announcementHeader: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1.5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <label className="text-xs font-bold text-white">Telegram Group ID (Tujuan Notifikasi)</label>
              <input
                type="text"
                placeholder="Contoh: -100123456789"
                value={settings.telegramGroupId || ''}
                onChange={(e) => setSettings({ ...settings, telegramGroupId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1.5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <label className="text-xs font-bold text-white">Topic ID Grup T0 (Tujuan Notifikasi)</label>
              <input
                type="text"
                placeholder="Contoh: 123"
                value={settings.telegramTopicT0 || ''}
                onChange={(e) => setSettings({ ...settings, telegramTopicT0: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1.5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <label className="text-xs font-bold text-white">Topic ID Grup V0 (Tujuan Notifikasi)</label>
              <input
                type="text"
                placeholder="Contoh: 124"
                value={settings.telegramTopicV0 || ''}
                onChange={(e) => setSettings({ ...settings, telegramTopicV0: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1.5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <label className="text-xs font-bold text-white">Topic ID Grup T3 (Tujuan Notifikasi)</label>
              <input
                type="text"
                placeholder="Contoh: 125"
                value={settings.telegramTopicT3 || ''}
                onChange={(e) => setSettings({ ...settings, telegramTopicT3: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1.5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <label className="text-xs font-bold text-white">Topic ID Posting (Album/Gambar)</label>
              <input
                type="text"
                placeholder="Contoh: 126"
                value={settings.telegramTopicPosting || ''}
                onChange={(e) => setSettings({ ...settings, telegramTopicPosting: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <Button fullWidth isLoading={isSavingSettings} onClick={handleSaveSettings}>
              Simpan Pengaturan
            </Button>
          </div>

          {/* Webhook Configuration */}
          <div className="mt-8 pt-6 border-t border-slate-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-tighter">Konfigurasi Bot Webhook</h4>
              </div>
              {botInfo && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] font-bold text-emerald-400">{botInfo.first_name}</span>
                  <span className="text-[9px] text-slate-500">@{botInfo.username}</span>
                </div>
              )}
            </div>
            
            <GlassCard className="p-4 bg-slate-950/50 border-slate-800 space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Aktifkan Webhook agar Bot dapat merespon perintah <code>/id</code> atau <code>/info</code> langsung di grup Telegram untuk mendapatkan ID Chat/Topic secara otomatis.
              </p>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Webhook URL saat ini:</span>
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] text-slate-300 font-mono truncate">{window.location.origin}/api/telegram/webhook</span>
                </div>
              </div>

              {webhookStatus && (
                <div className={`text-[10px] font-bold p-2 rounded-lg ${webhookStatus.includes('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {webhookStatus}
                </div>
              )}

              <Button 
                variant="secondary" 
                fullWidth 
                onClick={handleSetWebhook}
                isLoading={isSettingWebhook}
              >
                Aktifkan Webhook Bot
              </Button>
              
              <p className="text-[9px] text-slate-500 italic text-center">
                *Hanya bot yang dikonfigurasi di server yang akan merespon.
              </p>
            </GlassCard>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
