import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { AUTH_HEADER } from '../constants/auth';

export type SummaryRef = {
  downloadPDF: () => Promise<void>;
}

interface WeeklyRelease {
  id: number;
  name: string;
  summary: string;
  category: string;
  version: string | null;
  release_date: string;
  highlights: string[];
  company_id: number;
  company_name: string;
}

// Type for API feature response (can be WeeklyRelease or APIFeature format)
type FeatureResponse = WeeklyRelease | {
  id: number;
  name?: string;
  summary?: string;
  category?: string;
  version?: string | null;
  release_date?: string;
  highlights?: string[];
  company_id?: number;
  company_name?: string;
};

interface CompanyData {
  company: {
    id: number;
    name: string;
    homepage_url: string;
    is_active: boolean;
    last_check_at: string;
  };
  week_summary: {
    total_releases: number;
    total_features: number;
    last_week_releases: number;
    trend: string;
    trend_direction: string;
  };
  category_distribution: Array<{
    category: string;
    count: number;
  }>;
  all_features: WeeklyRelease[];
}

interface WeeklyReleasesData {
  companies: CompanyData[];
  overall_summary?: {
    total_releases: number;
    total_features: number;
    active_companies: number;
  };
  generated_at: string;
}

interface InsightsData {
  weekly_statistics?: {
    current_week: {
      week_start: string;
      week_end: string;
      releases: number;
    };
    last_week: {
      week_start: string;
      week_end: string;
      releases: number;
    };
    week_before_last?: {
      week_start: string;
      week_end: string;
      releases: number;
    };
    trend: string;
    trend_direction: 'up' | 'down';
  };
  monthly_statistics?: {
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
    last_week_releases?: number;
    change?: number;
  } | null;
  trending_category: {
    category: string;
    current_week?: number;
    last_week?: number;
    growth?: number;
    growth_rate?: number;
    total_releases?: number;
    current_month_releases?: number;
    last_month_releases?: number;
  } | null;
  top_categories_current_week?: Array<{
    category: string;
    releases: number;
  }>;
  top_categories_current_month?: Array<{
    category: string;
    releases: number;
  }>;
  daily_breakdown?: Array<{
    day: string;
    date: string;
    releases: number;
  }>;
  weekly_trend?: Array<{
    week: string;
    start_date: string;
    end_date: string;
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
  const [weeklyReleases, setWeeklyReleases] = useState<WeeklyReleasesData | null>(null);
  const [weeklyReleasesLoading, setWeeklyReleasesLoading] = useState(true);
  const [weeklyReleasesError, setWeeklyReleasesError] = useState<string | null>(null);

  // Fetch weekly releases data
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchWeeklyReleases = async () => {
      setWeeklyReleasesLoading(true);
      setWeeklyReleasesError(null);
      
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        // Fetch recent features and group by company
        console.log('[Summary] Fetching features...');
        const response = await fetch(`${baseURL}/features?skip=0&limit=1000`, {
          signal: abortController.signal,
          headers: {
            'Authorization': AUTH_HEADER
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('[Summary] Features data received:', responseData);
        
        // Handle different response formats (array or object with data property)
        const features = Array.isArray(responseData) ? responseData : (responseData.data || responseData.features || []);
        
        if (!Array.isArray(features)) {
          console.error('[Summary] Invalid features data format:', features);
          throw new Error('Invalid features data format received from API');
        }
        
        console.log('[Summary] Processing', features.length, 'features');
        
        // Calculate current week boundaries (Monday to Sunday)
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        // Get the start of the current week (Monday)
        const currentWeekStart = new Date(today);
        const dayOfWeek = currentWeekStart.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6 days back
        currentWeekStart.setDate(currentWeekStart.getDate() - daysToMonday);
        currentWeekStart.setHours(0, 0, 0, 0); // Start of Monday
        
        // Get the end of the current week (Sunday)
        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekEnd.getDate() + 6); // Add 6 days to get Sunday
        currentWeekEnd.setHours(23, 59, 59, 999); // End of Sunday
        
        console.log('[Summary] Current week range:', currentWeekStart.toISOString(), 'to', currentWeekEnd.toISOString());
        
        // Filter features that fall within the current week based on release_date
        const weeklyFeatures = features.filter((feature: FeatureResponse) => {
          if (!feature.release_date) {
            console.warn('[Summary] Feature missing release_date:', feature);
            return false;
          }
          try {
            const releaseDate = new Date(feature.release_date);
            // Check if date is valid and within the current week
            const isValidDate = !isNaN(releaseDate.getTime());
            const isWithinCurrentWeek = releaseDate >= currentWeekStart && releaseDate <= currentWeekEnd;
            
            if (!isValidDate) {
              console.warn('[Summary] Invalid release date format:', feature.release_date);
            }
            
            return isValidDate && isWithinCurrentWeek;
          } catch (e) {
            console.warn('[Summary] Error parsing release date:', feature.release_date, e);
            return false;
          } 
        });
        
        console.log('[Summary] Filtered weekly features (current week):', weeklyFeatures.length, 'out of', features.length);
        
        // Group features by company for the current week
        const companiesMap = new Map<string, CompanyData>();
        // Track unique releases within the week (release_date + company_name combinations)
        // Multiple features from the same company on the same release_date count as one release
        const uniqueReleasesSet = new Set<string>();
        
        weeklyFeatures.forEach((feature: FeatureResponse) => {
          // Handle both WeeklyRelease interface and APIFeature interface
          const companyName = feature.company_name || 'Unknown';
          const featureId = feature.id;
          const featureName = feature.name || 'Unnamed Feature';
          const featureSummary = feature.summary || '';
          const featureCategory = feature.category || 'Other';
          const featureReleaseDate = feature.release_date || new Date().toISOString();
          const featureHighlights = feature.highlights || [];
          const companyId = feature.company_id || 0;
          const featureVersion = feature.version || null;
          
          // Create a unique key for release_date + company_name
          // Normalize the date to just the date part (without time) for grouping
          // This ensures features released on the same date by the same company count as one release
          const releaseDate = new Date(featureReleaseDate);
          if (isNaN(releaseDate.getTime())) {
            console.warn('[Summary] Invalid release date for feature:', featureId, featureReleaseDate);
            return; // Skip invalid dates
          }
          const dateKey = releaseDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          const releaseKey = `${companyName}|${dateKey}`;
          
          if (!companiesMap.has(companyName)) {
            companiesMap.set(companyName, {
              company: {
                id: companyId,
                name: companyName,
                homepage_url: '',
                is_active: true,
                last_check_at: new Date().toISOString()
              },
              week_summary: {
                total_releases: 0,
                total_features: 0,
                last_week_releases: 0,
                trend: 'steady',
                trend_direction: 'up'
              },
              category_distribution: [],
              all_features: []
            });
          }
          
          const companyData = companiesMap.get(companyName);
          if (companyData) {
            // Always increment total_features (count of all features)
            companyData.week_summary.total_features++;
            
            // Only increment total_releases if this is a unique release_date + company_name combination
            if (!uniqueReleasesSet.has(releaseKey)) {
              uniqueReleasesSet.add(releaseKey);
              companyData.week_summary.total_releases++;
            }
            
            companyData.all_features.push({
              id: featureId,
              name: featureName,
              summary: featureSummary,
              category: featureCategory,
              version: featureVersion,
              release_date: featureReleaseDate,
              highlights: featureHighlights,
              company_id: companyId,
              company_name: companyName
            });
          }
        });
        
        // Calculate total unique releases across all companies
        const totalUniqueReleases = Array.from(companiesMap.values()).reduce(
          (sum, company) => sum + company.week_summary.total_releases,
          0
        );
        
        // Log breakdown by company
        console.log('[Summary] Weekly breakdown by company:');
        Array.from(companiesMap.values()).forEach(company => {
          console.log(`  ${company.company.name}: ${company.week_summary.total_releases} releases, ${company.week_summary.total_features} features`);
        });
        console.log(`[Summary] Total: ${totalUniqueReleases} unique releases, ${weeklyFeatures.length} total features`);
        
        // Convert to array format expected by the component
        const weeklyReleasesData: WeeklyReleasesData = {
          companies: Array.from(companiesMap.values()),
          overall_summary: {
            total_releases: totalUniqueReleases,
            total_features: weeklyFeatures.length,
            active_companies: companiesMap.size
          },
          generated_at: new Date().toISOString()
        };
        
        console.log('[Summary] Transformed weekly releases data:', weeklyReleasesData);
        
        if (isMounted) {
          setWeeklyReleases(weeklyReleasesData);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[Summary] Fetch aborted');
          return;
        }
        console.error('[Summary] Error fetching features:', error);
        if (isMounted) {
          setWeeklyReleasesError(error instanceof Error ? error.message : 'Failed to load release data');
        }
      } finally {
        if (isMounted) {
          setWeeklyReleasesLoading(false);
        }
      }
    };

    fetchWeeklyReleases();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

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
      'MOBILE_APPS': 'Mobile Apps',
      'MEMBERSHIP': 'Membership',
      'AUTOMATION': 'Automation',
      'OTHER': 'Other'
    };
    
    return categoryMap[category.toUpperCase()] || 
           category.charAt(0).toUpperCase() + category.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  // Helper function to get competitor colors
  const getCompetitorColor = (companyName: string): string => {
    const colorMap: { [key: string]: string } = {
      'zenoti': 'zenoti',
      'Zenoti': 'zenoti',
      'mindbody': 'mindbody',
      'Mindbody': 'mindbody',
      'boulevard': 'boulevard',
      'Boulevard': 'boulevard',
      'vagaro': 'vagaro',
      'Vagaro': 'vagaro',
      'zen planner': 'zenoti',
      'Zen Planner': 'zenoti',
      'wellnessliving': 'mindbody',
      'WellnessLiving': 'mindbody',
      'glofox': 'boulevard',
      'Glofox': 'boulevard',
      'momence': 'vagaro',
      'Momence': 'vagaro',
      'ezfacility': 'zenoti',
      'EZFacility': 'zenoti',
      'hapana': 'mindbody',
      'Hapana': 'mindbody'
    };
    return colorMap[companyName] || 'zenoti';
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
          <h3 className="top-insight-title" style={{ textAlign: 'left' }}>This Week's Top Insight</h3>
          {isLoading ? (
            <p className="top-insight-text" style={{ textAlign: 'left' }}>Loading insights...</p>
          ) : error ? (
            <p className="top-insight-text" style={{ textAlign: 'left', color: '#ef4444' }}>Unable to load insights</p>
          ) : insights ? (
            <p className="top-insight-text" style={{ textAlign: 'left' }}>
              {(() => {
                const company = insights.most_active_company?.company_name || 'No company';
                const releases = insights.most_active_company?.release_count || 0;
                const topCategory = insights.trending_category?.category ? formatCategory(insights.trending_category.category) : 'various categories';
                const categoryReleases = insights.trending_category?.current_week || insights.trending_category?.current_month_releases || 0;
                const trend = insights.weekly_statistics?.trend || insights.monthly_statistics?.trend || '';
                const totalReleases = insights.weekly_statistics?.current_week?.releases || insights.monthly_statistics?.current_month?.releases || 0;
                
                // Generate dynamic insight based on the data
                if (insights.weekly_statistics && trend && parseFloat(trend.replace('%', '')) > 1000) {
                  return (
                    <>
                      <strong>{company} had an exceptional week</strong> with {releases} releases, representing a massive {trend} increase. 
                      {topCategory !== 'various categories' && ` The focus on ${topCategory.toLowerCase()} (${categoryReleases} releases) shows a clear strategic priority in this area.`}
                    </>
                  );
                } else if (insights.most_active_company?.change && insights.most_active_company.change > 50) {
                  return (
                    <>
                      <strong>{company} significantly accelerated their release velocity</strong> with {releases} releases this week, 
                      up by {insights.most_active_company.change} from last week. {topCategory !== 'various categories' && `${topCategory} emerged as the key focus area.`}
                    </>
                  );
                } else if (releases > 0 || totalReleases > 0) {
                  return (
                    <>
                      {releases > 0 ? (
                        <>
                          <strong>{company} led this week</strong> with {releases} releases. 
                          {topCategory !== 'various categories' && ` The emphasis on ${topCategory.toLowerCase()} (${categoryReleases} releases) indicates their current development priorities.`}
                        </>
                      ) : (
                        <>
                          <strong>This week saw {totalReleases} total releases</strong> across all companies.
                          {topCategory !== 'various categories' && ` ${topCategory} was the most active category with ${categoryReleases} releases.`}
                        </>
                      )}
                    </>
                  );
                } else {
                  return (
                    <>
                      <strong>Release activity was limited this week</strong> with {totalReleases} total releases.
                      {topCategory !== 'various categories' && ` ${topCategory} was the most active category.`}
                      Teams appear to be in a consolidation phase.
                    </>
                  );
                }
              })()}
            </p>
          ) : (
            <p className="top-insight-text" style={{ textAlign: 'left' }}>
              <strong>No data available</strong> for this week's insights. Check back later for updated information.
            </p>
          )}
        </div>
      </div>

      {/* Insights Widgets */}
      <div className="weekly-stats-grid" style={{ marginTop: '20px', marginBottom: '30px' }}>
        {/* Total Releases Widget */}
        <div className="weekly-stat-card">
          <div className="weekly-stat-header">
            <span className="weekly-stat-label" style={{ textAlign: 'left' }}>Total Releases</span>
            <div className="weekly-stat-icon blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 7H21V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          {isLoading ? (
            <p className="weekly-stat-value" style={{ textAlign: 'left' }}>...</p>
          ) : error ? (
            <p className="weekly-stat-value" style={{ fontSize: '14px', color: '#ef4444', textAlign: 'left' }}>Error</p>
          ) : (
            <>
              <p className="weekly-stat-value" style={{ textAlign: 'left' }}>
                {insights?.weekly_statistics?.current_week?.releases || 
                 insights?.monthly_statistics?.current_month?.releases || 0}
              </p>
              <p className={`weekly-stat-change ${
                (insights?.weekly_statistics?.trend_direction || insights?.monthly_statistics?.trend_direction) === 'up' 
                  ? 'positive' : 'negative'
              }`} style={{ textAlign: 'left' }}>
                {(insights?.weekly_statistics?.trend_direction || insights?.monthly_statistics?.trend_direction) === 'up' ? '↑' : '↓'} 
                {insights?.weekly_statistics?.trend || insights?.monthly_statistics?.trend || ''} 
                {insights?.weekly_statistics ? ' vs last week' : ' vs last month'}
              </p>
            </>
          )}
        </div>

