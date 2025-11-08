import React, { useRef, forwardRef, useImperativeHandle } from 'react';

export type SummaryRef = {
  downloadPDF: () => Promise<void>;
}

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

interface SummaryProps {
  insights: InsightsData | null;
  isLoading: boolean;
  error: string | null;
}

const Summary = forwardRef<SummaryRef, SummaryProps>(({ insights, isLoading, error }, ref) => {
  const summaryContentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!summaryContentRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const button = document.querySelector('.weekly-actions .action-btn') as HTMLButtonElement;
      const originalText = button?.textContent;
      if (button) button.textContent = 'Generating PDF...';

      const canvas = await html2canvas(summaryContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `${timestamp}_Summary.pdf`;

      pdf.save(filename);

      if (button) button.textContent = originalText;

      console.log(`✅ PDF downloaded: ${filename}`);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  useImperativeHandle(ref, () => ({
    downloadPDF: handleDownloadPDF
  }));

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

  return (
    <div ref={summaryContentRef}>
      {/* Top Insight Card */}
      <div className="top-insight-card">
        <div className="top-insight-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <h3 className="top-insight-title">This Week's Top Insight</h3>
          <p className="top-insight-text">
            <strong>Zenoti dominated this week</strong> with 8 major releases focused on analytics and customer intelligence. They're clearly doubling down on data-driven features to compete with newer entrants.
          </p>
        </div>
      </div>

      {/* Insights Widgets */}
      <div className="weekly-stats-grid" style={{ marginTop: '20px', marginBottom: '30px' }}>
        {/* Total Releases Widget */}
        <div className="weekly-stat-card">
          <div className="weekly-stat-header">
            <span className="weekly-stat-label">Total Releases</span>
            <div className="weekly-stat-icon blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 7H21V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          {isLoading ? (
            <p className="weekly-stat-value">...</p>
          ) : error ? (
            <p className="weekly-stat-value" style={{ fontSize: '14px', color: '#ef4444' }}>Error</p>
          ) : (
            <>
              <p className="weekly-stat-value">{insights?.monthly_statistics.current_month.releases || 0}</p>
              <p className={`weekly-stat-change ${insights?.monthly_statistics.trend_direction === 'up' ? 'positive' : 'negative'}`}>
                {insights?.monthly_statistics.trend_direction === 'up' ? '↑' : '↓'} {insights?.monthly_statistics.trend} vs last month
              </p>
            </>
          )}
        </div>

        {/* Most Active Company Widget */}
        <div className="weekly-stat-card">
          <div className="weekly-stat-header">
            <span className="weekly-stat-label">Most Active</span>
            <div className="weekly-stat-icon purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          {isLoading ? (
            <p className="weekly-stat-value">...</p>
          ) : error ? (
            <p className="weekly-stat-value" style={{ fontSize: '14px', color: '#ef4444' }}>Error</p>
          ) : (
            <>
              <p className="weekly-stat-value">{insights?.most_active_company.company_name || 'N/A'}</p>
              <p className="weekly-stat-change purple-text">{insights?.most_active_company.release_count || 0} releases</p>
            </>
          )}
        </div>

        {/* Trending Category Widget */}
        <div className="weekly-stat-card">
          <div className="weekly-stat-header">
            <span className="weekly-stat-label">Trending Category</span>
            <div className="weekly-stat-icon purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                <path d="M12 8L14 12L12 16L10 12L12 8Z" fill="white"/>
              </svg>
            </div>
          </div>
          {isLoading ? (
            <p className="weekly-stat-value">...</p>
          ) : error ? (
            <p className="weekly-stat-value" style={{ fontSize: '14px', color: '#ef4444' }}>Error</p>
          ) : (
            <>
              <p className="weekly-stat-value">{insights ? formatCategory(insights.trending_category.category) : 'N/A'}</p>
              <p className="weekly-stat-change purple-text">{insights?.trending_category.current_month_releases || 0} releases this month</p>
            </>
          )}
        </div>
      </div>


      {/* Release Breakdown by Competitor */}
      <div className="release-breakdown-section">
        <h3 className="breakdown-title">Release Breakdown by Competitor</h3>

        {/* Zenoti */}
        <div className="competitor-breakdown">
          <div className="competitor-breakdown-header">
            <div className="competitor-breakdown-info">
              <div className="competitor-breakdown-avatar zenoti">Z</div>
              <div>
                <h4 className="competitor-breakdown-name">Zenoti</h4>
                <p className="competitor-breakdown-count">8 releases</p>
              </div>
            </div>
            <span className="competitor-percentage">44%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill zenoti-fill" style={{ width: '44%' }}></div>
          </div>
          <ul className="feature-list">
            <li>• Advanced Customer Segmentation</li>
            <li>• Custom Report Designer</li>
            <li>• Waitlist Management</li>
            <li className="more-features">• +5 more features</li>
          </ul>
        </div>

        {/* Mindbody */}
        <div className="competitor-breakdown">
          <div className="competitor-breakdown-header">
            <div className="competitor-breakdown-info">
              <div className="competitor-breakdown-avatar mindbody">M</div>
              <div>
                <h4 className="competitor-breakdown-name">Mindbody</h4>
                <p className="competitor-breakdown-count">5 releases</p>
              </div>
            </div>
            <span className="competitor-percentage">28%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill mindbody-fill" style={{ width: '28%' }}></div>
          </div>
          <ul className="feature-list">
            <li>• Automated Appointment Reminders</li>
            <li>• Email Marketing Templates</li>
            <li className="more-features">• +3 more features</li>
          </ul>
        </div>

        {/* Boulevard */}
        <div className="competitor-breakdown">
          <div className="competitor-breakdown-header">
            <div className="competitor-breakdown-info">
              <div className="competitor-breakdown-avatar boulevard">B</div>
              <div>
                <h4 className="competitor-breakdown-name">Boulevard</h4>
                <p className="competitor-breakdown-count">3 releases</p>
              </div>
            </div>
            <span className="competitor-percentage">17%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill boulevard-fill" style={{ width: '17%' }}></div>
          </div>
          <ul className="feature-list">
            <li>• Marketing Campaign Builder</li>
            <li>• Client Retention Dashboard</li>
            <li className="more-features">• +1 more feature</li>
          </ul>
        </div>

        {/* Vagaro */}
        <div className="competitor-breakdown">
          <div className="competitor-breakdown-header">
            <div className="competitor-breakdown-info">
              <div className="competitor-breakdown-avatar vagaro">V</div>
              <div>
                <h4 className="competitor-breakdown-name">Vagaro</h4>
                <p className="competitor-breakdown-count">2 releases</p>
              </div>
            </div>
            <span className="competitor-percentage">11%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill vagaro-fill" style={{ width: '11%' }}></div>
          </div>
          <ul className="feature-list">
            <li>• Mobile App Booking Flow</li>
            <li className="more-features">• +1 more feature</li>
          </ul>
        </div>
      </div>

      {/* Notable Releases This Week */}
      <div className="notable-releases-section">
        <h3 className="notable-releases-title">Notable Releases This Week</h3>

        {/* Zenoti Release */}
        <div className="notable-release-card zenoti-border">
          <div className="notable-release-header">
            <span className="notable-competitor">Zenoti</span>
            <span className="notable-category analytics">Analytics</span>
          </div>
          <h4 className="notable-feature-title">Advanced Customer Segmentation</h4>
          <p className="notable-feature-description">
            AI-powered segmentation with behavioral insights and predictive modeling.
          </p>
        </div>

        {/* Mindbody Release */}
        <div className="notable-release-card mindbody-border">
          <div className="notable-release-header">
            <span className="notable-competitor">Mindbody</span>
            <span className="notable-category appointments">Appointments</span>
          </div>
          <h4 className="notable-feature-title">Automated Appointment Reminders</h4>
          <p className="notable-feature-description">
            Multi-channel delivery system with customizable templates.
          </p>
        </div>

        {/* Boulevard Release */}
        <div className="notable-release-card boulevard-border">
          <div className="notable-release-header">
            <span className="notable-competitor">Boulevard</span>
            <span className="notable-category marketing">Marketing Suite</span>
          </div>
          <h4 className="notable-feature-title">Marketing Campaign Builder</h4>
          <p className="notable-feature-description">
            Drag-and-drop builder with A/B testing capabilities.
          </p>
        </div>
      </div>
    </div>
  );
});

Summary.displayName = 'Summary';

export default Summary;

