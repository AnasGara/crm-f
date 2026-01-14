import React from 'react';
import { X } from 'lucide-react';
import { EmailLog } from '../services/emailService';

interface EmailDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailDetails: EmailLog | null;
  loading: boolean;
  error: string | null;
}

const EmailDetailsModal: React.FC<EmailDetailsModalProps> = ({
  isOpen,
  onClose,
  emailDetails,
  loading,
  error,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Email Details</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {emailDetails && !loading && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800">Subject</h4>
                <p className="text-gray-600">{emailDetails.subject}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Recipient</h4>
                <p className="text-gray-600">{emailDetails.to_email}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Sent At</h4>
                <p className="text-gray-600">
                  {new Date(emailDetails.sent_at).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Status</h4>
                <p className="text-gray-600">{emailDetails.status}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800">Body</h4>
                <div
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: emailDetails.body }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailDetailsModal;
