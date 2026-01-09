// components/TokenStatusIndicator.tsx
import React from 'react';
import { useTokenRefresh } from '../hooks/useTokenRefresh';

const TokenStatusIndicator: React.FC = () => {
  const { isChecking, lastRefresh, error } = useTokenRefresh();
  
  const getStatusColor = () => {
    if (error) return 'bg-red-100 text-red-800';
    if (isChecking) return 'bg-blue-100 text-blue-800';
    if (lastRefresh) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  const getStatusText = () => {
    if (error) return 'Connection Issue';
    if (isChecking) return 'Checking...';
    if (lastRefresh) {
      const minutesAgo = Math.floor((Date.now() - lastRefresh) / 60000);
      return `Refreshed ${minutesAgo} min ago`;
    }
    return 'Not checked';
  };
  
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
      <span className="mr-1">•</span>
      {getStatusText()}
    </div>
  );
};

export default TokenStatusIndicator;