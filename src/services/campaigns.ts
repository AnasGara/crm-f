// services/campaigns.ts
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

export const updateCampaign = async (id: number, data: any) => {
  try {
    console.log(`DEBUG: Updating campaign ${id} with data:`, data);
    const response = await httpClient.put(`/campaigns/${id}`, data);
    console.log(`DEBUG: Full response from httpClient:`, response);
    
    // Check if response is the data directly or has a data property
    // Based on your logs, it seems httpClient returns the data directly
    if (response && typeof response === 'object') {
      // If response already has success, message, and data properties
      if (response.success !== undefined && response.message !== undefined) {
        console.log(`DEBUG: Response has expected structure with success/message`);
        return response;
      }
      
      // If response looks like campaign data (has id, name, etc.)
      if (response.id !== undefined && response.name !== undefined) {
        console.log(`DEBUG: Response appears to be campaign data only, wrapping it`);
        return {
          success: true,
          message: 'Campaign updated successfully',
          data: response,
          errors: null
        };
      }
    }
    
    // Fallback: assume success and wrap whatever we got
    console.log(`DEBUG: Using fallback response wrapper`);
    return {
      success: true,
      message: 'Campaign updated successfully',
      data: response,
      errors: null
    };
  } catch (error: any) {
    console.error(`Error updating campaign for id ${id}:`, error);
    
    // Check if error has a response property
    if (error.response) {
      // If it's an axios error
      const errorData = error.response.data || error.response;
      throw {
        success: false,
        message: errorData.message || 'Failed to update campaign',
        data: null,
        errors: errorData.errors || null
      };
    } else if (error.success === false) {
      // If it's already formatted
      throw error;
    } else {
      // Generic error
      throw {
        success: false,
        message: error.message || 'Network error occurred',
        data: null,
        errors: null
      };
    }
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