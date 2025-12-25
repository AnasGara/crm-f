import { TokenManager } from './api';

export interface EmailProvider {
  id: number;
  user_id: number;
  provider: string;
  connected: boolean;
  created_at: string;
  updated_at: string;
}

const emailProviderService = {
  connectEmailProvider: async (): Promise<{ url: string }> => {
    const token = TokenManager.getToken();
    if (!token) throw new Error('No auth token found');

    const response = await fetch('http://localhost:8000/email-provider/google/redirect', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Google OAuth URL');
    }

    const data = await response.json();
    if (!data?.url) throw new Error('No OAuth URL returned from server');

    return data;
  },

  getEmailProviderStatus: async (): Promise<EmailProvider | null> => {
    try {
      const token = TokenManager.getToken();
      const response = await fetch('http://localhost:8000/user/email-provider', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },

  disconnectEmailProvider: async (): Promise<boolean> => {
    try {
      const token = TokenManager.getToken();
      const response = await fetch('http://localhost:8000/user/email-provider', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};

export default emailProviderService;
