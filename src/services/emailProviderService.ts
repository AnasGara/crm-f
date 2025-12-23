import { httpClient, ApiResponse } from './api';

export interface EmailProvider {
  id: number;
  user_id: number;
  provider: string;
  created_at: string;
  updated_at: string;
}

const emailProviderService = {
  getEmailProviderStatus: async (): Promise<ApiResponse<EmailProvider>> => {
    return httpClient.get<EmailProvider>('/user/email-provider');
  },

  disconnectEmailProvider: async (): Promise<ApiResponse<any>> => {
    return httpClient.delete('/user/email-provider');
  },
};

export default emailProviderService;
