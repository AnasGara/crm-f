
import React, { useState } from 'react';
import CreateCampaignWizard from './CreateCampaignWizard';
import './EmailCampaign.css';

const EmailCampaignComponent: React.FC = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <div className="container">
      <h1>Email Campaign Management</h1>
      
      <div className="card">
        <h2>Create Email Campaign</h2>
        <button onClick={() => setIsWizardOpen(true)}>Send New Campaign</button>
      </div>

      <CreateCampaignWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
};

export default EmailCampaignComponent;
