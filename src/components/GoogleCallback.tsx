import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const GoogleCallback: React.FC = () => {
  const [status, setStatus] = useState('loading');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (code) {
      // Here you would typically send the code to your backend to exchange it for a token
      // For now, we'll just simulate a successful connection
      console.log('Authorization code:', code);
      setStatus('success');
    } else {
      setStatus('error');
    }
  }, [location]);

  const handleReturn = () => {
    navigate('/integrations');
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        {status === 'loading' && <p>Connecting to Google...</p>}
        {status === 'success' && (
          <div>
            <h1 className="text-2xl font-bold text-green-600 mb-4">
              Successfully connected to Google!
            </h1>
            <p className="text-gray-600 mb-8">
              You can now close this window or return to the integrations page.
            </p>
            <button
              onClick={handleReturn}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Return to Integrations
            </button>
          </div>
        )}
        {status === 'error' && (
          <div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Failed to connect to Google.
            </h1>
            <p className="text-gray-600 mb-8">
              Please try again from the integrations page.
            </p>
            <button
              onClick={handleReturn}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Return to Integrations
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
