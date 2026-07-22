export function formatUsername(username?: string | null): string {
  if (!username) return 'tanpa_username';
  // Remove all existing @ symbols and add exactly one at the start
  const clean = username.replace(/@/g, '').trim();
  if (!clean) return 'tanpa_username';
  return `@${clean}`;
}

export function formatWIBDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // It might be YYYY-MM-DD
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]} ${parts[1]} ${parts[0]}`;
      }
      return dateString;
    }
    
    // Format to WIB (Asia/Jakarta)
    return date.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, ' '); // id-ID normally uses dd/mm/yyyy, convert to dd mm yyyy
  } catch (e) {
    return dateString;
  }
}

export function formatWIBDateTime(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    // Format to WIB (Asia/Jakarta)
    const datePart = date.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, ' ');

    const timePart = date.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `${datePart} ${timePart} WIB`;
  } catch (e) {
    return dateString;
  }
}

/**
 * Gets the current date in YYYY-MM-DD format based on Asia/Jakarta timezone (WIB)
 */
export function getWIBDate(): string {
  const now = new Date();
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const year = jakartaTime.getFullYear();
  const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
  const day = String(jakartaTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets current time in milliseconds adjusted to WIB
 * This is useful for countdowns where we want the end of day in WIB
 */
export function getWIBNow(): Date {
  const now = new Date();
  // Get time string in WIB
  const wibString = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  return new Date(wibString);
}

/**
 * Gets the date of the Monday for the given week in WIB
 * offset: 0 for current week, -7 for last week
 */
export function getWIBMonday(offsetDays: number = 0): string {
  const now = new Date();
  const jakartaStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  const d = new Date(jakartaStr);
  
  const day = d.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offsetDays;
  d.setDate(diff);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export interface WIBWeekDayInfo {
  dayName: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  dateStr: string; // YYYY-MM-DD
  displayDate: string; // DD/MM
  isToday: boolean;
}

export function getWIBCurrentWeekDays(): WIBWeekDayInfo[] {
  const mondayStr = getWIBMonday(0);
  const [y, m, d] = mondayStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);
  const todayStr = getWIBDate();
  
  const dayNames: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu')[] = [
    'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
  ];

  return dayNames.map((name, idx) => {
    const cur = new Date(baseDate);
    cur.setDate(baseDate.getDate() + idx);
    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return {
      dayName: name,
      dateStr,
      displayDate: `${day}/${month}`,
      isToday: dateStr === todayStr
    };
  });
}

export function getIndonesianDayName(dateStr: string): string {
  if (!dateStr) return '';
  const normalize = (s: string) => {
    const parts = s.split('-');
    if (parts.length !== 3) return s;
    if (parts[0].length === 2) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return s;
  };
  const norm = normalize(dateStr);
  const [y, m, d] = norm.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(y, m - 1, d);
  const dayIdx = dt.getDay(); // 0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[dayIdx] || '';
}
