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
