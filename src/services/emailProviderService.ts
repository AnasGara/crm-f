import { httpClient, ApiResponse } from './api';
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
  const response = await httpClient.get<{ url: string }>(API_ENDPOINTS.EMAIL_PROVIDER.GOOGLE_REDIRECT);
  if (!response || !response.data) {
    throw new Error('No OAuth URL returned from server');
  }
  return response.data; // guaranteed { url: string }
},


};
export default emailProviderService;
