import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotion } from '../context/NotionContext';
import './ConnectToNotion.css';
import Notion_icon from '../assets/Notion_Icon.png';

const ConnectToNotion: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setIsConnected } = useNotion();
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const exchangeCodeForToken = useCallback(async (code: string) => {
    try {
      console.log('Exchanging code for token...', code);
      
      // Send code to backend to exchange for access token
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/notion/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      console.log('Response status:', response.status);

      const data = await response.json();
      
      console.log('Backend response:', data);

      if (response.ok && data.success) {
        // Success - show success message and redirect
        console.log('✅ Successfully connected to Notion!');
        setConnectionStatus('success');
        setIsConnected(true); // Mark Notion as connected
        // Remove code from URL and add success param
        window.history.replaceState({}, '', '/connect-notion?success=true');
        
        // Auto-navigate to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/onboarding');
        }, 2000);
      } else {
        // Error from backend
        console.error('❌ Backend returned error:', data);
        setConnectionStatus('error');
        setErrorMessage(data.error || 'Failed to connect to Notion');
        if (data.details) {
          console.error('Error details:', data.details);
        }
        // Remove code from URL
        window.history.replaceState({}, '', '/connect-notion?error=auth_failed');
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      });
      setConnectionStatus('error');
      setErrorMessage(`Network error: ${error instanceof Error ? error.message : 'Cannot connect to backend. Make sure the backend server is running on http://localhost:5000'}`);
      // Remove code from URL
      window.history.replaceState({}, '', '/connect-notion?error=network_error');
    }
  }, [navigate, setIsConnected]);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'access_denied':
        return 'You denied access to Notion. Please try again.';
      case 'no_code':
        return 'No authorization code received. Please try again.';
      case 'auth_failed':
        return 'Failed to authenticate with Notion. Please try again.';
      default:
        return 'An error occurred during connection. Please try again.';
    }
  };

  useEffect(() => {
    // Check for OAuth callback code
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const success = searchParams.get('success');

    if (code) {
      // Exchange code for access token
      exchangeCodeForToken(code);
    } else if (success === 'true') {
      setConnectionStatus('success');
      // Auto-navigate to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/onboarding');
      }, 2000);
    } else if (error) {
      setConnectionStatus('error');
      setErrorMessage(getErrorMessage(error));
    }
  }, [searchParams, navigate, exchangeCodeForToken]);

  const handleConnectNotion = () => {
    const clientId = import.meta.env.VITE_NOTION_CLIENT_ID;
    const redirectUri = encodeURIComponent(import.meta.env.VITE_REDIRECT_URI || "http://localhost:5174/connect-notion");
    
    if (!clientId) {
      console.error('❌ Notion Client ID not configured');
      alert('Configuration error: Notion Client ID is missing. Please check your .env file.');
      return;
    }

    const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}`;
    console.log('🔐 Initiating Notion OAuth...');
    window.location.href = notionAuthUrl;
  };

  const handleSkip = () => {
    // Navigate to dashboard
    console.log('Skipped Notion connection');
    navigate('/onboarding');
  };

  const handleNext = () => {
    // Navigate to dashboard
    console.log('Moving to next step');
    navigate('/onboarding');
  };

  return (
    <div className="connect-notion-page">
      <div className="connect-notion-container">
        <div className="notion-icon-container">
          <img
            src={Notion_icon}
            alt="Notion icon"
            width={40}   // or any size
            height={40}
          />
        </div>

        <h1 className="notion-title">Connect to Notion</h1>
        <p className="notion-description">
          Get weekly competitive summaries delivered directly to your Notion<br />workspace.
        </p>

        {connectionStatus === 'success' && (
          <div className="connection-status success">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="#10b981" />
              <path d="M6 10L8.5 12.5L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Successfully connected! Redirecting to dashboard...</span>
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="connection-status error">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="#ef4444" />
              <path d="M7 7L13 13M7 13L13 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="notion-connect-section">
          <button className="notion-connect-button" onClick={handleConnectNotion}>
            <svg 
              className="notion-button-icon" 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="none"
            >
              <rect x="2" y="2" width="16" height="16" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
              <text x="10" y="13.5" fontSize="11" fontWeight="700" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif">N</text>
            </svg>
            Connect Notion Workspace
          </button>
          <p className="notion-skip-text">
            You can skip this step and add it later in settings
          </p>
        </div>

        <div className="notion-footer">
          <button className="skip-button" onClick={handleSkip}>
            Skip for now
          </button>
          <button className="next-button" onClick={handleNext}>
            Next
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none"
              className="next-arrow-icon"
            >
              <path 
                d="M6 3L11 8L6 13" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectToNotion;

