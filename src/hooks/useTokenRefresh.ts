// hooks/useTokenRefresh.ts
import { useEffect, useState, useCallback } from 'react';
import { tokenRefreshService } from '../services/tokenService';

export const useTokenRefresh = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkToken = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const result = await tokenRefreshService.checkAndRefreshToken();
      if (result) {
        setLastRefresh(Date.now());
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token refresh failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Listen for token refresh events
  useEffect(() => {
    const handleTokenRefreshed = () => {
      setLastRefresh(Date.now());
      setError(null);
    };

    const handleTokenRefreshFailed = (event: CustomEvent) => {
      setError(`Token refresh failed after ${event.detail.attempts} attempts`);
    };

    window.addEventListener('token-refreshed', handleTokenRefreshed as EventListener);
    window.addEventListener('token-refresh-failed', handleTokenRefreshFailed as EventListener);

    return () => {
      window.removeEventListener('token-refreshed', handleTokenRefreshed as EventListener);
      window.removeEventListener('token-refresh-failed', handleTokenRefreshFailed as EventListener);
    };
  }, []);

  return {
    checkToken,
    forceRefresh: () => tokenRefreshService.forceRefresh(),
    isChecking,
    lastRefresh,
    error,
    getStatus: () => tokenRefreshService.getStatus(),
  };
};