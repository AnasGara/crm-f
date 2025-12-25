
import React, { useState, useEffect } from 'react';
import emailProviderService, { EmailProvider } from '../services/emailProviderService';
import emailCampaignService, { EmailCampaign } from '../services/emailCampaignService';
import './EmailCampaign.css';

const EmailCampaignComponent: React.FC = () => {
  const [emailProvider, setEmailProvider] = useState<EmailProvider | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<EmailCampaign>({
    name: '',
    subject: '',
    sender: 123, // Replace with actual sender ID
    audience: [],
    content: '',
    schedule: 'now',
    schedule_time: ''
  });

  useEffect(() => {
    const fetchEmailProvider = async () => {
      try {
        const response = await emailProviderService.getEmailProviderStatus();
        if (response.success) {
          setEmailProvider(response.data!);
        }
      } catch (err) {
        setError('No email provider connected');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmailProvider();
  }, []);

  const handleConnect = () => {
    window.location.href = 'http://localhost:8000/email-provider/google/redirect';
  };

  const handleDisconnect = async () => {
    try {
      await emailProviderService.disconnectEmailProvider();
      setEmailProvider(null);
    } catch (err) {
      setError('Failed to disconnect email provider.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCampaign({ ...campaign, [name]: value });
  };

    const handleAudienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setCampaign({ ...campaign, audience: value.split(',').map(item => item.trim()) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await emailCampaignService.createEmailCampaign(campaign);
      alert('Campaign created successfully!');
    } catch (err) {
      setError('Failed to create campaign.');
    }
  };

  return (
    <div className="container">
      <h1>Email Campaign Management</h1>

      <div className="card">
        <h2>Google Account Integration</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {emailProvider ? (
          <div>
            <p>Status: Connected</p>
            <p>Provider: {emailProvider.provider}</p>
            <button onClick={handleDisconnect}>Disconnect</button>
          </div>
        ) : (
          <div>
            <p>Status: Not Connected</p>
            <button onClick={handleConnect}>Connect Google Account</button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Create Email Campaign</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={campaign.name} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input type="text" name="subject" value={campaign.subject} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Audience (comma-separated IDs)</label>
            <input type="text" name="audience" value={campaign.audience.join(', ')} onChange={handleAudienceChange} required />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea name="content" value={campaign.content} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Schedule</label>
            <select name="schedule" value={campaign.schedule} onChange={handleInputChange}>
              <option value="now">Now</option>
              <option value="later">Later</option>
            </select>
          </div>
          {campaign.schedule === 'later' && (
            <div className="form-group">
              <label>Schedule Time</label>
              <input type="datetime-local" name="schedule_time" value={campaign.schedule_time} onChange={handleInputChange} required />
            </div>
          )}
          <button type="submit">Create Campaign</button>
        </form>
      </div>
    </div>
  );
};

export default EmailCampaignComponent;
