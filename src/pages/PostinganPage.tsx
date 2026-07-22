import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/common/GlassCard';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useReports } from '../hooks/useReports';
import { triggerHaptic } from '../telegram/webapp';
import { getSystemSettings } from '../firebase/services/settingService';
import { createPost, subscribeToRecruiterPosts, getRecruiterPosts, archiveOldPosts } from '../firebase/services/postService';
import { SystemSettings, BatchPost } from '../types';
import { getWIBDate } from '../utils/format';
import { 
  Image as ImageIcon, 
  X, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  Plus,
  Link as LinkIcon,
  Globe,
  Hash,
  History,
  Archive,
  ChevronRight,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  Timer,
  ShieldCheck,
  AlertTriangle,
  Target
} from 'lucide-react';

type SocialPlatform = 'Facebook' | 'X (Twitter)' | 'Instagram' | 'TikTok' | 'Threads' | 'WhatsApp' | 'Telegram' | 'Lainnya';

interface SocialLink {
  url: string;
  platform: SocialPlatform;
}

// Channel Platform Real SVG Icons (Aligned with DataHarianPage)
const ChannelPlatformIcon: React.FC<{ id: string; className?: string }> = ({ id, className = "w-3.5 h-3.5 shrink-0" }) => {
  switch (id) {
    case 'Facebook':
      return (
        <svg className={`${className} fill-current`} viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'X (Twitter)':
      return (
        <svg className={`${className} fill-current`} viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'Threads':
      return (
        <svg className={`${className} fill-current`} viewBox="0 0 24 24">
          <path d="M12.186 24c-3.142 0-5.782-1.002-7.587-2.87-1.848-1.91-2.599-4.57-2.599-7.728 0-3.322.95-6.07 2.825-8.17C6.632 3.123 9.29 2 12.723 2c3.488 0 6.208 1.14 8.084 3.388 1.583 1.897 2.392 4.417 2.392 7.488 0 .61-.03 1.256-.09 1.933h-3.411c.045-.487.068-.962.068-1.428 0-2.22-.57-3.992-1.693-5.27-1.196-1.36-2.937-2.05-5.183-2.05-2.298 0-4.093.758-5.337 2.252-1.22 1.466-1.838 3.513-1.838 6.084 0 2.327.534 4.254 1.587 5.727 1.055 1.475 2.585 2.223 4.548 2.223 1.623 0 2.946-.43 3.931-1.28.932-.803 1.488-1.922 1.654-3.328h-5.26v-3.072h8.777c.074.526.111 1.077.111 1.652 0 2.457-.833 4.475-2.477 6.002C18.667 23.23 15.808 24 12.186 24z" />
        </svg>
      );
    case 'Instagram':
      return (
        <svg className={`${className} fill-current`} viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case 'TikTok':
      return (
        <svg className={`${className} fill-current`} viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.31 1.54-1.33 2.54-.02 1.08.46 2.15 1.28 2.84 1.01.83 2.47.98 3.63.4 1.03-.51 1.69-1.57 1.78-2.72.08-2.71.04-5.43.05-8.15-.01-2.9-.01-5.8 0-8.7z" />
        </svg>
      );
    case 'Telegram':
      return (
        <svg className={`${className} fill-current`} viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.37-3.61 3.99-1.66 4.82-1.95 5.36-1.96.12 0 .38.03.55.17.14.12.18.28.2.45-.01.07.01.23 0 .39z" />
        </svg>
      );
    case 'WhatsApp':
      return (
        <svg className={`${className} fill-current`} viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      );
    default:
      return <Globe className={`${className}`} />;
  }
};

const CHANNELS = [
  { id: 'Facebook', label: 'Facebook', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5', active: 'bg-blue-600 text-white border-blue-500' },
  { id: 'X (Twitter)', label: 'X (Twitter)', color: 'text-slate-200 border-slate-700 bg-slate-800/20', active: 'bg-slate-200 text-slate-900 border-white' },
  { id: 'Threads', label: 'Threads', color: 'text-white border-zinc-700 bg-zinc-800/20', active: 'bg-white text-zinc-950 border-white' },
  { id: 'Instagram', label: 'Instagram', color: 'text-pink-400 border-pink-500/20 bg-pink-500/5', active: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent' },
  { id: 'TikTok', label: 'TikTok', color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5', active: 'bg-cyan-500 text-slate-950 border-cyan-400' },
  { id: 'WhatsApp', label: 'WhatsApp', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', active: 'bg-emerald-600 text-white border-emerald-500' },
  { id: 'Telegram', label: 'Telegram', color: 'text-sky-400 border-sky-400/20 bg-sky-400/5', active: 'bg-sky-500 text-white border-sky-400' },
  { id: 'Lainnya', label: 'Lainnya', color: 'text-slate-400 border-slate-700 bg-slate-800/20', active: 'bg-slate-700 text-white border-slate-600' },
];

export const PostinganPage: React.FC = () => {
  const { userProfile, telegramUser } = useAuth();
  const { reports } = useReports();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [isReviewingLinks, setIsReviewingLinks] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [startNumber, setStartNumber] = useState<number>(1);
  const [hasUserEditedStartNumber, setHasUserEditedStartNumber] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View State & Post Count
  const [activeView, setActiveView] = useState<'buat' | 'hari_ini' | 'arsip'>('buat');
  const [posts, setPosts] = useState<BatchPost[]>([]);
  const [todayPostingsCount, setTodayPostingsCount] = useState<number>(0);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Effective Telegram ID (resilient to page reload before userProfile finishes loading)
  const effectiveTelegramId = userProfile?.telegramId || (telegramUser?.id ? String(telegramUser.id) : '');

  // Calculate recruits recorded in Data Harian today for this recruiter
  const todayRecruits = useMemo(() => {
    const today = getWIBDate();
    const normalizeDate = (d: string) => {
      if (!d) return '';
      const parts = d.split('-');
      if (parts.length !== 3) return d;
      if (parts[0].length === 2) return parts.reverse().join('-');
      return d;
    };
    const normalizedToday = normalizeDate(today);

    const todayReports = reports.filter((r) => {
      return r.telegramId === effectiveTelegramId && normalizeDate(r.date || '') === normalizedToday;
    });

    if (todayReports.length === 0) return 0;

    return todayReports.reduce((sum, r) => {
      const val = r.applicant !== undefined && r.applicant !== null ? Number(r.applicant) : 1;
      return sum + (isNaN(val) ? 1 : val);
    }, 0);
  }, [reports, effectiveTelegramId]);

  // Target posting rule calculation based on requirements:
  // Target 3+ rekrutan/hari -> Posting: Bebas
  // Target 2 rekrutan/hari  -> Posting: 30 postingan
  // Target 1 rekrutan/hari  -> Posting: 60 postingan
  // Target 0 rekrutan/hari  -> Posting: 90 postingan
  const targetRule = useMemo(() => {
    if (todayRecruits >= 3) {
      return {
        required: 0,
        label: 'Bebas Posting',
        badge: 'Bebas Posting 🎉',
        color: 'from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-500/40',
        iconColor: 'text-emerald-400',
        isFree: true,
        tierName: '3+ Rekrutan',
        description: 'Selamat! Dengan 3+ rekrutan dari Data Harian, Anda bebas posting (tanpa batas minimal).'
      };
    } else if (todayRecruits === 2) {
      return {
        required: 30,
        label: '30 Postingan',
        badge: 'Target: 30 Posting',
        color: 'from-sky-500/20 to-blue-500/10 text-sky-300 border-sky-500/40',
        iconColor: 'text-sky-400',
        isFree: false,
        tierName: '2 Rekrutan',
        description: 'Dengan 2 rekrutan dari Data Harian, target posting Anda adalah 30 postingan.'
      };
    } else if (todayRecruits === 1) {
      return {
        required: 60,
        label: '60 Postingan',
        badge: 'Target: 60 Posting',
        color: 'from-amber-500/20 to-orange-500/10 text-amber-300 border-amber-500/40',
        iconColor: 'text-amber-400',
        isFree: false,
        tierName: '1 Rekrutan',
        description: 'Dengan 1 rekrutan dari Data Harian, target posting Anda adalah 60 postingan.'
      };
    } else {
      return {
        required: 90,
        label: '90 Postingan',
        badge: 'Target: 90 Posting',
        color: 'from-rose-500/20 to-pink-500/10 text-rose-300 border-rose-500/40',
        iconColor: 'text-rose-400',
        isFree: false,
        tierName: '0 Rekrutan',
        description: 'Dengan 0 rekrutan dari Data Harian, target posting Anda adalah 90 postingan.'
      };
    }
  }, [todayRecruits]);

  // Live countdown to midnight (00:00)
  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(0);
  const [elapsedPercent, setElapsedPercent] = useState<number>(100);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      
      // Get Jakarta parts
      const partsArr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour12: false
      }).formatToParts(now);

      const parts: Record<string, number> = {};
      partsArr.forEach(({type, value}) => {
        if (type !== 'literal') parts[type] = parseInt(value);
      });

      // We create "local" dates using Jakarta values to get a relative difference
      // This works because both dates share the same local offset
      const jakartaTime = new Date(2000, 0, 1, parts.hour, parts.minute, parts.second);
      const midnightTime = new Date(2000, 0, 1, 23, 59, 59, 999);
      
      const diff = midnightTime.getTime() - jakartaTime.getTime();
      const totalDayMs = 24 * 60 * 60 * 1000;
      const elapsedMs = (parts.hour * 3600 + parts.minute * 60 + parts.second) * 1000;
      const pct = Math.min(100, Math.max(0, (elapsedMs / totalDayMs) * 100));

      setTimeRemainingMs(Math.max(0, diff));
      setElapsedPercent(pct);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
    if (ms <= 0) return { hours: '00', minutes: '00', seconds: '00' };
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0')
    };
  };

  const { hours, minutes, seconds } = formatTime(timeRemainingMs);

  useEffect(() => {
    const init = async () => {
      const s = await getSystemSettings();
      setSettings(s);
      await archiveOldPosts(); // Auto archive old posts on mount

      if (activeView === 'hari_ini') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    init();
  }, []);

  // Real-time listener for posts & automatic next startNumber calculation
  useEffect(() => {
    if (!effectiveTelegramId) return;

    setIsLoadingHistory(true);
    const unsubscribe = subscribeToRecruiterPosts(
      effectiveTelegramId,
      (fetchedPosts) => {
        const normalizeDate = (d: string) => {
          if (!d) return '';
          const parts = d.split('-');
          if (parts.length !== 3) return d;
          if (parts[0].length === 2) return parts.reverse().join('-');
          return d;
        };

        const today = getWIBDate();
        const normalizedToday = normalizeDate(today);

        // Calculate next startNumber and total posting links count today
        const todayPosts = fetchedPosts.filter(p => normalizeDate(p.date || '') === normalizedToday && !p.archived);

        const totalLinksToday = todayPosts.reduce((acc, post) => {
          const linkCount = Array.isArray(post.links) ? post.links.length : 0;
          return acc + linkCount;
        }, 0);
        setTodayPostingsCount(totalLinksToday);

        if (!hasUserEditedStartNumber) {
          if (todayPosts.length > 0) {
            let maxNextNum = 1;
            for (const post of todayPosts) {
              const pStart = Number(post.startNumber) || 1;
              const linkCount = Array.isArray(post.links) ? post.links.length : 0;
              const pEnd = pStart + linkCount;
              if (pEnd > maxNextNum) {
                maxNextNum = pEnd;
              }
            }
            setStartNumber(maxNextNum);
          } else {
            setStartNumber(1);
          }
        }

        // Filter based on active view for tab display
        const filtered = fetchedPosts.filter(p => {
          const pDate = normalizeDate(p.date || '');
          const isToday = pDate === normalizedToday;

          if (activeView === 'hari_ini') {
            return isToday && !p.archived;
          } else if (activeView === 'arsip') {
            return (!isToday) || p.archived;
          }
          return false;
        });

        setPosts(filtered);
        setIsLoadingHistory(false);
        setHasMore(false);
      },
      100
    );

    return () => unsubscribe();
  }, [effectiveTelegramId, activeView, hasUserEditedStartNumber]);

  const fetchHistory = async (reset: boolean = false) => {
    // Legacy fetch logic replaced by onSnapshot
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 10 - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      if (images.length >= 10) {
        alert('Maksimal 10 gambar diperbolehkan.');
      }
      return;
    }

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string].slice(0, 10));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    triggerHaptic('impact', 'light');
  };

  const updateLink = (index: number, url: string) => {
    const newLinks = [...links];
    let platform = newLinks[index].platform;
    
    const lowUrl = url.toLowerCase();
    if (lowUrl.includes('facebook.com') || lowUrl.includes('fb.com') || lowUrl.includes('fb.watch')) {
      platform = 'Facebook';
    } else if (lowUrl.includes('x.com') || lowUrl.includes('twitter.com')) {
      platform = 'X (Twitter)';
    } else if (lowUrl.includes('instagram.com') || lowUrl.includes('instagr.am')) {
      platform = 'Instagram';
    } else if (lowUrl.includes('tiktok.com')) {
      platform = 'TikTok';
    } else if (lowUrl.includes('threads.net')) {
      platform = 'Threads';
    } else if (lowUrl.includes('wa.me') || lowUrl.includes('whatsapp.com')) {
      platform = 'WhatsApp';
    } else if (lowUrl.includes('t.me') || lowUrl.includes('telegram.me')) {
      platform = 'Telegram';
    }
    
    newLinks[index] = { url, platform };
    setLinks(newLinks);
  };

  const updatePlatform = (index: number, platform: SocialPlatform) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], platform };
    setLinks(newLinks);
    triggerHaptic('selection');
  };

  const compressImage = (base64: string, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Target resolution for Telegram
        let width = img.width;
        let height = img.height;
        const maxDim = 1280;
        
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleSubmit = async () => {
    const validLinks = links.filter(l => l.url.trim() !== '');
    if (validLinks.length === 0) {
      setStatus({ type: 'error', message: 'Minimal masukkan 1 link postingan.' });
      return;
    }

    if (images.length === 0) {
      setStatus({ type: 'error', message: 'Setidaknya upload 1 gambar.' });
      return;
    }

    // Duplicate Check
    const normalizeDate = (d: string) => {
      if (!d) return '';
      const parts = d.split('-');
      if (parts.length !== 3) return d;
      if (parts[0].length === 2) return parts.reverse().join('-');
      return d;
    };
    const today = getWIBDate();
    const normalizedToday = normalizeDate(today);
    const todayPosts = posts.filter(p => normalizeDate(p.date || '') === normalizedToday);
    const existingLinks = new Set(todayPosts.flatMap(p => p.links));
    
    const duplicates = validLinks.filter(l => existingLinks.has(l.url));
    if (duplicates.length > 0) {
      setStatus({ 
        type: 'error', 
        message: `Terdapat ${duplicates.length} link yang sudah pernah dikirim hari ini. Mohon hapus duplikasi.` 
      });
      triggerHaptic('notification', 'error');
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'idle' });
    triggerHaptic('impact', 'medium');

    try {
      const recruiterName = userProfile ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() : `${telegramUser?.first_name || ''} ${telegramUser?.last_name || ''}`.trim() || 'Recruiter';
      const recruiterUsername = userProfile?.username || telegramUser?.username || '';
      const recruiterTelegramId = effectiveTelegramId;
      
      // Compress all images
      setStatus({ type: 'idle', message: 'Sedang mengompres gambar...' });
      const compressedImages = await Promise.all(images.map(img => compressImage(img)));
      
      const response = await fetch('/api/telegram/send-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: validLinks.map(l => l.url),
          startNumber,
          images: compressedImages,
          recruiterName,
          recruiterUsername,
          groupId: settings?.telegramGroupId,
          topicId: settings?.telegramTopicPosting
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from server:', text);
        
        if (response.status === 413) {
          throw new Error('Ukuran data terlalu besar (Maksimal 4.5MB). Coba kurangi jumlah gambar atau gunakan gambar dengan ukuran lebih kecil.');
        }
        
        throw new Error(`Server error (${response.status}). Mohon coba lagi nanti.`);
      }

      const result = await response.json();
      if (result.success) {
        const newPostData = {
          telegramId: recruiterTelegramId,
          username: recruiterUsername,
          name: recruiterName,
          date: getWIBDate(),
          startNumber,
          links: validLinks.map(l => l.url),
          platforms: validLinks.map(l => l.platform)
        };

        await createPost(newPostData);

        setStatus({ type: 'success', message: 'Batch Berhasil Dikirim!' });
        
        setLinks([]);
        setBulkText('');
        setIsReviewingLinks(false);
        setIsConfirmed(false);
        setImages([]);
        setHasUserEditedStartNumber(false);
        setStartNumber(prev => prev + validLinks.length);
        triggerHaptic('notification', 'success');
        
        // Switch view to Today's Posts automatically
        setActiveView('hari_ini');
      } else {
        throw new Error(result.error || 'Gagal mengirim postingan');
      }
    } catch (err) {
      console.error('[Postingan] Error submitting:', err);
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Gagal mengirim postingan.' });
      triggerHaptic('notification', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4">
        {/* Live Timer Section */}
        <GlassCard className="p-4 border-amber-500/20 bg-amber-500/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Sparkles className="w-12 h-12 text-amber-500" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 animate-pulse" />
                Batas Waktu Harian
              </span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-2xl font-black text-white tracking-tighter">{hours}</span>
                <span className="text-lg font-black text-amber-500/50">:</span>
                <span className="text-2xl font-black text-white tracking-tighter">{minutes}</span>
                <span className="text-lg font-black text-amber-500/50">:</span>
                <span className="text-2xl font-black text-white tracking-tighter">{seconds}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Status Progres</div>
              <div className="w-24 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${elapsedPercent}%` }}
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                />
              </div>
              <span className="text-[8px] font-bold text-amber-400 mt-1 block">
                {Math.round(elapsedPercent)}% Hari Berjalan
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Header Section */}
        <div className="px-1 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-sky-400" />
              Batch Postingan
            </h1>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => { setActiveView('buat'); triggerHaptic('selection'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
              activeView === 'buat' 
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-lg' 
                : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Buat
          </button>
          <button
            onClick={() => { setActiveView('hari_ini'); triggerHaptic('selection'); }}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeView === 'hari_ini' 
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-lg' 
                : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 text-[10px] font-black uppercase">
              <Calendar className="w-3.5 h-3.5" />
              Hari Ini
            </div>
            <span className="text-[7px] font-bold opacity-60">
              {getWIBDate().split('-').reverse().join('-')}
            </span>
          </button>
          <button
            onClick={() => { setActiveView('arsip'); triggerHaptic('selection'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
              activeView === 'arsip' 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg' 
                : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Arsip
          </button>
        </div>

        {activeView === 'buat' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Syarat Target Postingan Harian (Berpatokan Data Harian) */}
            <GlassCard className="p-4 space-y-3.5 bg-slate-950/80 border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${targetRule.color} flex items-center justify-center shrink-0 border shadow-inner`}>
                    <Target className={`w-4 h-4 ${targetRule.iconColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-white tracking-tight">Target Postingan Harian</h3>
                      <span className="text-[8px] font-black uppercase text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Data Harian Sync
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">
                      {targetRule.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Realtime Status Banner */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center">
                  <p className="text-[8px] font-black uppercase text-slate-500">Rekrutan Hari Ini</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">{todayRecruits} Orang</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center">
                  <p className="text-[8px] font-black uppercase text-slate-500">Target Posting</p>
                  <p className={`text-sm font-black mt-0.5 ${targetRule.isFree ? 'text-emerald-300' : 'text-sky-400'}`}>
                    {targetRule.label}
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-center">
                  <p className="text-[8px] font-black uppercase text-slate-500">Telah Diposting</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    {todayPostingsCount} {targetRule.isFree ? '' : `/ ${targetRule.required}`}
                  </p>
                </div>
              </div>

              {/* Progress Bar or Free Badge */}
              {!targetRule.isFree ? (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-400">Progres Target Hari Ini</span>
                    <span className={todayPostingsCount >= targetRule.required ? 'text-emerald-400 font-black' : 'text-amber-400 font-black'}>
                      {todayPostingsCount >= targetRule.required 
                        ? '✅ Target Postingan Selesai' 
                        : `Kurang ${targetRule.required - todayPostingsCount} postingan lagi`}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.round((todayPostingsCount / targetRule.required) * 100))}%` }}
                      className={`h-full rounded-full ${
                        todayPostingsCount >= targetRule.required 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                          : 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Bebas jumlah posting karena rekrutan hari ini sudah ≥ 3!
                  </span>
                  <span className="text-[9px] uppercase font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Selesai 🎉
                  </span>
                </div>
              )}

              {/* Syarat Rule Matrix Grid */}
              <div className="pt-1.5 border-t border-slate-800/60">
                <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider mb-2">
                  Ketentuan Target Postingan Harian:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className={`p-2 rounded-xl border transition-all text-center ${
                    todayRecruits === 0
                      ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-md shadow-rose-500/10'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                  }`}>
                    <p className="text-[8px] font-black uppercase text-slate-400">0 Rekrutan</p>
                    <p className="text-xs font-black text-rose-400 mt-0.5">90 Posting</p>
                    {todayRecruits === 0 && (
                      <span className="inline-block text-[7px] font-black uppercase bg-rose-500/20 text-rose-300 px-1.5 py-0.5 mt-1 rounded">Aktif Saat Ini</span>
                    )}
                  </div>

                  <div className={`p-2 rounded-xl border transition-all text-center ${
                    todayRecruits === 1
                      ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                  }`}>
                    <p className="text-[8px] font-black uppercase text-slate-400">1 Rekrutan</p>
                    <p className="text-xs font-black text-amber-400 mt-0.5">60 Posting</p>
                    {todayRecruits === 1 && (
                      <span className="inline-block text-[7px] font-black uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 mt-1 rounded">Aktif Saat Ini</span>
                    )}
                  </div>

                  <div className={`p-2 rounded-xl border transition-all text-center ${
                    todayRecruits === 2
                      ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-md shadow-sky-500/10'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                  }`}>
                    <p className="text-[8px] font-black uppercase text-slate-400">2 Rekrutan</p>
                    <p className="text-xs font-black text-sky-400 mt-0.5">30 Posting</p>
                    {todayRecruits === 2 && (
                      <span className="inline-block text-[7px] font-black uppercase bg-sky-500/20 text-sky-300 px-1.5 py-0.5 mt-1 rounded">Aktif Saat Ini</span>
                    )}
                  </div>

                  <div className={`p-2 rounded-xl border transition-all text-center ${
                    todayRecruits >= 3
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                  }`}>
                    <p className="text-[8px] font-black uppercase text-slate-400">3+ Rekrutan</p>
                    <p className="text-xs font-black text-emerald-400 mt-0.5">Bebas 🎉</p>
                    {todayRecruits >= 3 && (
                      <span className="inline-block text-[7px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 mt-1 rounded">Aktif Saat Ini</span>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Header Info Section */}
            <div className="grid grid-cols-2 gap-2 px-1">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-tight leading-none mb-0.5">Auto Platform</p>
                  <p className="text-[8px] text-slate-500 font-bold truncate">Deteksi otomatis link medsos</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-tight leading-none mb-0.5">Filter Duplikat</p>
                  <p className="text-[8px] text-slate-500 font-bold truncate">Cegah kirim link ganda</p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="space-y-4">
              {/* Step 1: Session Info */}
              <div className="grid grid-cols-2 gap-3">
                <GlassCard className="p-3 bg-slate-950/60 border-slate-800/50">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5 mb-2">
                    <Hash className="w-3 h-3 text-amber-500" />
                    Nomor Awal
                  </label>
                  <input
                    type="number"
                    value={startNumber}
                    onChange={(e) => {
                      setStartNumber(parseInt(e.target.value) || 1);
                      setHasUserEditedStartNumber(true);
                    }}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-black text-center text-base outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all"
                  />
                </GlassCard>
                <GlassCard className="p-3 bg-slate-950/60 border-slate-800/50 flex flex-col justify-between">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5 mb-2">
                    <Globe className="w-3 h-3 text-sky-500" />
                    Batch Ke
                  </label>
                  <div className="w-full py-2 rounded-xl bg-sky-500/5 border border-sky-500/10 text-sky-400 font-black text-center text-base">
                    #{Math.ceil(startNumber / 10)}
                  </div>
                </GlassCard>
              </div>

              {/* Step 2: Content Entry */}
              <GlassCard className="p-4 space-y-6">
                {/* Links Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-sky-400" />
                      {isReviewingLinks ? 'Review Link Terdeteksi' : 'Tempel Daftar Link'}
                      {links.length > 0 && (
                        <span className="text-[9px] text-sky-400 normal-case font-bold ml-2">
                          ({links.length} Link)
                        </span>
                      )}
                    </label>
                    <span className="text-[8px] text-emerald-400 font-black bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" /> Anti Duplicate
                    </span>
                  </div>

                  {!isReviewingLinks ? (
                    <div className="space-y-4">
                      <div className="relative group">
                        <textarea
                          placeholder="Tempel banyak link di sini... (Contoh: 1. http://... atau langsung link saja)"
                          className="w-full h-32 p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-[11px] text-white placeholder:text-slate-700 outline-none focus:border-sky-500/30 transition-all resize-none font-medium leading-relaxed"
                          value={bulkText}
                          onChange={(e) => setBulkText(e.target.value)}
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                          <span className="text-[8px] font-black text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 uppercase">
                            Mode Tempel Cepat
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        fullWidth
                        variant="secondary"
                        disabled={!bulkText.trim()}
                          onClick={() => {
                            const rawLinks = bulkText.match(/https?:\/\/[^\s]+/g);
                            if (!rawLinks || rawLinks.length === 0) {
                              setStatus({ type: 'error', message: 'Tidak ada link valid yang ditemukan.' });
                              return;
                            }

                            const detected = rawLinks.map(url => url.replace(/[,\.\)]+$/, ''));

                            if (detected.length > 10) {
                              setStatus({ type: 'error', message: 'Maksimal 10 link diperbolehkan. Mohon kurangi jumlah link.' });
                              return;
                            }

                            // Try to detect start number from first numbered link if present (e.g., "41. http...")
                            const formattedLinks: SocialLink[] = detected.map(url => {
                            let platform: SocialPlatform = 'Facebook';
                            const lowUrl = url.toLowerCase();
                            if (lowUrl.includes('facebook.com') || lowUrl.includes('fb.com') || lowUrl.includes('fb.watch')) platform = 'Facebook';
                            else if (lowUrl.includes('x.com') || lowUrl.includes('twitter.com')) platform = 'X (Twitter)';
                            else if (lowUrl.includes('instagram.com')) platform = 'Instagram';
                            else if (lowUrl.includes('tiktok.com')) platform = 'TikTok';
                            else if (lowUrl.includes('threads.net')) platform = 'Threads';
                            else if (lowUrl.includes('wa.me') || lowUrl.includes('whatsapp.com')) platform = 'WhatsApp';
                            else if (lowUrl.includes('t.me')) platform = 'Telegram';
                            
                            return { url, platform };
                          });

                          setLinks(formattedLinks);
                          setIsReviewingLinks(true);
                          setStatus({ type: 'idle' });
                          triggerHaptic('notification', 'success');
                        }}
                      >
                        Pratinjau Link ({bulkText.match(/https?:\/\/[^\s]+/g)?.length || 0})
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {links.map((link, idx) => {
                          const isDuplicate = links.filter(l => l.url === link.url).length > 1;
                          return (
                            <div 
                              key={idx} 
                              className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${
                                isDuplicate 
                                  ? 'bg-rose-500/10 border-rose-500/40' 
                                  : 'bg-slate-900/40 border-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg border shrink-0 ${
                                    isDuplicate 
                                      ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                                      : 'text-sky-400 border-sky-500/30 bg-sky-500/5'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className={`text-xs truncate font-medium ${isDuplicate ? 'text-rose-200' : 'text-white'}`}>
                                    {link.url}
                                  </span>
                                </div>
                                <div className={`shrink-0 px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 border ${
                                  CHANNELS.find(c => c.id === link.platform)?.color || 'text-slate-400 border-slate-800'
                                }`}>
                                  <ChannelPlatformIcon id={link.platform} className="w-2.5 h-2.5" />
                                  {link.platform === 'X (Twitter)' ? 'X' : link.platform}
                                </div>
                              </div>
                              {isDuplicate && (
                                <div className="text-[8px] text-rose-400 font-bold flex items-center gap-1 pl-8">
                                  ⚠️ Link Terdeteksi Duplikat
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex gap-2 animate-in fade-in zoom-in duration-300">
                        <Button 
                          variant="secondary" 
                          fullWidth 
                          className="py-3 h-auto text-[10px] font-black uppercase"
                          onClick={() => {
                            setIsReviewingLinks(false);
                            setLinks([]);
                            setIsConfirmed(false);
                            setImages([]);
                            triggerHaptic('impact', 'light');
                          }}
                        >
                          Ubah Link
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3: Visual Assets - Only shown after previewing links */}
                {isReviewingLinks && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 pt-2 border-t border-slate-800/60"
                  >
                    <div id="image-section" className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-sky-400" />
                          Media Postingan ({images.length}/10)
                        </label>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[9px] font-black text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-all uppercase bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/20 active:scale-95"
                        >
                          <Plus className="w-3 h-3" /> Tambah
                        </button>
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        multiple
                        accept="image/*"
                        className="hidden"
                      />

                      {images.length === 0 ? (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="group cursor-pointer aspect-video rounded-3xl border-2 border-dashed border-slate-800 hover:border-sky-500/30 bg-slate-950/30 flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98]"
                        >
                          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-sky-400 group-hover:border-sky-500/30 transition-colors shadow-lg">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-slate-300 group-hover:text-white">Klik untuk upload gambar</p>
                            <p className="text-[10px] text-slate-600 font-medium mt-1">Maksimal 10 gambar per batch</p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <AnimatePresence mode="popLayout">
                            {images.map((img, idx) => (
                              <motion.div
                                key={`${idx}-${img.substring(0, 20)}`}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group shadow-md"
                              >
                                <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  onClick={() => removeImage(idx)}
                                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-rose-500 transition-colors z-10"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          
                          {images.length < 10 && (
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="aspect-square rounded-2xl border-2 border-dashed border-slate-800 hover:border-sky-500/30 bg-slate-950/30 flex flex-col items-center justify-center gap-1.5 transition-all text-slate-500 hover:text-sky-400 group"
                            >
                              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-black uppercase tracking-tighter">Tambah</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {status.type !== 'idle' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`p-4 rounded-2xl flex items-center gap-3 ${
                            status.type === 'success' 
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                          }`}
                        >
                          {status.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 shrink-0" />
                          )}
                          <p className="text-xs font-black leading-tight">{status.message}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      fullWidth
                      onClick={handleSubmit}
                      disabled={isUploading || links.filter(l => l.url.trim() !== '').length === 0 || images.length === 0}
                      isLoading={isUploading}
                      icon={<Send className="w-4 h-4" />}
                    >
                      Kirim Batch Postingan
                    </Button>
                  </motion.div>
                )}
            </GlassCard>
            </div>
          </motion.div>
        )}

        {/* History Views (Hari Ini & Arsip) */}
        {(activeView === 'hari_ini' || activeView === 'arsip') && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3"
          >
            {posts.length === 0 && !isLoadingHistory ? (
              <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800/50">
                <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">
                  {activeView === 'hari_ini' ? 'Belum ada postingan hari ini' : 'Folder arsip kosong'}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <GlassCard key={post.id} className={`p-4 space-y-3 ${post.archived ? 'opacity-70 grayscale-[0.3]' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">#{post.startNumber} - #{post.startNumber + post.links.length - 1}</span>
                        {post.archived && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-slate-800 text-slate-500 border border-slate-700 flex items-center gap-1">
                            Arsip
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                          <Calendar className="w-3 h-3 text-sky-400" />
                          {post.date}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                          <LinkIcon className="w-3 h-3 text-sky-400" />
                          {post.links.length} Item
                        </div>
                      </div>
                    </div>
                    <div className="flex -space-x-1.5">
                      {Array.from(new Set(post.platforms)).map((p, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg">
                          <ChannelPlatformIcon id={p} className={`w-3.5 h-3.5 ${CHANNELS.find(c => c.id === p)?.color?.split(' ')[0] || 'text-white'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                    {post.links.slice(0, 2).map((link, i) => (
                      <a 
                        key={i} 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 hover:bg-slate-900 border border-slate-800/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <ChannelPlatformIcon id={post.platforms[i]} className={`w-3 h-3 shrink-0 ${CHANNELS.find(c => c.id === post.platforms[i])?.color?.split(' ')[0] || 'text-slate-500'}`} />
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                            {link}
                          </span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-sky-400 transition-colors" />
                      </a>
                    ))}
                    {post.links.length > 2 && (
                      <div className="text-[9px] font-black text-slate-600 text-center uppercase tracking-tighter pt-1">
                        + {post.links.length - 2} Link Lainnya
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))
            )}

            {hasMore && posts.length > 0 && (
              <button
                onClick={() => fetchHistory()}
                disabled={isLoadingHistory}
                className="w-full p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs font-black text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                {isLoadingHistory ? (
                  <X className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Lihat Lebih Banyak
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
