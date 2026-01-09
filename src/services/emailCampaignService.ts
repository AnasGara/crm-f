
import { httpClient, ApiResponse } from './api';

export interface EmailCampaign {
  id?: number;
  name: string;
  subject: string;
  sender: number;
  audience: string[];
  content: string;
  schedule: 'now' | 'later';
  schedule_time?: string;
  created_at?: string;
  updated_at?: string;
}

const emailCampaignService = {
  createEmailCampaign: async (campaignData: EmailCampaign): Promise<ApiResponse<EmailCampaign>> => {
    return httpClient.post<EmailCampaign>('/email-campaigns', campaignData);
  },
};

export default emailCampaignService;
