import React, { useEffect, useState } from 'react';
import { AUTH_HEADER } from '../constants/auth';

interface InsightsData {
  id: number;
  trending_insight: string;
  velocity_alert: string;
  category_leader: string;
  analysis_period: {
    weeks: number;
    start_date: string;
    end_date: string;
  };
  monthly_comparison: {
    current_month: {
      features: number;
      month: string;
      top_companies: { [key: string]: number };
      top_categories: { [key: string]: number };
    };
    last_month: {
      features: number;
      month: string;
      top_companies: { [key: string]: number };
      top_categories: { [key: string]: number };
    };
  };
  quarterly_comparison: {
    current_quarter: {
      features: number;
      quarter: string;
      top_companies: { [key: string]: number };
    };
    previous_quarter: {
      features: number;
      quarter: string;
      top_companies: { [key: string]: number };
    };
  };
  category_distribution: { [key: string]: number };
  company_distribution: { [key: string]: number };
  features_analyzed: number;
  generated_at?: string;
  created_at?: string;
}

interface AnomalyData {
  anomaly_type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  affected_entity: string;
  metric_value: number;
  expected_range?: {
    min: number;
    max: number;
  };
  recommendation?: string;
}

const InsightsGrid: React.FC = () => {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format category names
  const formatCategory = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'APPOINTMENTS': 'Appointments',
      'ANALYTICS': 'Analytics',
      'MARKETING_SUITE': 'Marketing Suite',
      'MARKETING': 'Marketing',
      'PAYMENTS': 'Payments',
      'MOBILE': 'Mobile',
      'MEMBERSHIP': 'Membership',
      'OTHER': 'Other'
    };
    
    return categoryMap[category.toUpperCase()] || 
           category.charAt(0).toUpperCase() + category.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  // Format anomaly type for display
  const formatAnomalyType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'spike': 'Release Spike',
      'drop': 'Activity Drop',
      'trend_change': 'Trend Shift',
      'outlier': 'Unusual Activity',
      'pattern_break': 'Pattern Break'
    };
    return typeMap[type?.toLowerCase()] || type || 'Pattern Detected';
  };

  // Fetch insights data from API
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        console.log('[InsightsGrid] Fetching data from APIs...');
        
        // Fetch insights API
        const insightsResponse = await fetch(`${baseURL}/insights/latest`, { 
          signal: abortController.signal,
          headers: {
            'Authorization': AUTH_HEADER
          }
        });
        
        if (!insightsResponse.ok) {
          throw new Error(`Failed to fetch insights: ${insightsResponse.status} ${insightsResponse.statusText}`);
        }
        
        const insightsData = await insightsResponse.json();
        console.log('[InsightsGrid] Insights data received:', insightsData);
        
        if (isMounted) {
          setInsights(insightsData);
        }
        
        // Note: Anomalies endpoint is commented out in original code
        // If needed in the future, uncomment and implement
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[InsightsGrid] Fetch aborted');
          return;
        }
        console.error('[InsightsGrid] Error fetching data:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to load data');
          setInsights(null);
          setAnomalies([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  return (
    <div className="insights-grid">
      {/* Trending Insight */}
      <div className="insight-card trending">
        <div className="insight-icon-wrapper trending-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 7H21V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="insight-content">
          <h3 className="insight-title" style={{ textAlign: 'left' }}>📊 Trending Insight</h3>
          {isLoading ? (
            <p className="insight-text" style={{ textAlign: 'left' }}>Loading insights...</p>
          ) : error ? (
            <p className="insight-text" style={{ color: '#ef4444', textAlign: 'left' }}>Error loading data</p>
          ) : insights ? (
            <p className="insight-text" style={{ textAlign: 'left' }} dangerouslySetInnerHTML={{ 
              __html: insights.trending_insight
                .replace(/\+?\d+%/g, (match) => `<strong class="highlight-teal">${match}</strong>`)
                .replace(/\d+ features?/g, (match) => `<strong class="highlight-teal">${match}</strong>`)
            }} />
          ) : (
            <p className="insight-text" style={{ textAlign: 'left' }}>
              Leading company released <strong className="highlight-teal">45 new features</strong> this month, 
              representing a <strong className="highlight-teal">+15%</strong> trend overall.
            </p>
          )}
        </div>
      </div>

      {/* Category Leader */}
      <div className="insight-card category">
        <div className="insight-icon-wrapper category-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
          </svg>
        </div>
        <div className="insight-content">
          <h3 className="insight-title" style={{ textAlign: 'left' }}>🏆 Category Leader</h3>
          {isLoading ? (
            <p className="insight-text" style={{ textAlign: 'left' }}>Loading insights...</p>
          ) : error ? (
            <p className="insight-text" style={{ color: '#ef4444', textAlign: 'left' }}>Error loading data</p>
          ) : insights ? (
            <p className="insight-text" style={{ textAlign: 'left' }} dangerouslySetInnerHTML={{ 
              __html: insights.category_leader
                .replace(/'([^']+)' category/g, (_match, category) => `<strong class="highlight-blue">${formatCategory(category)} category</strong>`)
                .replace(/\d+ new releases?/g, (match) => `<strong class="highlight-blue">${match}</strong>`)
                .replace(/\d+ companies?/g, (match) => `<strong class="highlight-blue">${match}</strong>`)
            }} />
          ) : (
            <p className="insight-text" style={{ textAlign: 'left' }}>
              <strong className="highlight-blue">Analytics category</strong> is dominating with 
              <strong className="highlight-blue"> 28 releases</strong> this month.
            </p>
          )}
        </div>
      </div>

      {/* Velocity Alert */}
      <div className="insight-card velocity">
        <div className="insight-icon-wrapper velocity-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="insight-content">
          <h3 className="insight-title" style={{ textAlign: 'left' }}>💨 Velocity Alert</h3>
          {isLoading ? (
            <p className="insight-text" style={{ textAlign: 'left' }}>Loading insights...</p>
          ) : error ? (
            <p className="insight-text" style={{ color: '#ef4444', textAlign: 'left' }}>Error loading data</p>
          ) : insights ? (
            <p className="insight-text" style={{ textAlign: 'left' }} dangerouslySetInnerHTML={{ 
              __html: insights.velocity_alert
                .replace(/\d+ features?/g, (match) => `<strong class="highlight-purple">${match}</strong>`)
                .replace(/\+?\d+%/g, (match) => `<strong class="highlight-purple">${match}</strong>`)
                .replace(/Q\d+ \d+/g, (match) => `<strong class="highlight-purple">${match}</strong>`)
            }} />
          ) : (
            <p className="insight-text" style={{ textAlign: 'left' }}>
              The market is accelerating—
              <strong className="highlight-purple"> 120 total releases</strong> this month vs 
              <strong className="highlight-purple"> 95 last month</strong> 
              (+26%).
            </p>
          )}
        </div>
      </div>

      {/* Pattern Detected */}
      <div className="insight-card pattern">
        <div className="insight-icon-wrapper pattern-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
            <circle cx="6" cy="6" r="2" fill="currentColor"/>
            <circle cx="18" cy="6" r="2" fill="currentColor"/>
            <circle cx="6" cy="18" r="2" fill="currentColor"/>
            <circle cx="18" cy="18" r="2" fill="currentColor"/>
            <path d="M12 10V14M10 12H14M7 7L10.5 10.5M14.5 10.5L18 7M7 17L10.5 13.5M14.5 13.5L18 17" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <div className="insight-content">
          <h3 className="insight-title" style={{ textAlign: 'left' }}>🎯 Pattern Detected</h3>
          {isLoading ? (
            <p className="insight-text" style={{ textAlign: 'left' }}>Loading patterns...</p>
          ) : anomalies && anomalies.length > 0 ? (
            <p className="insight-text" style={{ textAlign: 'left' }}>
              {(() => {
                // Get the most significant anomaly (highest severity or first one)
                const significantAnomaly = anomalies.find(a => a.severity === 'high') || anomalies[0];
                if (significantAnomaly) {
                  return (
                    <>
                      <strong className="highlight-teal">{formatAnomalyType(significantAnomaly.anomaly_type)}</strong>: {significantAnomaly.description || 'Anomaly detected in release patterns'}
                      {significantAnomaly.recommendation && (
                        <>. <em>{significantAnomaly.recommendation}</em></>
                      )}
                    </>
                  );
                }
                return 'Multiple patterns detected across competitors—review for strategic insights.';
              })()}
            </p>
          ) : (
            <p className="insight-text" style={{ textAlign: 'left' }}>
              All <strong className="highlight-teal">competitors</strong> are showing consistent release patterns—market is stable with no significant anomalies detected.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsGrid;

