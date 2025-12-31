
import { httpClient, ApiResponse } from './api';

export interface EmailCapability {
  can_send_emails: boolean;
  provider_email: string | null;
  expires_at: string | null;
  message: string;
}

export interface BulkEmailPayload {
  lead_ids: number[];
  subject: string;
  body: string;
  personalize: boolean;
  batch_size?: number;
}

export interface BulkEmailResponse {
  success: boolean;
  message: string;
  data: {
    total_processed: number;
    success_count: number;
    failed_count: number;
    results: {
      success: {
        lead_id: number;
        email: string;
        message_id: string;
      }[];
      failed: {
        lead_id: number;
        email: string;
        error: string;
      }[];
    };
  };
}

const emailService = {
  checkEmailCapability: async (): Promise<ApiResponse<EmailCapability>> => {
    return httpClient.get<EmailCapability>('/email/check-capability');
  },

  sendBulkEmails: async (payload: BulkEmailPayload): Promise<ApiResponse<BulkEmailResponse>> => {
    return httpClient.post<BulkEmailResponse>('/email/send-bulk', payload);
  },
};

export default emailService;
