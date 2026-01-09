import React, { useState, useEffect } from 'react';
import { getCampaignDetails, cancelCampaign } from '../services/campaigns';
import UpdateCampaignModal from './UpdateCampaignModal';
import toast from 'react-hot-toast';

// Interfaces based on the API documentation
interface Sender {
  id: number;
  name: string;
  email: string;
}

interface AudienceMember {
  id: number;
  email: string;
  name: string;
  company: string;
}

interface ScheduledEmailForDetails {
  id: number;
  to_email: string;
  subject: string;
  status: 'pending' | 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';
  scheduled_for: string;
  user: {
    id: number;
    name: string;
  };
}

interface CampaignDetailsData {
  id: number;
  name: string;
  subject: string;
  audience: AudienceMember[];
  content: string;
  status: 'draft' | 'scheduled' | 'sending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  sent_count: number;
  failed_count: number;
  total_count: number;
  schedule_time: string;
  sender: Sender;
  scheduled_emails: ScheduledEmailForDetails[];
}

interface CampaignStatistics {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  cancelled: number;
}

interface CampaignDetailsProps {
  campaignId: number | null;
  onCampaignUpdated?: () => void; // Add this prop to refresh parent data
}

const CampaignDetails: React.FC<CampaignDetailsProps> = ({ campaignId, onCampaignUpdated }) => {
  const [campaign, setCampaign] = useState<CampaignDetailsData | null>(null);
  const [statistics, setStatistics] = useState<CampaignStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const fetchCampaignDetails = async () => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      const response = await getCampaignDetails(campaignId);
      if (response && response.campaign) {
        setCampaign(response.campaign);
        setStatistics(response.statistics);
      } else {
        setError('Campaign not found.');
      }
    } catch (err) {
      setError('Failed to fetch campaign details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCampaign = async () => {
    if (campaign && window.confirm('Are you sure you want to cancel this campaign?')) {
      setIsCancelling(true);
      try {
        const response = await cancelCampaign(campaign.id);
        if (response.success) {
          setCampaign(response.data.campaign);
          // Show success popup
          setShowSuccessPopup(true);
          // Auto-hide the popup after 3 seconds
          setTimeout(() => {
            setShowSuccessPopup(false);
          }, 3000);
          
          // Notify parent to refresh if needed
          if (onCampaignUpdated) {
            onCampaignUpdated();
          }
        }
      } catch (err) {
        console.error('Failed to cancel campaign', err);
        toast.error('Failed to cancel campaign');
      } finally {
        setIsCancelling(false);
      }
    }
  };

  const handleCampaignUpdate = (updatedCampaign: CampaignDetailsData) => {
    // Update the local state with the new campaign data
    setCampaign(updatedCampaign);
    
    // REMOVED: Don't show toast here, it's already shown in the modal
    // toast.success('Campaign updated successfully!');
    
    // Fetch fresh data to ensure everything is in sync
    fetchCampaignDetails();
    
    // Notify parent to refresh if needed
    if (onCampaignUpdated) {
      onCampaignUpdated();
    }
  };

  useEffect(() => {
    fetchCampaignDetails();
  }, [campaignId]);

  if (loading) {
    return <div>Loading campaign details...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!campaign) {
    return <div>No campaign data available.</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Determine if cancel button should be disabled
  const isCancelDisabled = campaign.status === 'completed' || 
                          campaign.status === 'cancelled' || 
                          isCancelling;
  const isUpdateVisible = campaign.status === 'draft' || campaign.status === 'scheduled';

  return (
    <div className="p-6 relative">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Campaign cancelled successfully!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
          <p className="text-sm text-gray-600">{campaign.subject}</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
            {campaign.status}
          </span>
          {isUpdateVisible && (
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Campaign
            </button>
          )}
          <button
            onClick={handleCancelCampaign}
            disabled={isCancelDisabled}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isCancelDisabled 
                ? 'bg-red-300 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Campaign'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold">{statistics.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
            <p className="text-sm text-gray-600">Sent</p>
            <p className="text-2xl font-bold text-green-600">{statistics.sent}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-2xl font-bold text-red-600">{statistics.failed}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-2xl font-bold text-gray-600">{statistics.cancelled}</p>
          </div>
        </div>
      )}

      {/* Campaign Details & Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-sm border">
          <h4 className="font-semibold mb-2">Content</h4>
          <div dangerouslySetInnerHTML={{ __html: campaign.content }} className="prose max-w-none" />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h4 className="font-semibold mb-2">Details</h4>
          <ul className="space-y-2 text-sm">
            <li><strong>Sender:</strong> {campaign.sender.name} ({campaign.sender.email})</li>
            <li><strong>Scheduled for:</strong> {new Date(campaign.schedule_time).toLocaleString()}</li>
            <li><strong>Audience size:</strong> {campaign.total_count}</li>
          </ul>
        </div>
      </div>

      {/* Scheduled Emails List */}
      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-4">Scheduled Emails ({campaign.scheduled_emails.length})</h4>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          {campaign.scheduled_emails.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {campaign.scheduled_emails.map((email) => (
                <li key={email.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{email.subject}</p>
                    <p className="text-sm text-gray-500">To: {email.to_email}</p>
                  </div>
                  <div className="text-right">
                    <p className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                      {email.status}
                    </p>
                    <p className="text-sm text-gray-500">{new Date(email.scheduled_for).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No scheduled emails found for this campaign.</p>
          )}
        </div>
      </div>

      {/* Audience List */}
      <div className="mt-8">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Audience ({campaign.audience.length})</h4>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          {campaign.audience.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {campaign.audience.map((member) => (
                <li key={member.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No audience members found for this campaign.</p>
          )}
        </div>
      </div>

      {/* Update Campaign Modal */}
      <UpdateCampaignModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        campaign={campaign}
        onCampaignUpdate={handleCampaignUpdate}
      />
    </div>
  );
};

export default CampaignDetails;