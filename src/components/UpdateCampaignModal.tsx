import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { updateCampaign } from '../services/campaigns';
import leadService, { Lead } from '../services/leadsService';
import { timezoneUtils } from '../utils/timezoneUtils';
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
  company?: string;
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
}

interface UpdateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignDetailsData | null;
  onCampaignUpdate: (updatedCampaign: CampaignDetailsData) => void;
}

// Option type for react-select
interface LeadOption {
  value: number;
  label: string;
  email: string;
}

// Updated ApiResponse interface to match the exact API response
interface ApiResponse {
  success: boolean;
  message: string;
  data: CampaignDetailsData;
  errors?: any;
}

const UpdateCampaignModal: React.FC<UpdateCampaignModalProps> = ({ isOpen, onClose, campaign, onCampaignUpdate }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<AudienceMember[]>([]);
  const [scheduleTime, setScheduleTime] = useState('');
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>('');
  const [scheduleError, setScheduleError] = useState<string>('');

  useEffect(() => {
    // Get user's timezone
    setUserTimezone(timezoneUtils.getUserTimezone());
  }, []);

  useEffect(() => {
    // Fetch all leads for the organization
    const fetchLeads = async () => {
      try {
        const leads = await leadService.getLeads();
        setAllLeads(leads);
      } catch (error) {
        console.error('Failed to fetch leads', error);
        toast.error('Failed to load leads');
      }
    };
    
    if (isOpen) {
      fetchLeads();
    }
  }, [isOpen]);

  useEffect(() => {
    if (campaign && isOpen) {
      setName(campaign.name);
      setSubject(campaign.subject);
      setContent(campaign.content);
      setAudience(campaign.audience);
      
      // Convert UTC schedule_time from backend to local datetime for input field
      if (campaign.schedule_time) {
        const localDateTime = timezoneUtils.UTCToLocalInput(campaign.schedule_time);
        setScheduleTime(localDateTime);
      } else {
        setScheduleTime('');
      }
      
      // Clear any existing errors
      setScheduleError('');
    }
  }, [campaign, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setSubject('');
      setContent('');
      setAudience([]);
      setScheduleTime('');
      setScheduleError('');
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleAudienceChange = (selectedOptions: any) => {
    const newAudience = selectedOptions ? selectedOptions.map((option: LeadOption) => ({
      id: option.value,
      email: option.email,
      name: option.label.split(' (')[0]
    })) : [];
    setAudience(newAudience);
  };

  // Validate schedule time
  const validateScheduleTime = (dateTime: string): boolean => {
    if (!dateTime) {
      setScheduleError('Schedule time is required');
      return false;
    }
    
    if (!timezoneUtils.isFutureDateTime(dateTime)) {
      setScheduleError('Please select a date and time in the future');
      return false;
    }
    
    setScheduleError('');
    return true;
  };

  const handleScheduleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateTime = e.target.value;
    setScheduleTime(newDateTime);
    
    // Validate on change (but only show error if not empty)
    if (newDateTime) {
      validateScheduleTime(newDateTime);
    } else {
      setScheduleError('');
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!campaign) return;

  // Validate schedule time if it's set
  if (scheduleTime && !validateScheduleTime(scheduleTime)) {
    toast.error(scheduleError || 'Invalid schedule time');
    return;
  }

  setIsSaving(true);

  // Convert local datetime to UTC for backend
  const utcScheduleTime = scheduleTime ? timezoneUtils.localToUTC(scheduleTime) : '';
  
  if (!utcScheduleTime && scheduleTime) {
    setScheduleError('Invalid date/time format');
    setIsSaving(false);
    toast.error('Invalid date/time format');
    return;
  }

  const updatedData = { 
    name, 
    subject, 
    content, 
    audience: audience.map(({ id, email, name }) => ({ id, email, name })), 
    schedule_time: utcScheduleTime 
  };

  try {
    console.log('Sending update request:', updatedData);
    
    // Try-catch to handle any errors from the API call
    const response = await updateCampaign(campaign.id, updatedData);
    console.log('Update response:', response);
    
    // Check if response is successful
    // Handle multiple possible response formats
    const isSuccess = (
      response.success === true || 
      (response.success === undefined && response.id !== undefined) ||
      (response.data && response.data.id === campaign.id)
    );
    
    if (isSuccess) {
      // Extract the campaign data from the response
      const campaignData = response.data || response;
      
      // Call the onCampaignUpdate callback with the updated campaign data
      onCampaignUpdate(campaignData);
      
      // Show success message
      toast.success(response.message || 'Campaign updated successfully!');
      
      // Close the modal
      onClose();
    } else {
      // Handle API errors
      console.error('Failed to update campaign - Response:', response);
      
      // Show specific error messages if available
      if (response && response.errors) {
        // Handle validation errors
        Object.entries(response.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            toast.error(`${field}: ${messages[0]}`);
          }
        });
      } else if (response && response.message) {
        toast.error(response.message || 'Failed to update campaign');
      } else {
        toast.error('Failed to update campaign: Unknown error');
      }
    }
  } catch (error: any) {
    console.error('Failed to update campaign - Catch error:', error);
    
    // Handle different error formats
    if (error.response?.data) {
      const errorData = error.response.data;
      console.error('Error response data:', errorData);
      
      if (errorData.errors) {
        Object.entries(errorData.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            toast.error(`${field}: ${messages[0]}`);
          }
        });
      } else if (errorData.message) {
        toast.error(errorData.message);
      } else {
        toast.error('Failed to update campaign');
      }
    } else if (error.message) {
      toast.error(error.message);
    } else if (error.success === false) {
      toast.error(error.message || 'Failed to update campaign');
    } else {
      toast.error('An unexpected error occurred');
    }
  } finally {
    setIsSaving(false);
  }
};

  if (!isOpen) return null;

  const leadOptions: LeadOption[] = allLeads.map(lead => ({
    value: lead.id,
    label: `${lead.full_name} (${lead.email})`,
    email: lead.email
  }));

  const selectedLeadOptions = audience.map(member => ({
    value: member.id,
    label: `${member.name} (${member.email})`,
    email: member.email
  }));

  // Get minimum datetime for input (current time + 1 minute)
  const minDateTime = timezoneUtils.getMinDateTime();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Update Campaign</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSaving}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Timezone info banner */}
          {userTimezone && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Your timezone:</span> {userTimezone}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Times are shown in your local timezone and automatically converted to UTC for the backend.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Campaign Name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Subject"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Campaign Content"
                rows={10}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audience
              </label>
              <Select
                isMulti
                options={leadOptions}
                value={selectedLeadOptions}
                onChange={handleAudienceChange}
                className="text-gray-700 rounded-md w-full"
                classNamePrefix="select"
                placeholder="Select leads..."
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Time (Your Local Time)
              </label>
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={handleScheduleTimeChange}
                min={minDateTime}
                className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {scheduleError && (
                <p className="mt-1 text-sm text-red-600">{scheduleError}</p>
              )}
              {scheduleTime && !scheduleError && (
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>
                    <span className="font-medium">Local:</span> {timezoneUtils.formatForDisplay(scheduleTime, false)}
                  </p>
                  <p>
                    <span className="font-medium">UTC:</span> {timezoneUtils.localToUTC(scheduleTime)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving || !!scheduleError}
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateCampaignModal;