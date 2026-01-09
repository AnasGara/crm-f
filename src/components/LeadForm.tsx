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
    status: 'to_be_treated', // Added this missing field
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        full_name: lead.full_name || '',
        email: lead.email || '',
        position: lead.position || '',
        company: lead.company || '',
        location: lead.location || '',
        profile_url: lead.profile_url || '',
        followers: lead.followers || 0,
        connections: lead.connections || 0,
        education: lead.education || '',
        personal_message: lead.personal_message || '',
        message_length: lead.message_length || 0,
        generated_at: lead.generated_at || '',
        total_leads: lead.total_leads || 0,
        comments: lead.comments || '',
        status: lead.status || 'to_be_treated', // Ensure status is included
      });
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
        status: 'to_be_treated',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number fields
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert empty strings to null for optional fields
    const cleanedData: any = { ...formData };
    
    // Convert empty strings to null for optional fields (except required ones)
    const optionalFields = ['email', 'position', 'company', 'location', 'profile_url', 'education', 'personal_message', 'comments'];
    optionalFields.forEach(field => {
      if (cleanedData[field] === '') {
        cleanedData[field] = null;
      }
    });
    
    onSave(cleanedData);
  };

  if (!isOpen) {
    return null;
  }

  // Define form fields with proper types and labels
  const formFields = [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: false },
    { name: 'position', label: 'Position', type: 'text', required: false },
    { name: 'company', label: 'Company', type: 'text', required: false },
    { name: 'location', label: 'Location', type: 'text', required: false },
    { name: 'profile_url', label: 'Profile URL', type: 'url', required: false },
    { name: 'followers', label: 'Followers', type: 'number', required: false },
    { name: 'connections', label: 'Connections', type: 'number', required: false },
    { name: 'education', label: 'Education', type: 'text', required: false },
    { name: 'personal_message', label: 'Personal Message', type: 'text', required: false },
    { name: 'message_length', label: 'Message Length', type: 'number', required: false },
    { name: 'generated_at', label: 'Generated At', type: 'date', required: false },
    { name: 'total_leads', label: 'Total Leads', type: 'number', required: false },
  ];

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
              {formFields.map(({ name, label, type, required }) => (
                <div key={name}>
                  <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={type}
                    name={name}
                    id={name}
                    value={(formData as any)[name] || ''}
                    onChange={handleChange}
                    required={required}
                    className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              ))}
            </div>

            {/* Status Field */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                id="status"
                value={(formData as any).status || 'to_be_treated'}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="to_be_treated">To be treated</option>
                <option value="qualified">Qualified</option>
                <option value="archived">Archived</option>
              </select>
            </div>
           
            {/* Comments Field */}
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700">Comments</label>
              <textarea
                name="comments"
                id="comments"
                value={(formData as any).comments || ''}
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