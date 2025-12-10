export const formatRelativeTime = (timestamp: string | Date): string => {
  const now = new Date();
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return 'Hier';
  return `Il y a ${days} jours`;
};

export const getNotificationTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    success: 'border-l-green-500 bg-green-50',
    warning: 'border-l-yellow-500 bg-yellow-50',
    error: 'border-l-red-500 bg-red-50',
    reminder: 'border-l-blue-500 bg-blue-50',
    info: 'border-l-blue-500 bg-blue-50',
  };
  return colors[type] || colors.info;
};

export const getCategoryDisplayIcon = (category: string): string => {
  const icons: Record<string, string> = {
    task: '📋',
    appointment: '📅',
    opportunity: '💼',
    contact: '👤',
    reminder: '⏰',
    system: 'ℹ️',
  };
  return icons[category] || icons.system;
};
