import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Release {
  id: number;
  competitor: string;
  competitorInitial: string;
  competitorColor: string;
  feature: string;
  summary: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
}

const Releases: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data
  const releases: Release[] = [
    {
      id: 1,
      competitor: 'Zenoti',
      competitorInitial: 'Z',
      competitorColor: '#a7f3d0',
      feature: 'Advanced Customer Segmentation',
      summary: 'New AI-powered customer segmentation with behavioral insights and predictive modeling.',
      category: 'Analytics',
      priority: 'High',
      date: 'Nov 1, 2025'
    },
    {
      id: 2,
      competitor: 'Mindbody',
      competitorInitial: 'M',
      competitorColor: '#bfdbfe',
      feature: 'Automated Appointment Reminders',
      summary: 'Smart reminder system with multi-channel delivery (SMS, Email, Push) and customizable templates.',
      category: 'Appointments',
      priority: 'High',
      date: 'Oct 31, 2025'
    },
    {
      id: 3,
      competitor: 'Boulevard',
      competitorInitial: 'B',
      competitorColor: '#a7f3d0',
      feature: 'Marketing Campaign Builder',
      summary: 'Drag-and-drop campaign builder with A/B testing and performance analytics.',
      category: 'Marketing Suite',
      priority: 'Medium',
      date: 'Oct 29, 2025'
    },
    {
      id: 4,
      competitor: 'Zenoti',
      competitorInitial: 'Z',
      competitorColor: '#a7f3d0',
      feature: 'Custom Report Designer',
      summary: 'Visual report builder with 50+ pre-built templates and scheduled exports.',
      category: 'Analytics',
      priority: 'High',
      date: 'Oct 27, 2025'
    },
    {
      id: 5,
      competitor: 'Vagaro',
      competitorInitial: 'V',
      competitorColor: '#c4b5fd',
      feature: 'Mobile App Booking Flow',
      summary: 'Redesigned mobile booking experience with 40% faster checkout process.',
      category: 'Appointments',
      priority: 'Medium',
      date: 'Oct 26, 2025'
    },
    {
      id: 6,
      competitor: 'Boulevard',
      competitorInitial: 'B',
      competitorColor: '#a7f3d0',
      feature: 'Client Retention Dashboard',
      summary: 'Real-time retention metrics with churn prediction and win-back campaigns.',
      category: 'Analytics',
      priority: 'High',
      date: 'Oct 24, 2025'
    },
    {
      id: 7,
      competitor: 'Mindbody',
      competitorInitial: 'M',
      competitorColor: '#bfdbfe',
      feature: 'Email Marketing Templates',
      summary: 'Library of 100+ professionally designed email templates for wellness businesses.',
      category: 'Marketing Suite',
      priority: 'Medium',
      date: 'Oct 23, 2025'
    },
    {
      id: 8,
      competitor: 'Zenoti',
      competitorInitial: 'Z',
      competitorColor: '#a7f3d0',
      feature: 'Waitlist Management',
      summary: 'Automated waitlist with smart notifications and priority-based booking.',
      category: 'Appointments',
      priority: 'High',
      date: 'Oct 21, 2025'
    }
  ];

  const handleConnectNotion = () => {
    navigate('/connect-notion');
  };

  return (
    <>
      {/* Search and Re-run Bar */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search releases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button className="rerun-button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.2091 2 12.1046 3.13258 13.1244 4.83337" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M14 2V5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Re-run Analysis
        </button>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="action-btn primary-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Manually
        </button>
        <button className="action-btn secondary-btn" onClick={handleConnectNotion}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <text x="8" y="11" fontSize="8" fontWeight="700" textAnchor="middle" fill="currentColor" fontFamily="system-ui">N</text>
          </svg>
          Connect Notion
        </button>
        <button className="action-btn secondary-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4L8 9L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          Send Email
        </button>
        <button className="action-btn secondary-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8V13H3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 3V10M8 10L5.5 7.5M8 10L10.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="releases-table">
          <thead>
            <tr>
              <th>Competitor</th>
              <th>Feature</th>
              <th>Summary</th>
              <th>Category</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((release) => (
              <tr key={release.id}>
                <td>
                  <div className="competitor-cell">
                    <div 
                      className="competitor-avatar" 
                      style={{ backgroundColor: release.competitorColor }}
                    >
                      {release.competitorInitial}
                    </div>
                    <div className="competitor-info">
                      <span className="competitor-name">{release.competitor}</span>
                      {release.competitor === 'Zenoti' && release.id === 1 && (
                        <span className="new-badge">New</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="feature-cell">{release.feature}</td>
                <td className="summary-cell">{release.summary}</td>
                <td>
                  <span className={`category-badge ${release.priority.toLowerCase()}`}>
                    {release.category}
                  </span>
                </td>
                <td className="date-cell">{release.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="table-footer">
        <p className="showing-text">Showing {releases.length} of {releases.length} releases</p>
      </div>
    </>
  );
};

export default Releases;

