import { httpClient, ApiResponse, TokenManager } from './api';
import { API_ENDPOINTS } from '../utils/constants';

export interface EmailProvider {
  id: number;
  user_id: number;
  provider: string;
  connected: boolean;
  created_at: string;
  updated_at: string;
}

const emailProviderService = {
  /**
   * Get the current status of the user's email provider
   */
  getEmailProviderStatus: async (token?: string): Promise<ApiResponse<EmailProvider>> => {
    try {
      const response = await httpClient.get<EmailProvider>('/user/email-provider', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching email provider status:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch email provider status',
      };
    }
  },

  /**
   * Disconnect the user's connected email provider
   */
  disconnectEmailProvider: async (token?: string): Promise<ApiResponse<any>> => {
    try {
      const response = await httpClient.delete('/user/email-provider', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error disconnecting email provider:', error);
      return {
        success: false,
        message: error.message || 'Failed to disconnect email provider',
      };
    }
  },

  /**
   * Get Google OAuth URL from backend and return it.
   * The frontend should redirect the user or open a popup with this URL.
   */
  connectEmailProvider: async (): Promise<{ url: string }> => {
    try {
      const token = TokenManager.getToken();

      const response = await fetch('http://localhost:8000/email-provider/google/redirect', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get Google OAuth URL');
      }

      const data = await response.json();
      if (!data || !data.url) {
        throw new Error('No OAuth URL returned from server');
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching Google OAuth URL:', error);
      throw error;
    }
  },
};

export default emailProviderService;
