import React, { useState, useEffect } from 'react';
import { updateCampaign } from '../services/campaigns';

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

const UpdateCampaignModal: React.FC<UpdateCampaignModalProps> = ({ isOpen, onClose, campaign, onCampaignUpdate }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<AudienceMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setSubject(campaign.subject);
      setContent(campaign.content);
      setAudience(campaign.audience);
    }
  }, [campaign]);

  const handleAudienceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const emails = e.target.value.split(',').map(email => email.trim());
    const newAudience = emails.map((email, index) => ({
      id: index,
      email: email,
      name: ''
    }));
    setAudience(newAudience);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;

    setIsSaving(true);
    const updatedData = { name, subject, content, audience };

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
            <textarea
              value={audience.map(member => member.email).join(', ')}
              onChange={handleAudienceChange}
              className="mb-3 px-3 py-2 text-gray-700 bg-white border rounded-md w-full"
              placeholder="Audience (comma-separated emails)"
              rows={4}
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