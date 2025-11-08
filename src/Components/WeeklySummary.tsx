import React, { useState, useRef, useEffect } from 'react';
import Summary, { type SummaryRef } from './Summary';
import AlltimeInsights, { type AlltimeInsightsRef } from './AlltimeInsights';

interface InsightsData {
  monthly_statistics: {
    current_month: {
      month: string;
      releases: number;
    };
    last_month: {
      month: string;
      releases: number;
    };
    trend: string;
    trend_direction: 'up' | 'down';
  };
  most_active_company: {
    company_name: string;
    company_id: number;
    release_count: number;
  };
  trending_category: {
    category: string;
    total_releases: number;
    current_month_releases: number;
    last_month_releases: number;
  };
  top_categories_current_month: Array<{
    category: string;
    releases: number;
  }>;
  overall_statistics: {
    total_features: number;
    total_companies: number;
    total_categories: number;
  };
  generated_at: string;
}

const WeeklySummary: React.FC = () => {
  const [weeklySubTab, setWeeklySubTab] = useState('Summary');
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const summaryRef = useRef<SummaryRef>(null);
  const alltimeInsightsRef = useRef<AlltimeInsightsRef>(null);

  // Fetch insights data from API
  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('http://localhost:8000/insights');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setInsights(data);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setError(error instanceof Error ? error.message : 'Failed to load insights');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

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
          <p className="weekly-date">{insights?.monthly_statistics.current_month.month || 'Loading...'}</p>
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
      {weeklySubTab === 'Summary' && <Summary ref={summaryRef} insights={insights} isLoading={isLoading} error={error} />}

      {/* All-Time Insights Content */}
      {weeklySubTab === 'All-Time Insights' && <AlltimeInsights ref={alltimeInsightsRef} />}
    </div>
  );
};

export default WeeklySummary;
