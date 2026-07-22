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
