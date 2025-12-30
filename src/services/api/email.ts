// services/api/email.ts

import { httpClient as api } from '../api';

export interface EmailCapability {
  can_send_emails: boolean;
  provider_email: string | null;
  expires_at: string | null;
  message: string;
}

export interface SendEmailToLeadPayload {
  subject: string;
  body: string;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  data: {
    message_id: string;
    lead: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export const checkEmailCapability = async (): Promise<EmailCapability> => {
  try {
    const response = await api.get('/email/check-capability');
    console.log('Email capability:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error checking email capability:', error);
    throw error;
  }
};

export const sendEmailToLead = async (
  leadId: number,
  payload: SendEmailToLeadPayload
): Promise<SendEmailResponse> => {
  try {
    const response = await api.post(`/email/send-to-lead/${leadId}`, payload);
    return response.data;
  } catch (error: any) {
    console.error('Error sending email to lead:', error);
    
    // Handle different error responses
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to send email');
    }
  }
};