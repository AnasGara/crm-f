
import React, { useEffect, useState } from 'react';
import emailService, { DirectlySentEmail } from '../services/emailService';
import StatusBadge from './StatusBadge';

const DirectlySentEmails: React.FC = () => {
  const [emails, setEmails] = useState<DirectlySentEmail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await emailService.getMySentEmails();
        if (response.success && response.data) {
          setEmails(response.data.emails);
        } else {
          setError('Failed to fetch emails');
        }
      } catch (err) {
        setError('An error occurred while fetching emails');
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="card">
      <h2>Emails Sent Directly</h2>
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>To</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {emails.map((email) => (
            <tr key={email.id}>
              <td>{email.subject}</td>
              <td>{email.to_email}</td>
              <td><StatusBadge status={email.status} /></td>
              <td>{new Date(email.sent_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DirectlySentEmails;
