import { httpClient } from './api';

export const getCampaigns = async (params?: any) => {
  try {
    const response = await httpClient.get('/campaigns', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};

export const cancelCampaign = async (id: number) => {
  try {
    const response = await httpClient.post(`/campaigns/${id}/cancel`);
    return response.data;
  } catch (error) {
    console.error(`Error cancelling campaign for id ${id}:`, error);
    throw error;
  }
};

export const getCampaignDetails = async (id: number) => {
  try {
    const response = await httpClient.get(`/campaigns/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching campaign details for id ${id}:`, error);
    throw error;
  }
};
