export const timezoneUtils = {
  // Convert local datetime string to UTC string for backend (YYYY-MM-DD HH:mm:ss)
  localToUTC: (localDateTime: string): string => {
    if (!localDateTime) return '';
    
    // Create date object from local datetime string
    const localDate = new Date(localDateTime);
    
    // If the date is invalid, return empty string
    if (isNaN(localDate.getTime())) return '';
    
    // Format to UTC string in YYYY-MM-DD HH:mm:ss format
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    const hours = String(localDate.getUTCHours()).padStart(2, '0');
    const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(localDate.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },

  // Convert UTC datetime from backend to local datetime string for input fields
  UTCToLocalInput: (utcDateTime: string): string => {
    if (!utcDateTime) return '';
    
    // Handle both formats: "YYYY-MM-DD HH:mm:ss" and ISO format
    const isoString = utcDateTime.includes('T') 
      ? utcDateTime 
      : utcDateTime.replace(' ', 'T') + 'Z';
    
    const date = new Date(isoString);
    
    // If the date is invalid, return empty string
    if (isNaN(date.getTime())) return '';
    
    // Format to datetime-local input format (YYYY-MM-DDThh:mm)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  },

  // Get minimum datetime for input (current local time + 1 minute)
  getMinDateTime: (): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Add 1 minute buffer
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  },

  // Format datetime for display with timezone
  formatForDisplay: (dateTime: string, includeTimezone: boolean = true): string => {
    if (!dateTime) return '';
    
    const date = new Date(dateTime.includes('T') ? dateTime : dateTime.replace(' ', 'T') + 'Z');
    
    if (isNaN(date.getTime())) return '';
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    
    if (includeTimezone) {
      options.timeZoneName = 'short';
    }
    
    return date.toLocaleString([], options);
  },

  // Get user's timezone
  getUserTimezone: (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  // Validate that a datetime is in the future
  isFutureDateTime: (dateTime: string): boolean => {
    const selectedDate = new Date(dateTime);
    const now = new Date();
    return selectedDate > now;
  },

  // Add minutes to current time
  addMinutesToNow: (minutes: number): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutesStr = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutesStr}`;
  },
};