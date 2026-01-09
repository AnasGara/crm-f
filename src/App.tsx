// App.tsx (updated)
import React, { useState, useEffect, useCallback } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './contexts/AuthContext';
import { useTokenRefresh } from './hooks/useTokenRefresh'; // Import the hook
import { tokenRefreshService } from './services/tokenService'; // Import the service
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Contacts from './components/Contacts';
import Leads from './components/Leads';
import Opportunities from './components/Opportunities';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import Email from './components/Email';
import Analytics from './components/Analytics';
import Integrations from './components/Integrations';
import Settings from './components/Settings';
import JoinOrganization from './components/JoinOrganization';
import OrganizationManagement from './components/OrganizationManagement';
import CampaignDetails from './components/CampaignDetails';
import { Toaster } from 'react-hot-toast';
import GoogleCallback from './components/GoogleCallback';

export type View = 'dashboard' | 'contacts' | 'leads' | 'opportunities' | 'tasks' | 'calendar' | 'email' | 'analytics' | 'integrations' | 'settings' | 'join-organization' | 'organization-management' | 'google-callback' | 'campaign-details';

function App() {
  console.log('App component rendering');
  
  // Auth context
  const auth = useAuth();
  
  // Token refresh hook
  const tokenRefresh = useTokenRefresh();
  
  // Local state
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTokenWarning, setShowTokenWarning] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    auth.checkAuthStatusOnAppLoad();
  }, []);

  // Initialize token refresh when authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      console.log('App: User authenticated, initializing token refresh...');
      
      // Initialize token refresh service
      tokenRefreshService.initialize();
      
      // Also do an immediate check
      tokenRefresh.checkToken();
      
      // Clean up on unmount
      return () => {
        tokenRefreshService.cleanup();
      };
    }
  }, [auth.isAuthenticated, tokenRefresh.checkToken]);

  // Listen for token refresh failures and show warnings
  useEffect(() => {
    const handleTokenRefreshFailed = () => {
      setShowTokenWarning(true);
    };

    window.addEventListener('token-refresh-failed', handleTokenRefreshFailed as EventListener);

    return () => {
      window.removeEventListener('token-refresh-failed', handleTokenRefreshFailed as EventListener);
    };
  }, []);

  // Effect to handle post-authentication actions
  useEffect(() => {
    if (auth.isAuthenticated) {
      if (auth.currentUser && auth.currentUser.first_time_login === 1) {
        console.log('First time login detected for user:', auth.currentUser.name);
        // Optional: Redirect to onboarding or show welcome
      }
    }
  }, [auth.isAuthenticated, auth.currentUser]);

  const handleLogout = async () => {
    await auth.logout();
    setActiveView('dashboard');
    setSearchTerm('');
    
    // Clean up token refresh on logout
    tokenRefreshService.cleanup();
  };

  const handleDismissTokenWarning = () => {
    setShowTokenWarning(false);
  };

  const handleFixTokenIssue = () => {
    // Redirect to email settings or integrations page
    setActiveView('integrations');
    setShowTokenWarning(false);
  };

  const handleViewCampaignDetails = (id: number) => {
    setSelectedCampaignId(id);
    setActiveView('campaign-details');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'contacts':
        return <Contacts searchTerm={searchTerm} />;
      case 'leads':
        return <Leads />;
      case 'opportunities':
        return <Opportunities searchTerm={searchTerm} />;
      case 'tasks':
        return <Tasks searchTerm={searchTerm} />;
      case 'calendar':
        return <Calendar searchTerm={searchTerm} />;
      case 'email':
        return <Email onViewCampaignDetails={handleViewCampaignDetails} />;
      case 'campaign-details':
        return <CampaignDetails campaignId={selectedCampaignId} />;
      case 'analytics':
        return <Analytics />;
      case 'integrations':
        return <Integrations />;
      case 'settings':
        return <Settings />;
      case 'join-organization':
        return <JoinOrganization searchTerm={searchTerm} />;
      case 'organization-management':
        return <OrganizationManagement />;
      case 'google-callback':
        return <GoogleCallback />;
      default:
        return <Dashboard />;
    }
  };

  // Show loading spinner while checking authentication
  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <LanguageProvider>
        <LandingPage onLogin={auth.login} />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <OrganizationProvider>
        <NotificationProvider>
          <Toaster position="bottom-right" />
          <div className="min-h-screen bg-mesh flex">
            <Sidebar activeView={activeView} onViewChange={setActiveView} />
            <div className="flex-1 flex flex-col lg:ml-0">
              {/* Token Warning Banner 
              {showTokenWarning && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-yellow-700">
                        Your Google email connection needs attention. Some features may not work properly.
                      </p>
                      <div className="mt-2">
                        <div className="-mx-2 -my-1.5 flex">
                          <button
                            onClick={handleFixTokenIssue}
                            className="px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600"
                          >
                            Fix Connection
                          </button>
                          <button
                            onClick={handleDismissTokenWarning}
                            className="ml-3 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}*/}
              
              <Header
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                activeView={activeView}
                onViewChange={setActiveView}
                onLogout={handleLogout}
              />
              
              {/* Optional: Show token refresh status in header */}
              {tokenRefresh.isChecking && (
                <div className="px-4 py-1 bg-blue-50 text-blue-700 text-sm flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking email connection...
                </div>
              )}
              
              <main className="flex-1 overflow-auto p-4 lg:p-6">
                <div className="max-w-7xl mx-auto">
                  {renderContent()}
                </div>
              </main>
            </div>
          </div>
        </NotificationProvider>
      </OrganizationProvider>
    </LanguageProvider>
  );
}

export default App;