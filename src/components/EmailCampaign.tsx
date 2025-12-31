
import React, { useState } from 'react';
import CreateCampaignWizard from './CreateCampaignWizard';
import './EmailCampaign.css';

const EmailCampaignComponent: React.FC = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleCampaignSent = () => {
    setIsWizardOpen(false);
    setShowSuccessPopup(true);
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  return (
    <div className="container">
      <h1>Email Campaign Management</h1>
      
      <div className="card">
        <h2>Create Email Campaign</h2>
        <button onClick={() => setIsWizardOpen(true)}>Send New Campaign</button>
      </div>

      <CreateCampaignWizard
        isOpen={isWizardOpen}
        onClose={handleCampaignSent}
      />

      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Success!</h2>
            <p>Your email campaign has been sent successfully.</p>
            <button
              onClick={closeSuccessPopup}
              className="mt-6 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaignComponent;
