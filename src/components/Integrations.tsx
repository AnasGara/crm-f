import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Settings, Globe, Calendar, Mail, Database, Zap, ExternalLink } from 'lucide-react';
import emailProviderService, { ConnectionStatus } from '../services/emailProviderService';
import { useLocation, useNavigate } from 'react-router-dom';

interface Integration {
  id: number;
  name: string;
  description: string;
  category: 'calendar' | 'email' | 'website' | 'database' | 'automation' | 'communication';
  status: 'connected' | 'available' | 'error';
  icon: string;
  features: string[];
  lastSync?: string;
  setupUrl?: string;
}

const Integrations: React.FC = () => {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Initial connection status check
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  useEffect(() => {
    // Check for success/error in URL params
    const params = new URLSearchParams(location.search);
    const connected = params.get('connected');
    const provider = params.get('provider');
    const message = params.get('message');

    if (connected === 'success' && provider === 'google') {
      // Show success message
      // alert('Successfully connected Google account!');
      
      // Re-check connection status after successful connection
      checkConnectionStatus();
      
      // Clear the URL parameters
      navigate('/integrations', { replace: true });
      
    } else if (connected === 'error') {
      // Show error message
      // alert('Failed to connect: ' + decodeURIComponent(message || 'Unknown error'));
      
      // Re-check connection status
      checkConnectionStatus();
      
      // Clear the URL parameters
      navigate('/integrations', { replace: true });
    }
  }, [location, navigate]);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const status = await emailProviderService.getConnectionStatus('google');
      console.log('Connection status received:', status); // Debug log
      setConnectionStatus(status);
      setIsGoogleConnected(status.connected);
      setInitialCheckDone(true);
    } catch (error) {
      console.error('Failed to get connection status:', error);
      setIsGoogleConnected(false);
      setConnectionStatus(null);
    } finally {
      setLoading(false);
    }
  };
  
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 2,
      name: 'Gmail Integration',
      description: 'Send emails directly from CRM and track email interactions',
      category: 'email',
      status: 'available',
      icon: '📧',
      features: ['Email sending', 'Template management', 'Auto-logging'],
    }
  ]);

  // Update integration status based on connection
  useEffect(() => {
    setIntegrations(prevIntegrations =>
      prevIntegrations.map(integration =>
        integration.id === 2
          ? { 
              ...integration, 
              status: isGoogleConnected ? 'connected' : 'available',
              lastSync: isGoogleConnected ? new Date().toISOString() : undefined
            }
          : integration
      )
    );
  }, [isGoogleConnected]);

  const handleConnectGoogle = async () => {
    setLoading(true);
    try {
      const response = await emailProviderService.connectEmailProvider('google');
      if (response && response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Failed to get Google OAuth URL:', error);
      // alert('Failed to connect to Google OAuth. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Are you sure you want to disconnect from Google OAuth? This will revoke access to your Gmail account.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await emailProviderService.disconnectEmailProvider('google');
      if (response.success) {
        // alert('Successfully disconnected from Google OAuth!');
        await checkConnectionStatus(); // Re-check status after disconnect
      } else {
        // alert('Failed to disconnect: ' + response.message);
        await checkConnectionStatus(); // Still re-check status
      }
    } catch (error) {
      console.error('Failed to disconnect email provider:', error);
      // alert('Failed to disconnect from Google OAuth. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debug function to manually check connection
  const handleDebugCheck = async () => {
    console.log('Manual connection check...');
    await checkConnectionStatus();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'calendar':
        return <Calendar size={20} className="text-blue-600" />;
      case 'email':
        return <Mail size={20} className="text-green-600" />;
      case 'website':
        return <Globe size={20} className="text-purple-600" />;
      case 'database':
        return <Database size={20} className="text-orange-600" />;
      case 'automation':
        return <Zap size={20} className="text-yellow-600" />;
      case 'communication':
        return <Settings size={20} className="text-pink-600" />;
      default:
        return <Settings size={20} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'available':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check size={16} className="text-green-600" />;
      case 'available':
        return <Plus size={16} className="text-blue-600" />;
      case 'error':
        return <X size={16} className="text-red-600" />;
      default:
        return <Settings size={16} className="text-gray-600" />;
    }
  };

  const categories = [
    { id: 'all', name: 'All Integrations', count: integrations.length },
    { id: 'email', name: 'Email', count: integrations.filter(i => i.category === 'email').length },
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(integration => integration.category === selectedCategory);

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const availableCount = integrations.filter(i => i.status === 'available').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Integrations</h3>
          <p className="text-sm text-gray-600">Connect GDPilia with your favorite tools and services</p>
        </div>
        
        {/* Debug button - remove in production
        <button 
          onClick={handleDebugCheck}
          className="text-xs text-gray-500 hover:text-gray-700"
          title="Debug: Check connection status"
        >
          Debug Status
        </button> */}
      </div>

      {/* Connection Status Debug Info 
      {process.env.NODE_ENV === 'development' && connectionStatus && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
          <div className="font-medium">Debug Info:</div>
          <div>Connected: {connectionStatus.connected ? 'Yes' : 'No'}</div>
          <div>Email: {connectionStatus.provider_email || 'Not available'}</div>
          <div>Initial Check: {initialCheckDone ? 'Done' : 'Pending'}</div>
        </div>
      )}*/}

      {/* Rest of your component remains the same... */}
      {/* Integration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Integrations</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{integrations.length}</p>
            </div>
            <div className="bg-blue-500 rounded-lg p-3">
              <Settings size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Connected</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{connectedCount}</p>
            </div>
            <div className="bg-green-500 rounded-lg p-3">
              <Check size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{availableCount}</p>
            </div>
            <div className="bg-blue-500 rounded-lg p-3">
              <Plus size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Issues</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{errorCount}</p>
            </div>
            <div className="bg-red-500 rounded-lg p-3">
              <X size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <div key={integration.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    {getCategoryIcon(integration.category)}
                    <span className="text-sm text-gray-600 capitalize">{integration.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(integration.status)}`}>
                  {getStatusIcon(integration.status)}
                  <span className="capitalize">{integration.status}</span>
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

            <div className="space-y-2 mb-4">
              <h5 className="text-sm font-medium text-gray-900">Features:</h5>
              <ul className="space-y-1">
                {integration.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {integration.lastSync && (
              <div className="text-xs text-gray-500 mb-4">
                Last sync: {new Date(integration.lastSync).toLocaleString()}
              </div>
            )}

            {/* Fixed: Always show connection info if we have it */}
            {connectionStatus && connectionStatus.connected && integration.id === 2 && (
              <div className="text-xs text-blue-600 mb-4">
                Connected as: {connectionStatus.provider_email || 'user'}
              </div>
            )}

            {/* Also show when we know it's not connected */}
            {connectionStatus && !connectionStatus.connected && integration.id === 2 && (
              <div className="text-xs text-gray-500 mb-4">
                Not connected
              </div>
            )}

            <div className="flex items-center justify-between">
              {integration.id === 2 ? (
                isGoogleConnected ? (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleDisconnectGoogle}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleConnectGoogle}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Plus size={16} />
                    <span>{loading ? 'Connecting...' : 'Connect'}</span>
                  </button>
                )
              ) : integration.status === 'connected' ? (
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Configure
                  </button>
                  <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                    Disconnect
                  </button>
                </div>
              ) : integration.status === 'available' ? (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2">
                  <Plus size={16} />
                  <span>Connect</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                    Fix Issue
                  </button>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Retry
                  </button>
                </div>
              )}
              
              {integration.setupUrl && (
                <a
                  href={integration.setupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <Settings size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations found</h3>
          <p className="text-gray-600">Try selecting a different category or request a new integration.</p>
        </div>
      )}
    </div>
  );
};

export default Integrations;