export const notificationService = {
  getNotifications: jest.fn().mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1 } }),
  getUnreadCount: jest.fn().mockResolvedValue(0),
  markAsRead: jest.fn().mockResolvedValue({}),
  markAllAsRead: jest.fn().mockResolvedValue({}),
};
