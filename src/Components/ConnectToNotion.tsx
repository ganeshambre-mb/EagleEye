import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ConnectToNotion.css';
import Notion_icon from '../Assets/Notion_Icon.png';

const ConnectToNotion: React.FC = () => {
  const navigate = useNavigate();

  const handleConnectNotion = () => {
    // Handle Notion OAuth connection here
    console.log('Connecting to Notion...');
    // After successful connection, navigate to next page
  };

  const handleSkip = () => {
    // Navigate to dashboard
    console.log('Skipped Notion connection');
    navigate('/dashboard');
  };

  const handleNext = () => {
    // Navigate to dashboard
    console.log('Moving to next step');
    navigate('/dashboard');
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

