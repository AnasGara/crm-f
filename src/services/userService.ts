import { httpClient, ApiResponse } from './api';

export interface OrganizationUser {
  id: number;
  name: string;
  email: string;
  organisation_id: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  organisation_id?: number;
  first_time_login?: number;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  organisation_id: number;
  first_time_login: number;
  refresh_token: string | null;
}

export const userService = {
  async getOrganizationUsers(): Promise<OrganizationUser[]> {
    const response = await httpClient.get<OrganizationUser[]>('/organisation/users');
    return response.data || [];
  },

  async updateUser(userId: number, payload: UpdateUserPayload): Promise<UserResponse> {
    const response = await httpClient.put<UserResponse>(`/users/${userId}`, payload);
    return response.data;
  },
};
