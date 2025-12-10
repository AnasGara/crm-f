
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
  });

  useEffect(() => {
    if (lead) {
      setFormData(lead);
    } else {
      setFormData({
        full_name: '',
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
      });
    }
  }, [lead]);

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{lead ? 'Edit Lead' : 'Create Lead'}</h3>
          <form onSubmit={handleSubmit} className="mt-2 text-left">
            {Object.keys(formData).map(key => (
              <div key={key} className="mb-4">
                <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">{key.replace('_', ' ')}</label>
                <input
                  type={typeof (formData as any)[key] === 'number' ? 'number' : 'text'}
                  name={key}
                  id={key}
                  value={(formData as any)[key]}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            ))}
            <div className="items-center px-4 py-3">
              <button
                id="ok-btn"
                className="px-4 py-2 bg-indigo-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Save
              </button>
            </div>
          </form>
          <div className="items-center px-4 py-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;
