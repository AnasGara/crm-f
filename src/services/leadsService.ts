import { httpClient, ApiResponse } from './api';
import { authService } from './authService';

export interface Lead {
    id: number;
    organisation_id: number;
    full_name: string;
    position: string;
    company: string;
    location: string;
    profile_url: string;
    followers: number;
    connections: number;
    education: string;
    personal_message: string;
    message_length: number;
    generated_at: string;
    total_leads: number;
    created_at: string;
    updated_at: string;
}

export interface LeadsApiResponse {
  status: string;
  count: number;
  data: Lead[];
}

export interface CreateLeadData {
  full_name: string;
  position: string;
  company: string;
  location: string;
  profile_url: string;
  followers: number;
  connections: number;
  education: string;
  personal_message: string;
  message_length: number;
  generated_at: string;
  total_leads: number;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {}

class LeadService {
  async getLeads(): Promise<Lead[]> {
    try {
      const currentUser = authService.getStoredUser();
      if (!currentUser || !currentUser.organisation_id) {
        throw new Error('User not authenticated or no organization');
      }

      const response = await httpClient.get<LeadsApiResponse>(`/organisations/${currentUser.organisation_id}/leads`);
      
      if (response.success && response.data) {
        return response.data.data || [];
      }
      
      throw new Error(response.message || 'Failed to fetch leads');
    } catch (error) {
      console.error('Get leads error:', error);
      throw error;
    }
  }

  async createLead(leadData: CreateLeadData): Promise<Lead> {
    try {
      const currentUser = authService.getStoredUser();
      if (!currentUser || !currentUser.organisation_id) {
        throw new Error('User not authenticated or no organization');
      }
      const response = await httpClient.post<Lead>(`/leads`, leadData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to create lead');
    } catch (error) {
      console.error('Create lead error:', error);
      throw error;
    }
  }

  async updateLead(id: number, leadData: UpdateLeadData): Promise<Lead> {
    try {
      const response = await httpClient.put<Lead>(`/leads/${id}`, leadData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update lead');
    } catch (error) {
      console.error('Update lead error:', error);
      throw error;
    }
  }

  async deleteLead(id: number): Promise<void> {
    try {
      const response = await httpClient.delete(`/leads/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete lead');
      }
    } catch (error) {
      console.error('Delete lead error:', error);
      throw error;
    }
  }
}

export const leadService = new LeadService();
export default leadService;
