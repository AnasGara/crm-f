import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { updateCampaign } from '../services/campaigns';
import leadService, { Lead } from '../services/leadsService'; // Import leadService and Lead interface

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

const UpdateCampaignModal: React.FC<UpdateCampaignModalProps> = ({ isOpen, onClose, campaign, onCampaignUpdate }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<AudienceMember[]>([]);
  const [scheduleTime, setScheduleTime] = useState('');
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch all leads for the organization
    const fetchLeads = async () => {
      try {
        const leads = await leadService.getLeads();
        setAllLeads(leads);
      } catch (error) {
        console.error('Failed to fetch leads', error);
      }
    };
    fetchLeads();
  }, []);

  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setSubject(campaign.subject);
      setContent(campaign.content);
      setAudience(campaign.audience);
      // Format the schedule_time for the datetime-local input
      if (campaign.schedule_time) {
        const date = new Date(campaign.schedule_time);
        // Format to YYYY-MM-DDTHH:mm
        const formattedDate = date.toISOString().slice(0, 16);
        setScheduleTime(formattedDate);
      } else {
        setScheduleTime('');
      }
    }
  }, [campaign]);

  const handleAudienceChange = (selectedOptions: any) => {
    const newAudience = selectedOptions ? selectedOptions.map((option: LeadOption) => ({
      id: option.value,
      email: option.email,
      name: option.label.split(' (')[0]
    })) : [];
    setAudience(newAudience);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;

    setIsSaving(true);
    // Format the schedule time to 'YYYY-MM-DD HH:mm:ss'
    const formattedScheduleTime = scheduleTime ? new Date(scheduleTime).toISOString().replace('T', ' ').substring(0, 19) : undefined;

    const updatedData = {
      name,
      subject,
      content,
      audience: audience.map(({ id, email, name }) => ({ id, email, name })),
      schedule_time: formattedScheduleTime
    };

    try {
      const response = await updateCampaign(campaign.id, updatedData);
      if (response.success) {
        onCampaignUpdate(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Failed to update campaign', error);
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Update Campaign</h3>
          <form onSubmit={handleSubmit} className="mt-2 px-7 py-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-3 px-3 py-2 text-gray-700 bg-white border rounded-md w-full"
              placeholder="Campaign Name"
            />
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mb-3 px-3 py-2 text-gray-700 bg-white border rounded-md w-full"
              placeholder="Subject"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mb-3 px-3 py-2 text-gray-700 bg-white border rounded-md w-full"
              placeholder="Campaign Content"
              rows={6}
            />
            <Select
              isMulti
              options={leadOptions}
              value={selectedLeadOptions}
              onChange={handleAudienceChange}
              className="mb-3 text-gray-700 bg-white rounded-md w-full"
              placeholder="Select leads..."
            />
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="mb-3 px-3 py-2 text-gray-700 bg-white border rounded-md w-full"
            />
            <div className="items-center px-4 py-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="mt-3 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateCampaignModal;