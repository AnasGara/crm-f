import { httpClient, ApiResponse } from './api';
import { authService } from './authService';

export interface Lead {
    id: number;
    organisation_id: number;
    full_name: string;
    email: string;
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
    status: 'to_be_treated' | 'qualified' | 'archived';
    comments: string;
    treated: boolean;
}

export interface LeadsApiResponse {
  status: string;
  count: number;
  data: Lead[];
}

export interface CreateLeadData {
  full_name: string;
  email: string;
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
  comments?: string;
  status?: 'to_be_treated' | 'qualified' | 'archived';
}

export interface UpdateLeadData extends Partial<CreateLeadData> {}

class LeadService {
  async getLeads(): Promise<Lead[]> {
    try {
      const response = await httpClient.get<Lead[]>(`/leads`);
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch leads');
    } catch (error) {
      console.error('Get leads error:', error);
      throw error;
    }
  }

  async filterLeads(filterData: any): Promise<LeadsApiResponse> {
    try {
      const response = await httpClient.post<LeadsApiResponse>(`/leads/filter`, filterData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to filter leads');
    } catch (error) {
      console.error('Filter leads error:', error);
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

  async markAsTreated(id: number): Promise<Lead> {
    try {
      const response = await httpClient.patch<{ lead: Lead }>(`/leads/${id}/treated`, {});
      if (response.success && response.data) {
        return response.data.lead;
      }
      throw new Error(response.message || 'Failed to mark lead as treated');
    } catch (error) {
      console.error('Mark as treated error:', error);
      throw error;
    }
  }

  async markAsUntreated(id: number): Promise<Lead> {
    try {
      const response = await httpClient.patch<{ lead: Lead }>(`/leads/${id}/untreated`, {});
      if (response.success && response.data) {
        return response.data.lead;
      }
      throw new Error(response.message || 'Failed to mark lead as untreated');
    } catch (error) {
      console.error('Mark as untreated error:', error);
      throw error;
    }
  }

}

export const leadService = new LeadService();
export default leadService;