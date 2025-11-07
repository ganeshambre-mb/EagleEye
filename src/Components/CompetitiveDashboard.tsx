import React, { useState } from 'react';
import Releases from './Releases';
import Analysis from './Analysis';
import WeeklySummary from './WeeklySummary';
import './CompetitiveDashboard.css';

const CompetitiveDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Releases');

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                <path d="M8.5 15.5C7.5 14.5 7 13.3 7 12C7 10.7 7.5 9.5 8.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M15.5 8.5C16.5 9.5 17 10.7 17 12C17 13.3 16.5 14.5 15.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5.5 18.5C3.5 16.5 2.5 14 2.5 12C2.5 10 3.5 7.5 5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M18.5 5.5C20.5 7.5 21.5 10 21.5 12C21.5 14 20.5 16.5 18.5 18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="logo-text">
              <h1 className="app-title">Eagle Eye</h1>
              <p className="app-subtitle">Competitive Intelligence Dashboard</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'Releases' ? 'active' : ''}`}
            onClick={() => setActiveTab('Releases')}
          >
            Releases
          </button>
          <button 
            className={`tab ${activeTab === 'Analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('Analysis')}
          >
            Analysis
          </button>
          <button 
            className={`tab ${activeTab === 'Weekly Summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('Weekly Summary')}
          >
            Weekly Summary
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Releases Tab Content */}
        {activeTab === 'Releases' && <Releases />}

        {/* Analysis Tab Content */}
        {activeTab === 'Analysis' && <Analysis />}

        {/* Weekly Summary Tab Content */}
        {activeTab === 'Weekly Summary' && <WeeklySummary />}
      </main>
    </div>
  );
};

export default CompetitiveDashboard;
