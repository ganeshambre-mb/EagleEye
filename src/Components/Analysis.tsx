import React, { useRef, useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface OverviewData {
  overview: {
    total_releases: number;
    active_companies: number;
    total_active_categories: number;
    total_features: number;
  };
  most_active_category: {
    name: string;
    feature_count: number;
    percentage: number;
  };
  release_contributions: {
    [key: string]: {
      release_count: number;
      percentage: number;
    };
  };
  top_categories: Array<{
    category: string;
    feature_count: number;
  }>;
  weekly_release_trend?: Array<{
    week_start: string;
    release_count: number;
  }>;
  category_distribution?: {
    [key: string]: {
      feature_count: number;
      percentage: number;
    };
  };
  date_range: {
    earliest_release: string;
    latest_release: string;
    days_covered: number;
  };
}

const Analysis: React.FC = () => {
  const analysisContentRef = useRef<HTMLDivElement>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadPDF = async () => {
    if (!analysisContentRef.current) return;

    try {
      // Dynamic import to avoid loading these libraries unless needed
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Show loading state
      const button = document.querySelector('.export-snapshot-btn') as HTMLButtonElement;
      const originalText = button?.textContent;
      if (button) button.textContent = 'Generating PDF...';

      // Capture the content as canvas
      const canvas = await html2canvas(analysisContentRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with current timestamp
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: YYYY-MM-DDTHH-MM-SS
      const filename = `${timestamp}_Analysis.pdf`;

      // Save the PDF
      pdf.save(filename);

      // Restore button text
      if (button) button.textContent = originalText;

      console.log(`✅ PDF downloaded: ${filename}`);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Fetch insights, anomalies and overview data from APIs
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching data from APIs...');
        
        // Fetch all APIs in parallel
        const [insightsResponse, anomaliesResponse, overviewResponse] = await Promise.all([
          fetch('http://localhost:8000/insights/1'),
          fetch('http://localhost:8000/analytics/anomalies-enhanced'),
          fetch('http://localhost:8000/analytics/overview')
        ]);
        
        if (!insightsResponse.ok) {
          throw new Error(`Failed to fetch insights: ${insightsResponse.status} ${insightsResponse.statusText}`);
        }
        
        const insightsData = await insightsResponse.json();
        console.log('Insights data received:', insightsData);
        setInsights(insightsData);
        
        // Handle anomalies response
        if (anomaliesResponse.ok) {
          const anomaliesData = await anomaliesResponse.json();
          console.log('Anomalies data received:', anomaliesData);
          // If the response is an array, use it directly, otherwise check for a data property
          const anomaliesArray = Array.isArray(anomaliesData) ? anomaliesData : anomaliesData.anomalies || [];
          setAnomalies(anomaliesArray);
        } else {
          console.warn('Failed to fetch anomalies, using fallback');
          setAnomalies([]);
        }
        
        // Handle overview response
        if (overviewResponse.ok) {
          const overviewData = await overviewResponse.json();
          console.log('Overview data received:', overviewData);
          setOverview(overviewData);
        } else {
          console.warn('Failed to fetch overview, using insights data as fallback');
          setOverview(null);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Don't completely fail if API is unavailable, show the page with sample data
        setError(error instanceof Error ? error.message : 'Failed to load data');
        // Set some default data to prevent blank page
        setInsights(null);
        setAnomalies([]);
        setOverview(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Chart data for Weekly Release Trend - using real data from overview API
  const weeklyData = overview?.weekly_release_trend 
    ? overview.weekly_release_trend.slice(-6).map((item) => {
        const date = new Date(item.week_start);
        const weekLabel = `Week ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        return {
          week: weekLabel,
          releases: item.release_count
        };
      })
    : [
      { week: 'Week 1', releases: 12 },
      { week: 'Week 2', releases: 15 },
      { week: 'Week 3', releases: 8 },
      { week: 'Week 4', releases: 22 },
      { week: 'Week 5', releases: 18 },
      { week: 'Week 6', releases: 27 }
    ];

  // Chart data for Category Distribution - prefer overview API's category_distribution
  const categoryData = overview?.category_distribution 
    ? Object.entries(overview.category_distribution)
        .slice(0, 6) // Take top 6 categories
        .map(([category, data]) => ({
          category: formatCategory(category),
          count: data.feature_count
        }))
    : overview?.top_categories
      ? overview.top_categories
          .slice(0, 6)
          .map((item) => ({
            category: formatCategory(item.category),
            count: item.feature_count
          }))
      : insights?.category_distribution 
        ? Object.entries(insights.category_distribution)
            .slice(0, 6)
            .map(([category, count]) => ({
              category: formatCategory(category),
              count: count
            }))
        : [
          { category: 'Analytics', count: 28 },
          { category: 'Appointments', count: 22 },
          { category: 'Marketing Suite', count: 18 },
          { category: 'Payments', count: 12 },
          { category: 'Mobile', count: 10 }
        ];

  // Pie chart data for Competitor Release Contribution - prefer overview data
  const colors = ['#5b7cff', '#a78bfa', '#22d3ee', '#10b981', '#f59e0b', '#ef4444'];
  const competitorContribution = overview?.release_contributions 
    ? Object.entries(overview.release_contributions)
        .slice(0, 4) // Take top 4 companies
        .map(([name, data], index) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: Math.round(data.percentage),
          color: colors[index % colors.length]
        }))
    : insights?.company_distribution 
      ? Object.entries(insights.company_distribution)
          .slice(0, 4)
          .map(([name, value], index) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: Math.round((value / insights.features_analyzed) * 100),
            color: colors[index % colors.length]
          }))
      : [
        { name: 'Zenoti', value: 35, color: '#5b7cff' },
        { name: 'Mindbody', value: 28, color: '#a78bfa' },
        { name: 'Boulevard', value: 22, color: '#22d3ee' },
        { name: 'Vagaro', value: 15, color: '#10b981' }
      ];

  return (
    <div className="analysis-content" ref={analysisContentRef}>
      <div className="analysis-header">
        <div>
          <h2 className="analysis-title">Competitive Analysis</h2>
          <p className="analysis-subtitle">Insights and trends across all tracked competitors</p>
        </div>
        <button className="export-snapshot-btn" onClick={handleDownloadPDF}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8V13H3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 3V10M8 10L5.5 7.5M8 10L10.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download PDF
        </button>
      </div>

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
            <h3 className="insight-title">📊 Trending Insight</h3>
            {isLoading ? (
              <p className="insight-text">Loading insights...</p>
            ) : error ? (
              <p className="insight-text" style={{ color: '#ef4444' }}>Error loading data</p>
            ) : insights ? (
              <p className="insight-text" dangerouslySetInnerHTML={{ 
                __html: insights.trending_insight
                  .replace(/\+?\d+%/g, (match) => `<strong class="highlight-teal">${match}</strong>`)
                  .replace(/\d+ features?/g, (match) => `<strong class="highlight-teal">${match}</strong>`)
              }} />
            ) : (
              <p className="insight-text">
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
            <h3 className="insight-title">🏆 Category Leader</h3>
            {isLoading ? (
              <p className="insight-text">Loading insights...</p>
            ) : error ? (
              <p className="insight-text" style={{ color: '#ef4444' }}>Error loading data</p>
            ) : insights ? (
              <p className="insight-text" dangerouslySetInnerHTML={{ 
                __html: insights.category_leader
                  .replace(/'([^']+)' category/g, (_match, category) => `<strong class="highlight-blue">${formatCategory(category)} category</strong>`)
                  .replace(/\d+ new releases?/g, (match) => `<strong class="highlight-blue">${match}</strong>`)
                  .replace(/\d+ companies?/g, (match) => `<strong class="highlight-blue">${match}</strong>`)
              }} />
            ) : (
              <p className="insight-text">
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
            <h3 className="insight-title">💨 Velocity Alert</h3>
            {isLoading ? (
              <p className="insight-text">Loading insights...</p>
            ) : error ? (
              <p className="insight-text" style={{ color: '#ef4444' }}>Error loading data</p>
            ) : insights ? (
              <p className="insight-text" dangerouslySetInnerHTML={{ 
                __html: insights.velocity_alert
                  .replace(/\d+ features?/g, (match) => `<strong class="highlight-purple">${match}</strong>`)
                  .replace(/\+?\d+%/g, (match) => `<strong class="highlight-purple">${match}</strong>`)
                  .replace(/Q\d+ \d+/g, (match) => `<strong class="highlight-purple">${match}</strong>`)
              }} />
            ) : (
              <p className="insight-text">
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
            <h3 className="insight-title">🎯 Pattern Detected</h3>
            {isLoading ? (
              <p className="insight-text">Loading patterns...</p>
            ) : anomalies && anomalies.length > 0 ? (
              <p className="insight-text">
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
              <p className="insight-text">
                All <strong className="highlight-teal">competitors</strong> are showing consistent release patterns—market is stable with no significant anomalies detected.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3 className="chart-title">Weekly Release Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="week" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                domain={[0, 'dataMax + 2']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="releases" 
                stroke="#5b7cff" 
                strokeWidth={3}
                dot={{ fill: '#5b7cff', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="category" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                domain={[0, 'dataMax + 10']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#5b7cff" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart and Stats Section */}
      <div className="pie-chart-section">
        <div className="chart-card pie-chart-card">
          <h3 className="chart-title">Competitor Release Contribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={competitorContribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {competitorContribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {competitorContribution.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                <span className="legend-label">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards-section">
        <div className="stat-card">
          <h4 className="stat-label">Total Releases</h4>
          <p className="stat-value">{overview?.overview?.total_releases || insights?.features_analyzed || '...'}</p>
          <p className={`stat-change ${(insights?.monthly_comparison?.current_month?.features ?? 0) > (insights?.monthly_comparison?.last_month?.features ?? 0) ? 'positive' : 'negative'}`}>
            {insights?.monthly_comparison ? 
              `+${Math.round(((insights.monthly_comparison.current_month?.features ?? 0) / (insights.monthly_comparison.last_month?.features || 1) - 1) * 100)}%` 
              : '...'} vs last month
          </p>
        </div>

        <div className="stat-card">
          <h4 className="stat-label">Active Competitors</h4>
          <p className="stat-value">{overview?.overview?.active_companies || (insights?.company_distribution ? Object.keys(insights.company_distribution).length : '...')}</p>
          <p className="stat-info">All tracked</p>
        </div>

        <div className="stat-card">
          <h4 className="stat-label">Total Categories</h4>
          <p className="stat-value">{overview?.overview?.total_active_categories || (insights?.category_distribution ? Object.keys(insights.category_distribution).length : '...')}</p>
          <p className="stat-change trending">Active categories</p>
        </div>

        <div className="stat-card">
          <h4 className="stat-label">Most Active Category</h4>
          <p className="stat-value">
            {overview?.most_active_category 
              ? formatCategory(overview.most_active_category.name)
              : insights?.category_distribution 
                ? formatCategory(Object.entries(insights.category_distribution).sort((a, b) => b[1] - a[1])[0][0]) 
                : '...'}
          </p>
          <p className="stat-highlight">
            {overview?.most_active_category 
              ? `${overview.most_active_category.feature_count} features`
              : insights?.category_distribution 
                ? `${Object.entries(insights.category_distribution).sort((a, b) => b[1] - a[1])[0][1]} releases`
                : '...'} 
            {overview?.most_active_category?.percentage && ` (${overview.most_active_category.percentage.toFixed(1)}%)`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;

