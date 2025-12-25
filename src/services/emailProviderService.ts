import { httpClient, ApiResponse } from './api';

export interface EmailProvider {
  id: number;
  user_id: number;
  provider: string;
  connected: boolean;
  created_at: string;
  updated_at: string;
}

const emailProviderService = {

   testConnection: async () => {
    const response = await httpClient.get('/email-provider/test-connection');
    return response.data;
  },
  
  sendTestEmail: async (toEmail = null) => {
    const data = toEmail ? { to_email: toEmail } : {};
    const response = await httpClient.post('/email-provider/send-test-email', data);
    return response.data;
  },
  
  refreshToken: async () => {
    const response = await httpClient.post('/email-provider/refresh-token');
    return response.data;
  },
  
  getDetailedStatus: async () => {
    const response = await httpClient.get('/email-provider/test-connection');
    return response.data;
  }, 
getEmailProviderStatus: async (token?: string): Promise<ApiResponse<EmailProvider>> => {
    return null
    /*httpClient.get<EmailProvider>('/user/email-provider', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    */
  }
,
   disconnectEmailProvider:async()=>{
    return null;
   }
/*/
  disconnectEmailProvider: async (token?: string): Promise<ApiResponse<any>> => {
    return httpClient.delete('/user/email-provider', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  },
  */
 ,
 connectEmailProvider: async (): Promise<{ url: string }> => {
  const response = await httpClient.get<{ url: string }>('/email-provider/google/redirect');
  if (!response || !response.data) {
    throw new Error('No OAuth URL returned from server');
  }
  return response.data; // guaranteed { url: string }
},


};
export default emailProviderService;