        {/* Most Active Company Widget */}
        <div className="weekly-stat-card">
          <div className="weekly-stat-header">
            <span className="weekly-stat-label" style={{ textAlign: 'left' }}>Most Active</span>
            <div className="weekly-stat-icon purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          {isLoading ? (
            <p className="weekly-stat-value" style={{ textAlign: 'left' }}>...</p>
          ) : error ? (
            <p className="weekly-stat-value" style={{ fontSize: '14px', color: '#ef4444', textAlign: 'left' }}>Error</p>
          ) : (
            <>
              <p className="weekly-stat-value" style={{ textAlign: 'left' }}>{insights?.most_active_company?.company_name || 'N/A'}</p>
              <p className="weekly-stat-change purple-text" style={{ textAlign: 'left' }}>{insights?.most_active_company?.release_count || 0} releases</p>
            </>
          )}
        </div>

        {/* Trending Category Widget */}
        <div className="weekly-stat-card">
          <div className="weekly-stat-header">
            <span className="weekly-stat-label" style={{ textAlign: 'left' }}>Trending Category</span>
            <div className="weekly-stat-icon purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                <path d="M12 8L14 12L12 16L10 12L12 8Z" fill="white"/>
              </svg>
            </div>
          </div>
          {isLoading ? (
            <p className="weekly-stat-value" style={{ textAlign: 'left' }}>...</p>
          ) : error ? (
            <p className="weekly-stat-value" style={{ fontSize: '14px', color: '#ef4444', textAlign: 'left' }}>Error</p>
          ) : (
            <>
              <p className="weekly-stat-value" style={{ textAlign: 'left' }}>{insights?.trending_category?.category ? formatCategory(insights.trending_category.category) : 'N/A'}</p>
              <p className="weekly-stat-change purple-text" style={{ textAlign: 'left' }}>
                {insights?.trending_category?.current_week || 
                 insights?.trending_category?.current_month_releases || 0} releases 
                {insights?.weekly_statistics ? ' this week' : ' this month'}
              </p>
            </>
          )}
        </div>
      </div>


      {/* Release Breakdown by Competitor */}
      <div className="release-breakdown-section">
        <h3 className="breakdown-title" style={{ textAlign: 'left' }}>Release Breakdown</h3>

        {weeklyReleasesLoading ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Loading release breakdown...</p>
        ) : weeklyReleasesError ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>Unable to load release breakdown</p>
        ) : weeklyReleases && weeklyReleases.companies && weeklyReleases.companies.length > 0 ? (
          (() => {
            // Calculate total releases across all companies
            const totalReleases = weeklyReleases.companies.reduce((sum, c) => sum + c.week_summary.total_releases, 0);
            
            return weeklyReleases.companies
              .filter(c => c.week_summary.total_releases > 0)
              .sort((a, b) => b.week_summary.total_releases - a.week_summary.total_releases)
              .slice(0, 4)
              .map((companyData) => {
                const percentage = totalReleases > 0 
                  ? Math.round((companyData.week_summary.total_releases / totalReleases) * 100)
                  : 0;
                const colorClass = getCompetitorColor(companyData.company.name);
                const firstLetter = companyData.company.name.charAt(0).toUpperCase();
                
                return (
                  <div key={companyData.company.id} className="competitor-breakdown">
                    <div className="competitor-breakdown-header">
                      <div className="competitor-breakdown-info">
                        <div className={`competitor-breakdown-avatar ${colorClass}`}>{firstLetter}</div>
                        <div>
                          <h4 className="competitor-breakdown-name" style={{ textAlign: 'left' }}>{companyData.company.name}</h4>
                          <p className="competitor-breakdown-count" style={{ textAlign: 'left' }}>{companyData.week_summary.total_releases} releases</p>
                        </div>
                      </div>
                      <span className="competitor-percentage">{percentage}%</span>
                    </div>
                    <div className="progress-bar" style={{ 
                      marginTop: '12px', 
                      marginBottom: '16px',
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div className={`progress-fill ${colorClass}-fill`} style={{ 
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: colorClass === 'zenoti' ? '#7c3aed' : 
                                         colorClass === 'mindbody' ? '#2563eb' :
                                         colorClass === 'boulevard' ? '#10b981' :
                                         colorClass === 'vagaro' ? '#f59e0b' : '#7c3aed',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                    <ul className="feature-list" style={{ textAlign: 'left' }}>
                      {companyData.all_features.slice(0, 3).map((feature) => (
                        <li key={feature.id} style={{ textAlign: 'left' }}>• {feature.name}</li>
                      ))}
                      {companyData.all_features.length > 3 && (
                        <li className="more-features" style={{ textAlign: 'left' }}>• +{companyData.all_features.length - 3} more features</li>
                      )}
                    </ul>
                  </div>
                );
              });
          })()
        ) : (
          // Fallback to static content if no data
          <>
            <div className="competitor-breakdown">
              <div className="competitor-breakdown-header">
                <div className="competitor-breakdown-info">
                  <div className="competitor-breakdown-avatar zenoti">Z</div>
                  <div>
                    <h4 className="competitor-breakdown-name" style={{ textAlign: 'left' }}>Zenoti</h4>
                    <p className="competitor-breakdown-count" style={{ textAlign: 'left' }}>0 releases</p>
                  </div>
                </div>
                <span className="competitor-percentage">0%</span>
              </div>
              <div className="progress-bar" style={{ 
                marginTop: '12px', 
                marginBottom: '16px',
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div className="progress-fill zenoti-fill" style={{ 
                  width: '0%',
                  height: '100%',
                  backgroundColor: '#7c3aed',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <ul className="feature-list" style={{ textAlign: 'left' }}>
                <li style={{ color: '#9ca3af', textAlign: 'left' }}>No releases this week</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Notable Releases This Week */}
      <div className="notable-releases-section">
        <h3 className="notable-releases-title" style={{ textAlign: 'left' }}>Notable Releases This Week</h3>

        {/* Zenoti Release */}
        <div className="notable-release-card zenoti-border">
          <div className="notable-release-header">
            <span className="notable-competitor" style={{ textAlign: 'left' }}>Zenoti</span>
            <span className="notable-category analytics">Analytics</span>
          </div>
          <h4 className="notable-feature-title" style={{ textAlign: 'left' }}>Advanced Customer Segmentation</h4>
          <p className="notable-feature-description" style={{ textAlign: 'left' }}>
            AI-powered segmentation with behavioral insights and predictive modeling.
          </p>
        </div>

        {/* Mindbody Release */}
        <div className="notable-release-card mindbody-border">
          <div className="notable-release-header">
            <span className="notable-competitor" style={{ textAlign: 'left' }}>Mindbody</span>
            <span className="notable-category appointments">Appointments</span>
          </div>
          <h4 className="notable-feature-title" style={{ textAlign: 'left' }}>Automated Appointment Reminders</h4>
          <p className="notable-feature-description" style={{ textAlign: 'left' }}>
            Multi-channel delivery system with customizable templates.
          </p>
        </div>

        {/* Boulevard Release */}
        <div className="notable-release-card boulevard-border">
          <div className="notable-release-header">
            <span className="notable-competitor" style={{ textAlign: 'left' }}>Boulevard</span>
            <span className="notable-category marketing">Marketing Suite</span>
          </div>
          <h4 className="notable-feature-title" style={{ textAlign: 'left' }}>Marketing Campaign Builder</h4>
          <p className="notable-feature-description" style={{ textAlign: 'left' }}>
            Drag-and-drop builder with A/B testing capabilities.
          </p>
        </div>
      </div>
    </div>
  );
});

Summary.displayName = 'Summary';

export default Summary;

