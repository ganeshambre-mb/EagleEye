import React from 'react';

const AlltimeInsights: React.FC = () => {
  return (
    <>
      {/* All-Time Insight Card */}
      <div className="alltime-insight-card">
        <div className="alltime-insight-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 7H21V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h3 className="alltime-insight-title">All-Time Insight</h3>
          <p className="alltime-insight-text">
            Since tracking began, <strong>Zenoti has been the most active</strong> with 35 total releases. <strong>Analytics</strong> remains the most invested category across all competitors.
          </p>
        </div>
      </div>

      {/* All-Time Stats Cards */}
      <div className="alltime-stats-grid">
        <div className="alltime-stat-card">
          <h4 className="alltime-stat-label">Total Releases</h4>
          <p className="alltime-stat-value">120</p>
          <p className="alltime-stat-info blue-text">Since Oct 1, 2025</p>
        </div>

        <div className="alltime-stat-card">
          <h4 className="alltime-stat-label">Most Releases</h4>
          <p className="alltime-stat-value">Zenoti</p>
          <p className="alltime-stat-info purple-text">35 releases (29%)</p>
        </div>

        <div className="alltime-stat-card">
          <h4 className="alltime-stat-label">Top Category</h4>
          <p className="alltime-stat-value">Analytics</p>
          <p className="alltime-stat-info blue-text">28 releases (23%)</p>
        </div>

        <div className="alltime-stat-card">
          <h4 className="alltime-stat-label">Avg. per Week</h4>
          <p className="alltime-stat-value">16.7</p>
          <p className="alltime-stat-info green-text">Consistent growth</p>
        </div>
      </div>

      {/* Category Trends Over Time */}
      <div className="category-trends-section">
        <h3 className="category-trends-title">Category Trends Over Time</h3>

        <div className="category-trend-item">
          <div className="category-trend-header">
            <span className="category-trend-label">Analytics</span>
            <div className="category-trend-info">
              <span className="category-trend-count">28 releases</span>
              <span className="category-growth-badge">+200%</span>
            </div>
          </div>
          <div className="category-trend-bar">
            <div className="category-trend-fill" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="category-trend-item">
          <div className="category-trend-header">
            <span className="category-trend-label">Appointments</span>
            <div className="category-trend-info">
              <span className="category-trend-count">22 releases</span>
              <span className="category-growth-badge">+150%</span>
            </div>
          </div>
          <div className="category-trend-bar">
            <div className="category-trend-fill" style={{ width: '79%' }}></div>
          </div>
        </div>

        <div className="category-trend-item">
          <div className="category-trend-header">
            <span className="category-trend-label">Marketing Suite</span>
            <div className="category-trend-info">
              <span className="category-trend-count">18 releases</span>
              <span className="category-growth-badge">+120%</span>
            </div>
          </div>
          <div className="category-trend-bar">
            <div className="category-trend-fill" style={{ width: '64%' }}></div>
          </div>
        </div>

        <div className="category-trend-item">
          <div className="category-trend-header">
            <span className="category-trend-label">Payments</span>
            <div className="category-trend-info">
              <span className="category-trend-count">12 releases</span>
              <span className="category-growth-badge">+80%</span>
            </div>
          </div>
          <div className="category-trend-bar">
            <div className="category-trend-fill" style={{ width: '43%' }}></div>
          </div>
        </div>

        <div className="category-trend-item">
          <div className="category-trend-header">
            <span className="category-trend-label">Mobile</span>
            <div className="category-trend-info">
              <span className="category-trend-count">10 releases</span>
              <span className="category-growth-badge">+60%</span>
            </div>
          </div>
          <div className="category-trend-bar">
            <div className="category-trend-fill" style={{ width: '36%' }}></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AlltimeInsights;

