import { httpClient } from './api';

export const getScheduledEmails = async (params?: any) => {
  try {
    const response = await httpClient.get('/scheduled-emails', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching scheduled emails:', error);
    throw error;
  }
};
