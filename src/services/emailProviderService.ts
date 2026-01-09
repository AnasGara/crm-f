import { httpClient, ApiResponse } from './api';

export interface EmailProvider {
  id: number;
  user_id: number;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  provider_email: string | null;
  connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConnectionStatus {
  connected: boolean;
  provider_email: string | null;
  connected_at: string | null;
  expires_at: string | null;
  provider: string;
}

export interface TestConnectionResponse {
  success: boolean;
  data: {
    connected: boolean;
    email?: string;
    [key: string]: any;
  };
}

export interface TestEmailResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
}

export interface DisconnectResponse {
  success: boolean;
  message: string;
}

export interface ConnectResponse {
  url: string;
}

// Type guard to check if an error is an AxiosError
const isAxiosError = (error: any): error is { response?: { data?: any; status?: number } } => {
  return error && typeof error === 'object' && 'response' in error;
};

// Type guard to check if response has expected structure
const isValidResponse = <T>(response: any): response is { data: T } => {
  return response && typeof response === 'object' && 'data' in response;
};

// Helper function to handle API errors consistently
const handleApiError = (error: any, defaultMessage: string): { success: false; message: string } => {
  console.error('API Error:', error);
  
  if (isAxiosError(error)) {
    const serverMessage = error.response?.data?.message;
    const statusCode = error.response?.status;
    
    let message = serverMessage || error.message || defaultMessage;
    
    // Add status-specific messages
    if (statusCode === 401) {
      message = 'Authentication failed. Please log in again.';
    } else if (statusCode === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (statusCode === 404) {
      message = 'Resource not found.';
    } else if (statusCode === 422) {
      message = 'Validation error. Please check your input.';
    } else if (statusCode >= 500) {
      message = 'Server error. Please try again later.';
    }
    
    return {
      success: false,
      message
    };
  }
  
  // For non-Axios errors
  return {
    success: false,
    message: error instanceof Error ? error.message : defaultMessage
  };
};

const emailProviderService = {
  // Test Gmail connection
  testConnection: async (): Promise<TestConnectionResponse> => {
    try {
      const response = await httpClient.get<TestConnectionResponse>('/email-providers/test-connection');
      
      if (!isValidResponse<TestConnectionResponse>(response)) {
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Test connection failed:', error);
      throw error; // Let the caller handle this error
    }
  },
  
  // Send test email
  sendTestEmail: async (toEmail?: string): Promise<TestEmailResponse> => {
    try {
      const data = toEmail ? { to_email: toEmail } : {};
      const response = await httpClient.post<TestEmailResponse>('/email-providers/send-test-email', data);
      
      if (!isValidResponse<TestEmailResponse>(response)) {
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to send test email');
    }
  },
  
  // Refresh token manually
refreshToken: async (): Promise<RefreshTokenResponse> => {
  try {
    const response = await httpClient.post<RefreshTokenResponse>(
      '/email-providers/refresh-token'
    );

    if (!response?.data || typeof response.data !== 'object') {
      return {
        success: false,
        message: 'Invalid refresh response from server'
      };
    }

    return {
      success: Boolean((response.data as any).success),
      message: (response.data as any).message || 'Refresh completed'
    };

  } catch (error) {
    return handleApiError(error, 'Failed to refresh token');
  }
},
  
  // Get detailed status (same as test connection)
  getDetailedStatus: async (): Promise<TestConnectionResponse> => {
    try {
      return await emailProviderService.testConnection();
    } catch (error) {
      // Provide a fallback response
      return {
        success: false,
        data: {
          connected: false,
          error: error instanceof Error ? error.message : 'Connection check failed'
        }
      };
    }
  },
  
  // Get connection status for a specific provider
 // In your emailProviderService.ts, update getConnectionStatus
getConnectionStatus: async (provider: string = 'google'): Promise<ConnectionStatus> => {
  try {
    console.log(`Fetching connection status for ${provider}...`);
    
    const response = await httpClient.get<ConnectionStatus>(`/email-providers/${provider}/status`);
    
    console.log('Raw API response:', response);
    
    if (!isValidResponse<ConnectionStatus>(response)) {
      console.error('Invalid response format:', response);
      throw new Error('Invalid response format from server');
    }
    
    console.log('Parsed connection status:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Failed to get connection status:', error);
    
    // Return default disconnected status on error
    return {
      connected: false,
      provider_email: null,
      connected_at: null,
      expires_at: null,
      provider
    };
  }
},
  
  // Disconnect from a provider
// Disconnect from a provider
disconnectEmailProvider: async (provider: string = 'google'): Promise<DisconnectResponse> => {
  try {
    console.log(`Attempting to disconnect from ${provider}...`);
    
    const response = await httpClient.post(`/email-providers/${provider}/disconnect`);
    
    console.log('Disconnect response:', response);
    
    // If the response already has the success/message structure, return it
    if (response.data && typeof response.data === 'object') {
      const data = response.data as any;
      
      // Check if it already has the expected structure
      if (data.success !== undefined) {
        return {
          success: data.success,
          message: data.message || 'Disconnect completed'
        };
      }
      
      // If it's just a message string
      if (typeof data === 'string' || data.message) {
        return {
          success: true,
          message: typeof data === 'string' ? data : data.message
        };
      }
    }
    
    // Fallback: assume success if we got a 2xx response
    return {
      success: true,
      message: 'Successfully disconnected'
    };
    
  } catch (error: any) {
    console.error('Disconnect API error:', error);
    
    // Check if error has response data
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      
      // If backend returns error with success: false
      if (errorData.success === false) {
        return {
          success: false,
          message: errorData.message || 'Disconnect failed'
        };
      }
      
      // If backend returns a simple message
      if (errorData.message) {
        return {
          success: false,
          message: errorData.message
        };
      }
    }
    
    // Generic error handling
    return {
      success: false,
      message: error.message || 'Failed to disconnect from provider'
    };
  }
},
  
  // Connect to a provider
  connectEmailProvider: async (provider: string = 'google'): Promise<ConnectResponse> => {
    try {
      const response = await httpClient.get<ConnectResponse>(`/email-providers/${provider}/redirect`);
      
      if (!isValidResponse<ConnectResponse>(response)) {
        throw new Error('Invalid response format from server');
      }
      
      if (!response.data.url) {
        throw new Error('No OAuth URL returned from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to get OAuth URL:', error);
      throw new Error(`Failed to initiate OAuth connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  // Test connection with retry logic
  testConnectionWithRetry: async (maxRetries: number = 2): Promise<TestConnectionResponse> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await emailProviderService.testConnection();
        console.log(`Connection test succeeded on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Connection test attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError || new Error('Connection test failed after all retries');
  },
  
  // Legacy method for backward compatibility
  getEmailProviderStatus: async (): Promise<ApiResponse<EmailProvider>> => {
    try {
      const status = await emailProviderService.getConnectionStatus('google');
      
      return {
        success: true,
        data: {
          id: 0,
          user_id: 0,
          provider: status.provider,
          access_token: '',
          refresh_token: null,
          expires_at: status.expires_at,
          provider_email: status.provider_email,
          connected: status.connected,
          created_at: status.connected_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get connection status',
        data: null
      };
    }
  },
  
  // Check if provider is connected
  isProviderConnected: async (provider: string = 'google'): Promise<boolean> => {
    try {
      const status = await emailProviderService.getConnectionStatus(provider);
      return status.connected;
    } catch (error) {
      console.error('Error checking provider connection:', error);
      return false;
    }
  },
  
  // Validate connection and get details
  validateConnection: async (provider: string = 'google'): Promise<{
    connected: boolean;
    valid: boolean;
    email?: string;
    expiresSoon?: boolean;
  }> => {
    try {
      const status = await emailProviderService.getConnectionStatus(provider);
      
      if (!status.connected) {
        return { connected: false, valid: false };
      }
      
      // Check if token expires in less than 24 hours
      let expiresSoon = false;
      if (status.expires_at) {
        const expiresAt = new Date(status.expires_at);
        const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        expiresSoon = expiresAt < twentyFourHoursFromNow;
      }
      
      return {
        connected: true,
        valid: true,
        email: status.provider_email || undefined,
        expiresSoon
      };
    } catch (error) {
      console.error('Error validating connection:', error);
      return { connected: false, valid: false };
    }
  }
};

export default emailProviderService;