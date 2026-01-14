// services/emailService.ts
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

export interface ScheduleBulkEmailPayload {
  lead_ids: number[];
  subject: string;
  body: string;
  send_at: string;
  personalize?: boolean;
  batch_size?: number;
  create_campaign?: boolean;
  campaign_name?: string;
}

export interface ScheduleBulkEmailResponse {
  success: boolean;
  message: string;
  data: {
    campaign?: {
      id: number;
      name: string;
      subject: string;
      status: string;
      total_count: number;
      schedule_time: string;
      sender: {
        id: number;
        name: string;
        email: string;
      };
    };
    total_leads: number;
    scheduled_for: string;
  };
}

export interface SentEmail {
  id: number;
  lead: {
    id: number;
    name: string;
    email: string;
    company: string | null;
  };
  to_email: string;
  subject: string;
  status: string;
  sent_at: string;
}

export interface MySentEmailsResponse {
  emails: SentEmail[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

const emailService = {
  checkEmailCapability: async (): Promise<ApiResponse<EmailCapability>> => {
    return httpClient.get<EmailCapability>('/email/check-capability');
  },

  sendBulkEmails: async (payload: BulkEmailPayload): Promise<ApiResponse<BulkEmailResponse>> => {
    try {
      return await httpClient.post<BulkEmailResponse>('/email/send-bulk', payload);
    } catch (error: any) {
      // Return structured error response
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send bulk emails',
        errors: error.response?.data?.errors || {},
        data: null
      };
    }
  },

  scheduleBulkEmails: async (payload: ScheduleBulkEmailPayload): Promise<ApiResponse<ScheduleBulkEmailResponse>> => {
    try {
      return await httpClient.post<ScheduleBulkEmailResponse>('/scheduled-emails/schedule-bulk', payload);
    } catch (error: any) {
      // Return structured error response
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to schedule emails',
        errors: error.response?.data?.errors || {},
        data: null
      };
    }
  },

  getMySentEmails: async (): Promise<ApiResponse<MySentEmailsResponse>> => {
    return httpClient.get<MySentEmailsResponse>('/emails/my-sent-emails');
  },
};

export default emailService;