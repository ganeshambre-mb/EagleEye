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
  id: number;
  feature_id: number;
  company_id: number;
  category_id: number | null;
  anomaly_score: number;
  business_rank: number;
  business_value_score: number;
  explanation: string | null;
  business_reason: string | null;
  detection_weeks: number;
  detected_at: string;
  release_date: string;
  feature: {
    id: number;
    name: string;
    summary: string;
    highlights?: string[];
    category: string;
    company_name: string;
    release_date: string;
    version?: string | null;
  };
}

const InsightsGrid: React.FC = () => {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAnomalyIndex, setCurrentAnomalyIndex] = useState(0);

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

  // Get severity based on business_rank
  const getSeverity = (businessRank: number): 'high' | 'medium' | 'low' => {
    if (businessRank === 1) return 'high';
    if (businessRank === 3) return 'medium';
    return 'low';
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
        
        // Fetch anomalies API
        try {
          const anomaliesResponse = await fetch(`${baseURL}/anomalies`, { 
            signal: abortController.signal,
            headers: {
              'Authorization': AUTH_HEADER
            }
          });
          
          if (anomaliesResponse.ok) {
            const anomaliesData = await anomaliesResponse.json();
            console.log('[InsightsGrid] Anomalies data received:', anomaliesData);
            
            // Handle both array and object with array property
            const anomaliesArray = Array.isArray(anomaliesData) 
              ? anomaliesData 
              : (anomaliesData.anomalies || anomaliesData.data || []);
            
            if (isMounted) {
              // Filter out unranked anomalies (business_rank === 999), then sort by business_rank (lower is better)
              // Then take top 3
              const sortedAnomalies = anomaliesArray
                .filter((a: AnomalyData) => a.business_rank !== 999)
                .sort((a: AnomalyData, b: AnomalyData) => a.business_rank - b.business_rank)
                .slice(0, 3);
              setAnomalies(sortedAnomalies);
            }
          } else {
            console.log('[InsightsGrid] Anomalies endpoint not available or returned error:', anomaliesResponse.status);
            if (isMounted) {
              setAnomalies([]);
            }
          }
        } catch (anomaliesError) {
          // Anomalies endpoint might not exist, that's okay
          console.log('[InsightsGrid] Anomalies endpoint not available:', anomaliesError);
          if (isMounted) {
            setAnomalies([]);
          }
        }
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

  // Auto-rotate carousel
  useEffect(() => {
    if (anomalies.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAnomalyIndex((prev) => (prev + 1) % anomalies.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [anomalies.length]);

  const goToNext = () => {
    setCurrentAnomalyIndex((prev) => (prev + 1) % anomalies.length);
  };

  const goToPrevious = () => {
    setCurrentAnomalyIndex((prev) => (prev - 1 + anomalies.length) % anomalies.length);
  };

  const goToSlide = (index: number) => {
    setCurrentAnomalyIndex(index);
  };

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
            <div style={{ 
              position: 'relative',
              minHeight: '140px', // Fixed height to prevent layout shift
              overflow: 'hidden',
              paddingBottom: anomalies.length > 1 ? '32px' : '0', // Space for dots indicator
              width: '100%',
              textAlign: 'left'
            }}>
              {/* Carousel Container */}
              <div style={{
                display: 'flex',
                transform: `translateX(-${currentAnomalyIndex * (100 / anomalies.length)}%)`,
                transition: 'transform 0.3s ease-in-out',
                width: `${anomalies.length * 100}%`,
                textAlign: 'left'
              }}>
                {anomalies.map((anomaly) => {
                  const severity = getSeverity(anomaly.business_rank);
                  const slideWidth = 100 / anomalies.length;
                  return (
                    <div
                      key={anomaly.id}
                      style={{
                        width: `${slideWidth}%`,
                        flexShrink: 0,
                        paddingRight: '8px',
                        boxSizing: 'border-box',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '12px' }}>
                          <strong className="highlight-teal" style={{ flex: 1, textAlign: 'left' }}>
                            {anomaly.feature.name}
                          </strong>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600',
                            color: severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#6b7280',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: severity === 'high' ? '#fee2e2' : severity === 'medium' ? '#fef3c7' : '#f3f4f6'
                          }}>
                            {severity}
                          </span>
                        </div>
                        <p className="insight-text" style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', textAlign: 'left' }}>
                          {anomaly.business_reason || 'Anomaly detected in release patterns'}
                          <span style={{ color: '#6b7280', fontSize: '0.8125rem' }}> • {anomaly.feature.company_name}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              {anomalies.length > 1 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={goToPrevious}
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    aria-label="Previous anomaly"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={goToNext}
                    style={{
                      position: 'absolute',
                      right: '0',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    aria-label="Next anomaly"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Dots Indicator */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '6px',
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%'
                  }}>
                    {anomalies.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        style={{
                          width: currentAnomalyIndex === index ? '24px' : '8px',
                          height: '8px',
                          borderRadius: '4px',
                          border: 'none',
                          background: currentAnomalyIndex === index ? '#5b7cff' : '#d1d5db',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease-in-out',
                          padding: 0
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
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

