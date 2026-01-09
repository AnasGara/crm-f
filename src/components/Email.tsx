import React, { useState, useEffect } from 'react';
import { Plus, Mail, Send, Users, Eye, BarChart3, Calendar, Edit, Trash2, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import CreateCampaignWizard from './CreateCampaignWizard';
import { getCampaigns } from '../services/campaigns';
import { getScheduledEmails } from '../services/scheduledEmails';

// Interfaces based on the API documentation
interface Sender {
  id: number;
  name: string;
  email: string;
}

interface Campaign {
  id: number;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  sent_count: number;
  failed_count: number;
  total_count: number;
  schedule: string;
  schedule_time: string;
  completed_at: string | null;
  sender: Sender;
}

interface ScheduledEmail {
  id: number;
  campaign_id: number | null;
  to_email: string;
  subject: string;
  status: 'pending' | 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';
  scheduled_for: string;
  user: {
    id: number;
    name: string;
  };
  campaign: {
    id: number;
    name: string;
  } | null;
}

interface EmailProps {
  onViewCampaignDetails: (id: number) => void;
}

interface PaginatedTableProps {
  title: string;
  data: Campaign[] | ScheduledEmail[];
  columns: Array<{
    key: string;
    label: string;
    render: (item: any) => React.ReactNode;
  }>;
  itemsPerPage?: number;
}

const PaginatedTable: React.FC<PaginatedTableProps> = ({ 
  title, 
  data, 
  columns,
  itemsPerPage = 5 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // Filter data based on search term
  const filteredData = data.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-semibold text-gray-800">{title}</h4>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length > 0 ? (
                currentData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={`${item.id}-${column.key}`} className="px-6 py-4 whitespace-nowrap">
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No results found' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredData.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(endIndex, filteredData.length)}
              </span>{' '}
              of <span className="font-medium">{filteredData.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronLeft size={20} />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Email: React.FC<EmailProps> = ({ onViewCampaignDetails }) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [singleEmails, setSingleEmails] = useState<ScheduledEmail[]>([]);
  const [campaignsToBeSent, setCampaignsToBeSent] = useState<Campaign[]>([]);
  const [campaignHistory, setCampaignHistory] = useState<Campaign[]>([]);
  const [cancelledCampaigns, setCancelledCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmailData = async () => {
    try {
      setLoading(true);

      // Fetch single emails
      const scheduledEmailsResponse = await getScheduledEmails({ status: 'scheduled' });
      const allScheduledEmails = scheduledEmailsResponse?.data || [];
      setSingleEmails(allScheduledEmails.filter((email: ScheduledEmail) => !email.campaign_id));

      // Fetch campaigns with status "scheduled" for "Campaigns to be Sent" section
      const scheduledCampaignsResponse = await getCampaigns({ status: 'scheduled' });
      if (scheduledCampaignsResponse && scheduledCampaignsResponse.data) {
        // Filter to ensure only campaigns with status "scheduled" are included
        const scheduledCampaigns = scheduledCampaignsResponse.data.filter(
          (campaign: Campaign) => campaign.status === 'scheduled'
        );
        setCampaignsToBeSent(scheduledCampaigns);
      }
      
      // Fetch campaigns with status "completed" for "History" section
      const completedCampaignsResponse = await getCampaigns({ status: 'completed' });
      if (completedCampaignsResponse && completedCampaignsResponse.data) {
        // Filter to ensure only campaigns with status "completed" are included
        const completedCampaigns = completedCampaignsResponse.data.filter(
          (campaign: Campaign) => campaign.status === 'completed'
        );
        setCampaignHistory(completedCampaigns);
      }
      
      // Fetch campaigns with status "cancelled" for "Cancelled Campaigns" section
      const cancelledCampaignsResponse = await getCampaigns({ status: 'cancelled' });
      if (cancelledCampaignsResponse && cancelledCampaignsResponse.data) {
        // Filter to ensure only campaigns with status "cancelled" are included
        const cancelledCampaigns = cancelledCampaignsResponse.data.filter(
          (campaign: Campaign) => campaign.status === 'cancelled'
        );
        setCancelledCampaigns(cancelledCampaigns);
      }
      
    } catch (err) {
      setError('Failed to fetch email data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailData();
  }, []);

  const handleWizardClose = (campaignSent?: boolean) => {
    setIsWizardOpen(false);
    if (campaignSent) {
      fetchEmailData();
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'cancelled':
        return <XCircle size={16} className="inline mr-1" />;
      case 'completed':
      case 'sent':
        return <Send size={16} className="inline mr-1" />;
      case 'scheduled':
        return <Calendar size={16} className="inline mr-1" />;
      default:
        return null;
    }
  };

  // Campaign columns configuration
  const campaignColumns = [
    {
      key: 'name',
      label: 'Campaign Name',
      render: (campaign: Campaign) => (
        <div>
          <p className="font-medium text-gray-900">{campaign.name}</p>
          <p className="text-sm text-gray-500">{campaign.subject}</p>
        </div>
      ),
    },
    {
      key: 'recipients',
      label: 'Recipients',
      render: (campaign: Campaign) => (
        <div className="text-sm text-gray-600">
          <Users size={14} className="inline mr-1" /> {campaign.total_count} total
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (campaign: Campaign) => (
        <div className="text-right">
          <p className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
            {getStatusIcon(campaign.status)}
            {campaign.status}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {campaign.schedule_time ? new Date(campaign.schedule_time).toLocaleString() : 'No schedule'}
          </p>
        </div>
      ),
    },
    {
      key: 'metrics',
      label: 'Metrics',
      render: (campaign: Campaign) => (
        <div className="text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span className="text-green-600">
              <Send size={14} className="inline mr-1" /> {campaign.sent_count} sent
            </span>
            {campaign.failed_count > 0 && (
              <span className="text-red-500">
                <Send size={14} className="inline mr-1" /> {campaign.failed_count} failed
              </span>
            )}
          </div>
          {campaign.completed_at && (
            <p className="text-xs text-gray-500 mt-1">
              Completed: {new Date(campaign.completed_at).toLocaleDateString()}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (campaign: Campaign) => (
        <div className="flex space-x-2">
          <button
            onClick={() => onViewCampaignDetails(campaign.id)}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
          >
            View Details
          </button>
          {campaign.status === 'cancelled' && (
            <button
              className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors"
              title="Restore or Reschedule"
            >
              <Calendar size={16} className="inline" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Single emails columns configuration
  const singleEmailColumns = [
    {
      key: 'recipient',
      label: 'Recipient',
      render: (email: ScheduledEmail) => (
        <div>
          <p className="font-medium text-gray-900">{email.to_email}</p>
          <p className="text-sm text-gray-500">{email.user.name}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (email: ScheduledEmail) => (
        <div className="text-sm text-gray-600">
          {email.subject}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (email: ScheduledEmail) => (
        <div className="text-right">
          <p className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
            {getStatusIcon(email.status)}
            {email.status}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Scheduled: {new Date(email.scheduled_for).toLocaleString()}
          </p>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (email: ScheduledEmail) => (
        <div className="flex space-x-2">
          <button
            onClick={() => email.campaign_id && onViewCampaignDetails(email.campaign_id)}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
            disabled={!email.campaign_id}
          >
            {email.campaign_id ? 'View Campaign' : 'No Campaign'}
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Email Campaigns</h3>
          <p className="text-sm text-gray-600">Create and manage your email marketing campaigns</p>
        </div>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Campaign</span>
        </button>
      </div>

      <CreateCampaignWizard isOpen={isWizardOpen} onClose={handleWizardClose} />

      {/* Section 1: Single Emails */}
      {singleEmails.length > 0 && (
        <PaginatedTable
          title="Single Emails"
          data={singleEmails}
          columns={singleEmailColumns}
          itemsPerPage={5}
        />
      )}

      {/* Section 2: Campaigns to be Sent */}
      <PaginatedTable
        title="Campaigns to be Sent"
        data={campaignsToBeSent}
        columns={campaignColumns}
        itemsPerPage={5}
      />

      {/* Section 3: Campaign History */}
      <PaginatedTable
        title="Campaign History"
        data={campaignHistory}
        columns={campaignColumns}
        itemsPerPage={5}
      />

      {/* Section 4: Cancelled Campaigns */}
      <PaginatedTable
        title="Cancelled Campaigns"
        data={cancelledCampaigns}
        columns={campaignColumns}
        itemsPerPage={5}
      />
    </div>
  );
};

export default Email;