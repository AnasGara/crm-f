// services/tokenService.ts
import emailProviderService from './emailProviderService';

interface TokenStatus {
  isRefreshing: boolean;
  lastRefresh: number | null;
  refreshAttempts: number;
}

class TokenRefreshService {
  private status: TokenStatus = {
    isRefreshing: false,
    lastRefresh: null,
    refreshAttempts: 0,
  };

  private refreshInterval: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private refreshCooldown = 5 * 60 * 1000; // 5 minutes cooldown after refresh

  /**
   * Initialize token refresh on app load
   */
  async initialize(): Promise<void> {
    console.log('TokenRefreshService: Initializing...');
    
    try {
      // Initial token check on app load
      await this.checkAndRefreshToken();
      
      // Set up periodic checks
      this.setupPeriodicRefresh();
      
      // Also check when app comes back from background (visibility change)
      this.setupVisibilityChangeListener();
      
      console.log('TokenRefreshService: Initialized successfully');
    } catch (error) {
      console.error('TokenRefreshService: Initialization failed:', error);
    }
  }

  /**
   * Check token status and refresh if needed
   */
  async checkAndRefreshToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.status.isRefreshing) {
      console.log('TokenRefreshService: Refresh already in progress');
      return false;
    }

    // Check if we recently refreshed (cooldown period)
    if (this.status.lastRefresh && 
        Date.now() - this.status.lastRefresh < this.refreshCooldown) {
      console.log('TokenRefreshService: Recently refreshed, skipping');
      return true;
    }

    // Check retry limit
    if (this.status.refreshAttempts >= this.maxRetries) {
      console.warn('TokenRefreshService: Max refresh attempts reached');
      return false;
    }

    this.status.isRefreshing = true;
    
    try {
      console.log('TokenRefreshService: Checking token status...');
      
      // First, check if we have a valid connection
      const status = await emailProviderService.validateConnection('google');
      
      console.log('TokenRefreshService: Connection status:', status);
      
      // If not connected, no need to refresh
      if (!status.connected) {
        console.log('TokenRefreshService: Google email provider is not connected');
        this.status.refreshAttempts = 0;
        this.status.isRefreshing = false;
        return false;
      }

      // Check if token needs refresh
      const needsRefresh = !status.valid || status.expiresSoon;
      
      if (needsRefresh) {
        console.log('TokenRefreshService: Token needs refresh. Refreshing...');
        
        // Try to refresh the token
        const result = await emailProviderService.refreshToken();
        
        if (result.success) {
          console.log('TokenRefreshService: Token refreshed successfully');
          this.status.lastRefresh = Date.now();
          this.status.refreshAttempts = 0;
          
          // Notify other parts of the app if needed
          this.notifyTokenRefreshed();
        } else {
          console.warn('TokenRefreshService: Token refresh failed:', result.message);
          this.status.refreshAttempts++;
          
          // If refresh fails consistently, consider disconnecting
          if (this.status.refreshAttempts >= this.maxRetries) {
            console.error('TokenRefreshService: Max refresh failures reached');
            this.handleRefreshFailure();
          }
        }
        
        return result.success;
      } else {
        console.log('TokenRefreshService: Token is still valid');
        this.status.refreshAttempts = 0;
        return true;
      }
    } catch (error) {
      console.error('TokenRefreshService: Error checking/refreshing token:', error);
      this.status.refreshAttempts++;
      return false;
    } finally {
      this.status.isRefreshing = false;
    }
  }

  /**
   * Set up periodic token checks (every 30 minutes)
   */
  private setupPeriodicRefresh(): void {
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Check every 30 minutes
    this.refreshInterval = setInterval(() => {
      console.log('TokenRefreshService: Periodic check triggered');
      this.checkAndRefreshToken();
    }, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Listen for app visibility changes (tab focus/blur)
   */
  private setupVisibilityChangeListener(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // App came back to foreground
          console.log('TokenRefreshService: App came to foreground');
          this.checkAndRefreshToken();
        }
      });
    }
  }

  /**
   * Handle refresh failure (e.g., disconnect or show notification)
   */
  private handleRefreshFailure(): void {
    console.error('TokenRefreshService: Handling refresh failure');
    
    // You could:
    // 1. Show a notification to the user
    // 2. Disconnect the email provider
    // 3. Trigger a re-authentication flow
    
    // Example: Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Google Connection Issue', {
        body: 'Your Google email connection needs attention. Please check your connection settings.',
        icon: '/icon.png'
      });
    }
    
    // Dispatch a custom event that other components can listen to
    const event = new CustomEvent('token-refresh-failed', {
      detail: { provider: 'google', attempts: this.status.refreshAttempts }
    });
    window.dispatchEvent(event);
  }

  /**
   * Notify other parts of the app about successful refresh
   */
  private notifyTokenRefreshed(): void {
    const event = new CustomEvent('token-refreshed', {
      detail: { provider: 'google', timestamp: new Date().toISOString() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Manual refresh trigger
   */
  async forceRefresh(): Promise<void> {
    console.log('TokenRefreshService: Force refresh requested');
    await this.checkAndRefreshToken();
  }

  /**
   * Get current refresh status
   */
  getStatus(): TokenStatus {
    return { ...this.status };
  }

  /**
   * Clean up on app unmount
   */
  cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', () => {});
    }
    
    console.log('TokenRefreshService: Cleaned up');
  }
}

// Create singleton instance
export const tokenRefreshService = new TokenRefreshService();