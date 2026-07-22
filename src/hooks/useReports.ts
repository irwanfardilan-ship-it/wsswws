import { useState, useCallback, useEffect } from 'react';
import { DailyReport, DailyReportFormData } from '../types';
import { 
  createDailyReport, 
  subscribeToUserReports, 
  subscribeToAllReports, 
  updateReportStatus 
} from '../firebase/services/reportService';
import { syncReportToSheetsApi } from '../services/api';
import { useAuth } from './useAuth';

export function useReports() {
  const { telegramUser, userProfile } = useAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const role = userProfile?.role;
  const telegramUserId = telegramUser?.id;

  useEffect(() => {
    if (!telegramUserId) return;
    
    setIsLoading(true);
    let unsubscribe: () => void;
    
    if (role === 'Admin' || role === 'Owner') {
      unsubscribe = subscribeToAllReports((data) => {
        setReports(data || []);
        setIsLoading(false);
      });
    } else {
      unsubscribe = subscribeToUserReports(String(telegramUserId), (data) => {
        setReports(data || []);
        setIsLoading(false);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [telegramUserId, role]);

  const submitReport = async (formData: DailyReportFormData) => {
    if (!telegramUser) throw new Error('Pengguna tidak terautentikasi');
    setIsLoading(true);
    setError(null);
    try {
      const name = `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim() || 'Recruiter';
      const newReport = await createDailyReport(
        {
          telegramId: String(telegramUser.id),
          username: telegramUser.username || '',
          name
        },
        formData
      );
      
      // Sync report to Google Sheets automatically
      syncReportToSheetsApi(newReport).catch((err) => {
        console.warn('[Google Sheets] Auto sync report failed:', err);
      });

      return newReport;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim laporan harian.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (reportId: string, status: 'Pending' | 'ACC' | 'REJECT') => {
    setIsLoading(true);
    setError(null);
    try {
      await updateReportStatus(reportId, status);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah status.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reports,
    isLoading,
    error,
    refetch: () => {}, // Handled by real-time listener
    submitReport,
    updateStatus
  };
}
