import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Summary from './Summary';
import AlltimeInsights from './AlltimeInsights';

const WeeklySummary: React.FC = () => {
  const navigate = useNavigate();
  const [weeklySubTab, setWeeklySubTab] = useState('Summary');

  const handleConnectNotion = () => {
    navigate('/connect-notion');
  };

  return (
    <div className="weekly-summary-content">
      <div className="weekly-header">
        <div>
          <h2 className="weekly-title">Weekly Summary</h2>
          <p className="weekly-date">October 28 - November 3, 2025</p>
        </div>
        <div className="weekly-actions">
          <button className="action-btn secondary-btn" onClick={handleConnectNotion}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <text x="8" y="11" fontSize="8" fontWeight="700" textAnchor="middle" fill="currentColor" fontFamily="system-ui">N</text>
            </svg>
            Sync to Notion
          </button>
          <button className="action-btn secondary-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4L8 9L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Send Email
          </button>
          <button className="action-btn primary-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 8V13H3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 3V10M8 10L5.5 7.5M8 10L10.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="weekly-tabs">
        <button 
          className={`weekly-tab ${weeklySubTab === 'Summary' ? 'active' : ''}`}
          onClick={() => setWeeklySubTab('Summary')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6 1V3M10 1V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Summary
        </button>
        <button 
          className={`weekly-tab ${weeklySubTab === 'All-Time Insights' ? 'active' : ''}`}
          onClick={() => setWeeklySubTab('All-Time Insights')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 7H21V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All-Time Insights
        </button>
      </div>

      {/* Summary Content */}
      {weeklySubTab === 'Summary' && <Summary />}

      {/* All-Time Insights Content */}
      {weeklySubTab === 'All-Time Insights' && <AlltimeInsights />}
    </div>
  );
};

export default WeeklySummary;
