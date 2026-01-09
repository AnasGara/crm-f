import { httpClient, ApiResponse } from './api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  time: string;
  timestamp: string;
  read: boolean;
  avatar?: string | null;
  relatedView?: {
    name: string;
    id: number;
  } | null;
  actionData?: any;
  category: 'task' | 'appointment' | 'opportunity' | 'contact' | 'system' | 'reminder';
  created_at: string;
}

export interface NotificationListResponse {
  data: Notification[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface UnreadCountResponse {
  unread: number;
}

class NotificationService {
  private readonly baseEndpoint = '/notifications';

  async getNotifications(page: number = 1, perPage: number = 20): Promise<NotificationListResponse> {
    try {
      const response = await httpClient.get<NotificationListResponse>(
        this.baseEndpoint,
        { page: page.toString(), per_page: perPage.toString() }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch notifications');
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await httpClient.get<UnreadCountResponse>(`${this.baseEndpoint}/unread-count`);

      if (response.success && response.data) {
        return response.data.unread;
      }

      return 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: number): Promise<Notification> {
    try {
      const response = await httpClient.post<Notification>(`${this.baseEndpoint}/${notificationId}/read`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to mark notification as read');
      }

      if (!response.data) {
        throw new Error('No data returned from mark as read');
      }

      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const response = await httpClient.post(`${this.baseEndpoint}/mark-all-read`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
