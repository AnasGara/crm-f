
import React, { useState, useEffect } from 'react';
import { Lead, CreateLeadData, UpdateLeadData } from '../services/leadsService';

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: CreateLeadData | UpdateLeadData) => void;
  lead: Lead | null;
}

const LeadForm: React.FC<LeadFormProps> = ({ isOpen, onClose, onSave, lead }) => {
  const [formData, setFormData] = useState<CreateLeadData | UpdateLeadData>({
    full_name: '',
    email: '',
    position: '',
    company: '',
    location: '',
    profile_url: '',
    followers: 0,
    connections: 0,
    education: '',
    personal_message: '',
    message_length: 0,
    generated_at: '',
    total_leads: 0,
    comments: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData(lead);
    } else {
      setFormData({
        full_name: '',
        email: '',
        position: '',
        company: '',
        location: '',
        profile_url: '',
        followers: 0,
        connections: 0,
        education: '',
        personal_message: '',
        message_length: 0,
        generated_at: '',
        total_leads: 0,
        comments: '',
      });
    }
  }, [lead]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) {
    return null;
  }

return (
  <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50" id="my-modal">
    <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-gray-900">
            {lead ? 'Edit Lead' : 'Create Lead'}
          </h3>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(formData).filter(key =>key !== 'comments').map(key => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</label>
                  <input
                    type={typeof (formData as any)[key] === 'number' ? 'number' : 'text'}
                    name={key}
                    id={key}
                    value={(formData as any)[key]}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              ))}
            </div>
           
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700">Comments</label>
              <textarea
                name="comments"
                id="comments"
                value={(formData as any).comments}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Close
              </button>
              <button
                type="submit"
                id="ok-btn"
                className="px-6 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;
