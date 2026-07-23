import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config';
import { handleFirestoreError, OperationType } from '../error';
import { DailyReport, DailyReportFormData } from '../../types';

const COLLECTION_NAME = 'daily_reports';

export function subscribeToUserReports(telegramId: string, onUpdate: (reports: DailyReport[]) => void): () => void {
  const reportsRef = collection(db, COLLECTION_NAME);
  const q = query(
    reportsRef,
    where('telegramId', '==', telegramId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map((docSnap) => docSnap.data() as DailyReport);
    onUpdate(reports);
  }, (error) => {
    console.error('Error listening to user reports:', error);
  });
}

export function subscribeToAllReports(onUpdate: (reports: DailyReport[]) => void): () => void {
  const reportsRef = collection(db, COLLECTION_NAME);
  const q = query(reportsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map((docSnap) => docSnap.data() as DailyReport);
    onUpdate(reports);
  }, (error) => {
    console.error('Error listening to all reports:', error);
  });
}

export async function createDailyReport(
  user: { telegramId: string; username: string; name: string },
  formData: DailyReportFormData
): Promise<DailyReport> {
  const reportId = `REP_${Date.now()}_${user.telegramId.slice(-4)}`;
  const now = new Date().toISOString();

  const report: DailyReport = {
    reportId,
    telegramId: user.telegramId,
    username: user.username,
    name: user.name,
    date: formData.date,
    recruiterUsername: formData.recruiterUsername || user.username,
    channel: formData.channel || '',
    applicantWhatsapp: formData.applicantWhatsapp || '',
    uid9Kucing: formData.uid9Kucing || '',
    applicantTelegramUsername: formData.applicantTelegramUsername || '',
    result: formData.result || 'Pending',
    grup: formData.grup || 'T0',
    visit: Number(formData.visit) || 0,
    applicant: Number(formData.applicant) || 0,
    quality: Number(formData.quality) || 0,
    posting: Number(formData.posting) || 0,
    permission: Number(formData.permission) || 0,
    note: formData.note || '',
    createdAt: now
  };

  try {
    const reportRef = doc(db, COLLECTION_NAME, reportId);
    await setDoc(reportRef, report);
    return report;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${reportId}`);
  }
}

export async function getReportsByTelegramId(telegramId: string): Promise<DailyReport[]> {
  try {
    const reportsRef = collection(db, COLLECTION_NAME);
    const q = query(
      reportsRef,
      where('telegramId', '==', telegramId)
    );
    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map((docSnap) => docSnap.data() as DailyReport);
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}

export async function updateReportStatus(reportId: string, result: 'Pending' | 'ACC' | 'REJECT'): Promise<void> {
  try {
    const reportRef = doc(db, COLLECTION_NAME, reportId);
    await setDoc(reportRef, { result, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${reportId}`);
  }
}

export async function checkReportDuplicate(
  uid9Kucing: string,
  applicantTelegramUsername: string
): Promise<DailyReport | null> {
  const reportsRef = collection(db, COLLECTION_NAME);
  
  const cleanTg = applicantTelegramUsername ? applicantTelegramUsername.trim().replace(/^@/, '').toLowerCase() : '';
  const cleanUid = uid9Kucing ? uid9Kucing.trim() : '';

  if (!cleanUid && !cleanTg) return null;

  try {
    if (cleanUid) {
      const qUid = query(reportsRef, where('uid9Kucing', '==', cleanUid));
      const snapUid = await getDocs(qUid);
      if (!snapUid.empty) {
        return snapUid.docs[0].data() as DailyReport;
      }
    }

    if (cleanTg) {
      // Check exact match
      const qTg = query(reportsRef, where('applicantTelegramUsername', '==', cleanTg));
      const snapTg = await getDocs(qTg);
      if (!snapTg.empty) {
        return snapTg.docs[0].data() as DailyReport;
      }

      // Check with @ prefix
      const qTgWithAt = query(reportsRef, where('applicantTelegramUsername', '==', `@${cleanTg}`));
      const snapTgWithAt = await getDocs(qTgWithAt);
      if (!snapTgWithAt.empty) {
        return snapTgWithAt.docs[0].data() as DailyReport;
      }

      // Check case-insensitively by fetching or comparing if needed, but standard query with exact or @ is highly reliable for our formatted data.
    }

    return null;
  } catch (error) {
    console.error('Error checking report duplicate:', error);
    return null;
  }
}

export async function getAllReports(): Promise<DailyReport[]> {
  try {
    const reportsRef = collection(db, COLLECTION_NAME);
    const q = query(reportsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as DailyReport);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}
