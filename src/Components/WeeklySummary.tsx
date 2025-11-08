import React, { useState, useRef } from 'react';
import Summary, { type SummaryRef } from './Summary';
import AlltimeInsights, { type AlltimeInsightsRef } from './AlltimeInsights';

const WeeklySummary: React.FC = () => {
  const [weeklySubTab, setWeeklySubTab] = useState('Summary');
  const summaryRef = useRef<SummaryRef>(null);
  const alltimeInsightsRef = useRef<AlltimeInsightsRef>(null);

  const handleDownloadPDF = () => {
    if (weeklySubTab === 'Summary') {
      summaryRef.current?.downloadPDF();
    } else {
      alltimeInsightsRef.current?.downloadPDF();
    }
  };

  return (
    <div className="weekly-summary-content">
      <div className="weekly-header">
        <div>
          <h2 className="weekly-title">Weekly Summary</h2>
          <p className="weekly-date">October 28 - November 3, 2025</p>
        </div>
        <div className="weekly-actions">
          <button className="action-btn primary-btn" onClick={handleDownloadPDF}>
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
      {weeklySubTab === 'Summary' && <Summary ref={summaryRef} />}

      {/* All-Time Insights Content */}
      {weeklySubTab === 'All-Time Insights' && <AlltimeInsights ref={alltimeInsightsRef} />}
    </div>
  );
};

export default WeeklySummary;
