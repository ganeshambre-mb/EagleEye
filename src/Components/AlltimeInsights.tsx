import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { AUTH_HEADER } from '../constants/auth';

export type AlltimeInsightsRef = {
  downloadPDF: () => Promise<void>;
}

interface FeatureResponse {
  id: number;
  name?: string;
  summary?: string;
  category?: string;
  version?: string | null;
  release_date?: string;
  highlights?: string[];
  company_id?: number;
  company_name?: string;
}

interface AllTimeStats {
  totalReleases: number;
  mostActiveCompany: {
    name: string;
    count: number;
    percentage: number;
  } | null;
  topCategory: {
    name: string;
    count: number;
    percentage: number;
  } | null;
  avgPerWeek: number;
  earliestDate: string | null;
  categoryTrends: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

// Helper function to format category names
const formatCategory = (category: string): string => {
  const categoryMap: { [key: string]: string } = {
    'APPOINTMENTS': 'Appointments',
    'ANALYTICS': 'Analytics',
    'MARKETING_SUITE': 'Marketing Suite',
    'MARKETING': 'Marketing Suite',
    'PAYMENTS': 'Payments',
    'MOBILE': 'Mobile',
    'MEMBERSHIP': 'Membership',
    'OTHER': 'Other'
  };
  
  return categoryMap[category?.toUpperCase()] || 
         category?.charAt(0).toUpperCase() + category?.slice(1).toLowerCase().replace(/_/g, ' ') || 'Other';
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const AlltimeInsights = forwardRef<AlltimeInsightsRef, {}>((_props, ref) => {
  const alltimeContentRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<AllTimeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadPDF = async () => {
    if (!alltimeContentRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const button = document.querySelector('.weekly-actions .action-btn') as HTMLButtonElement;
      const originalText = button?.textContent;
      if (button) button.textContent = 'Generating PDF...';

      const canvas = await html2canvas(alltimeContentRef.current, {
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
      const filename = `${timestamp}_AlltimeInsights.pdf`;

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

  // Fetch all-time data
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchAllTimeData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        console.log('[AlltimeInsights] Fetching all-time data...');
        
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
        const features = Array.isArray(responseData) ? responseData : (responseData.data || responseData.features || []);
        
        if (!Array.isArray(features)) {
          throw new Error('Invalid features data format received from API');
        }
        
        console.log('[AlltimeInsights] Processing', features.length, 'features for all-time stats');
        
        // Track unique releases (release_date + company_name)
        const uniqueReleasesSet = new Set<string>();
        const companyReleasesMap = new Map<string, number>();
        // Track unique category releases (category + release_date + company_name)
        const categoryReleasesSet = new Set<string>();
        const categoryReleasesMap = new Map<string, number>();
        const releaseDates: Date[] = [];
        
        features.forEach((feature: FeatureResponse) => {
          if (!feature.release_date || !feature.company_name) return;
          
          try {
            const releaseDate = new Date(feature.release_date);
            if (isNaN(releaseDate.getTime())) return;
            
            // Create unique release key (company + date)
            const dateKey = releaseDate.toISOString().split('T')[0];
            const releaseKey = `${feature.company_name}|${dateKey}`;
            
            // Track unique releases
            if (!uniqueReleasesSet.has(releaseKey)) {
              uniqueReleasesSet.add(releaseKey);
              
              // Count releases per company
              const companyCount = companyReleasesMap.get(feature.company_name) || 0;
              companyReleasesMap.set(feature.company_name, companyCount + 1);
              
              // Track release dates for calculating weeks
              releaseDates.push(releaseDate);
            }
            
            // Count releases per category (unique category + release_date + company_name)
            if (feature.category) {
              const category = formatCategory(feature.category);
              const categoryReleaseKey = `${category}|${feature.company_name}|${dateKey}`;
              
              if (!categoryReleasesSet.has(categoryReleaseKey)) {
                categoryReleasesSet.add(categoryReleaseKey);
                const categoryCount = categoryReleasesMap.get(category) || 0;
                categoryReleasesMap.set(category, categoryCount + 1);
              }
            }
          } catch (e) {
            console.warn('[AlltimeInsights] Error processing feature:', feature.id, e);
          }
        });
        
        // Calculate statistics
        const totalReleases = uniqueReleasesSet.size;
        
        // Find most active company
        let mostActiveCompany: { name: string; count: number; percentage: number } | null = null;
        if (companyReleasesMap.size > 0) {
          const sortedCompanies = Array.from(companyReleasesMap.entries())
            .sort((a, b) => b[1] - a[1]);
          const [companyName, count] = sortedCompanies[0];
          mostActiveCompany = {
            name: companyName,
            count: count,
            percentage: totalReleases > 0 ? Math.round((count / totalReleases) * 100) : 0
          };
        }
        
        // Find top category
        let topCategory: { name: string; count: number; percentage: number } | null = null;
        if (categoryReleasesMap.size > 0) {
          const sortedCategories = Array.from(categoryReleasesMap.entries())
            .sort((a, b) => b[1] - a[1]);
          const [categoryName, count] = sortedCategories[0];
          topCategory = {
            name: categoryName,
            count: count,
            percentage: totalReleases > 0 ? Math.round((count / totalReleases) * 100) : 0
          };
        }
        
        // Calculate average per week
        let avgPerWeek = 0;
        if (releaseDates.length > 0) {
          const sortedDates = releaseDates.sort((a, b) => a.getTime() - b.getTime());
          const earliestDate = sortedDates[0];
          const latestDate = sortedDates[sortedDates.length - 1];
          const daysDiff = Math.max(1, Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)));
          const weeksDiff = daysDiff / 7;
          avgPerWeek = weeksDiff > 0 ? parseFloat((totalReleases / weeksDiff).toFixed(1)) : totalReleases;
        }
        
        // Get earliest date
        const earliestDate = releaseDates.length > 0 
          ? releaseDates.sort((a, b) => a.getTime() - b.getTime())[0].toISOString().split('T')[0]
          : null;
        
        // Get category trends (top 5)
        const categoryTrends = Array.from(categoryReleasesMap.entries())
          .map(([category, count]) => ({
            category,
            count,
            percentage: totalReleases > 0 ? Math.round((count / totalReleases) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        if (isMounted) {
          setStats({
            totalReleases,
            mostActiveCompany,
            topCategory,
            avgPerWeek,
            earliestDate,
            categoryTrends
          });
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('[AlltimeInsights] Fetch aborted');
          return;
        }
        console.error('[AlltimeInsights] Error fetching all-time data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load all-time data');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchAllTimeData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  return (
    <div ref={alltimeContentRef}>
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
          {isLoading ? (
            <p className="alltime-insight-text">Loading all-time insights...</p>
          ) : error ? (
            <p className="alltime-insight-text" style={{ color: '#ef4444' }}>Error loading data: {error}</p>
          ) : stats ? (
            <p className="alltime-insight-text">
              Since tracking began{stats.earliestDate ? ` (${new Date(stats.earliestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})` : ''}, 
              {stats.mostActiveCompany ? (
                <> <strong>{stats.mostActiveCompany.name} has been the most active</strong> with {stats.mostActiveCompany.count} total releases.</>
              ) : (
                <> we've tracked <strong>{stats.totalReleases} total releases</strong>.</>
              )}
              {stats.topCategory && (
                <> <strong>{stats.topCategory.name}</strong> remains the most invested category across all competitors.</>
              )}
            </p>
          ) : (
            <p className="alltime-insight-text">No data available</p>
          )}
        </div>
      </div>

      {/* All-Time Stats Cards */}
      <div className="alltime-stats-grid">
        <div className="alltime-stat-card">
          <h4 className="alltime-stat-label">Total Releases</h4>
          {isLoading ? (
            <p className="alltime-stat-value">...</p>
          ) : error ? (
            <p className="alltime-stat-value" style={{ fontSize: '14px', color: '#ef4444' }}>Error</p>
          ) : (
            <>
              <p className="alltime-stat-value">{stats?.totalReleases || 0}</p>
              <p className="alltime-stat-info blue-text">
                {stats?.earliestDate 
                  ? `Since ${new Date(stats.earliestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : 'All time'}
              </p>
            </>
          )}
        </div>

        <div className="alltime-stat-card">
          <h4 className="alltime-stat-label">Most Releases</h4>
          {isLoading ? (
            <p className="alltime-stat-value">...</p>
          ) : error ? (
            <p className="alltime-stat-value" style={{ fontSize: '14px', color: '#ef4444' }}>Error</p>
          ) : stats?.mostActiveCompany ? (
            <>
              <p className="alltime-stat-value">{stats.mostActiveCompany.name}</p>
              <p className="alltime-stat-info purple-text">
                {stats.mostActiveCompany.count} releases ({stats.mostActiveCompany.percentage}%)
              </p>
            </>
          ) : (
            <>
              <p className="alltime-stat-value">N/A</p>
              <p className="alltime-stat-info purple-text">No data</p>
            </>
          )}
        </div>

        <div className="alltime-stat-card">
          <h4 className="alltime-stat-label">Top Category</h4>
          {isLoading ? (
            <p className="alltime-stat-value">...</p>
          ) : error ? (
            <p className="alltime-stat-value" style={{ fontSize: '14px', color: '#ef4444' }}>Error</p>
          ) : stats?.topCategory ? (
            <>
              <p className="alltime-stat-value">{stats.topCategory.name}</p>
              <p className="alltime-stat-info blue-text">
                {stats.topCategory.count} releases ({stats.topCategory.percentage}%)
              </p>
            </>
          ) : (
            <>
              <p className="alltime-stat-value">N/A</p>
              <p className="alltime-stat-info blue-text">No data</p>
            </>
          )}
        </div>

        <div className="alltime-stat-card">
          <h4 className="alltime-stat-label">Avg. per Week</h4>
          {isLoading ? (
            <p className="alltime-stat-value">...</p>
          ) : error ? (
            <p className="alltime-stat-value" style={{ fontSize: '14px', color: '#ef4444' }}>Error</p>
          ) : (
            <>
              <p className="alltime-stat-value">{stats?.avgPerWeek || 0}</p>
              <p className="alltime-stat-info green-text">Consistent growth</p>
            </>
          )}
        </div>
      </div>

      {/* Category Trends Over Time */}
      <div className="category-trends-section">
        <h3 className="category-trends-title">Category Trends Over Time</h3>

        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Loading category trends...</p>
        ) : error ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>Unable to load category trends</p>
        ) : stats?.categoryTrends && stats.categoryTrends.length > 0 ? (
          stats.categoryTrends.map((trend, index) => {
            const maxCount = stats.categoryTrends[0]?.count || 1;
            const widthPercentage = (trend.count / maxCount) * 100;
            
            return (
              <div key={index} className="category-trend-item">
                <div className="category-trend-header">
                  <span className="category-trend-label">{trend.category}</span>
                  <div className="category-trend-info">
                    <span className="category-trend-count">{trend.count} releases</span>
                    <span className="category-growth-badge">{trend.percentage}%</span>
                  </div>
                </div>
                <div className="category-trend-bar">
                  <div className="category-trend-fill" style={{ width: `${widthPercentage}%` }}></div>
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>No category trends available</p>
        )}
      </div>
    </div>
  );
});

AlltimeInsights.displayName = 'AlltimeInsights';

export default AlltimeInsights;

