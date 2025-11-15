import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataService from '../services/DataService';
import type { EmailPayload } from '../services/DataService';
import { useNotion } from '../context/NotionContext';
import { EMAIL_BODY, EMAIL_SUBJECT, EMAIL_FILENAME } from '../constants/emailConstants';

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
  const { isConnected } = useNotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableFooterRef = useRef<HTMLDivElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // State for releases data
  const [releases, setReleases] = useState<Release[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Helper function to generate competitor color based on name
  const getCompetitorColor = (competitor: string): string => {
    const colors = ['#a7f3d0', '#bfdbfe', '#c4b5fd', '#fbbf24', '#f87171', '#34d399'];
    const index = competitor.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Helper function to format category from API (e.g., "APPOINTMENTS" -> "Appointments")
  const formatCategory = (category: string): string => {
    // Map API categories to our dropdown options
    const categoryMap: { [key: string]: string } = {
      'APPOINTMENTS': 'Appointments',
      'ANALYTICS': 'Analytics',
      'MARKETING_SUITE': 'Marketing Suite',
      'MARKETING': 'Marketing Suite',
      'PAYMENTS': 'Payments',
      'MOBILE': 'Mobile'
    };
    
    // Return mapped category or format the original
    return categoryMap[category.toUpperCase()] || 
           category.charAt(0).toUpperCase() + category.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  // Helper function to determine priority based on category or other logic
  const determinePriority = (category: string): 'High' | 'Medium' | 'Low' => {
    // You can customize this logic based on your business rules
    const highPriorityCategories = ['APPOINTMENTS', 'PAYMENTS'];
    const lowPriorityCategories = ['MOBILE'];
    
    if (highPriorityCategories.includes(category.toUpperCase())) {
      return 'High';
    } else if (lowPriorityCategories.includes(category.toUpperCase())) {
      return 'Low';
    }
    return 'Medium';
  };

  // Helper function to check if a release is new (within last 7 days)
  const isNewRelease = (dateString: string): boolean => {
    const releaseDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - releaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Filter releases based on search query
  const filteredReleases = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return releases;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return releases.filter(release => 
      release.competitor.toLowerCase().includes(query) ||
      release.feature.toLowerCase().includes(query) ||
      release.summary.toLowerCase().includes(query) ||
      release.category.toLowerCase().includes(query) ||
      release.date.toLowerCase().includes(query)
    );
  }, [releases, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredReleases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReleases = filteredReleases.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Reset to page 1 when items per page changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Fetch releases data from API
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchReleases = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log('[Releases] Fetching features...');
        const response = await fetch('http://localhost:8000/features?skip=0&limit=1000', {
          signal: abortController.signal
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[Releases] Features data received:', data.length, 'items');
        
        // Transform API data to match our Release interface
        interface APIFeature {
          id: number;
          release_id: number;
          name: string;
          summary: string;
          highlights?: string[];
          category: string;
          company_id: number;
          company_name: string;
          release_date: string;
          version?: string | null;
          assigned_category_id?: number | null;
          category_confidence?: number | null;
          created_at: string;
        }
        
        const transformedReleases: Release[] = (data as APIFeature[]).map((item) => ({
          id: item.id,
          competitor: item.company_name,
          competitorInitial: item.company_name.charAt(0).toUpperCase(),
          competitorColor: getCompetitorColor(item.company_name),
          feature: item.name,
          summary: item.summary,
          category: formatCategory(item.category),
          priority: determinePriority(item.category),
          date: formatDate(item.release_date)
        }));
        
        if (isMounted) {
          setReleases(transformedReleases);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[Releases] Fetch aborted');
          return;
        }
        console.error('[Releases] Error fetching releases:', error);
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load releases');
          toast.error('Failed to load releases from API');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReleases();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const handleConnectNotion = async () => {
    if (!isConnected) {
      // Navigate to connect page if not connected
      navigate('/connect-notion');
      return;
    }

    // Sync releases to Notion if already connected
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/notion/sync-releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ releases }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Successfully synced to Notion:', data);
        setSyncMessage({ 
          type: 'success', 
          text: data.message || `Successfully synced ${releases.length} releases to Notion!` 
        });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setSyncMessage(null), 5000);
      } else {
        console.error('❌ Sync failed:', data);
        console.error('Status code:', data.statusCode);
        console.error('Details:', data.details);
        setSyncMessage({ 
          type: 'error', 
          text: `${data.error || 'Failed to sync to Notion'}${data.statusCode ? ` (${data.statusCode})` : ''}` 
        });
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setSyncMessage({ 
        type: 'error', 
        text: 'Network error. Make sure backend is running.' 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendEmailClick = () => {
    setShowEmailModal(true);
  };

  const handleCloseModal = () => {
    setShowEmailModal(false);
    setEmailRecipients('');
  };

  const handleSendEmail = async (recipients: string) => {
    if (!tableContainerRef.current || !tableFooterRef.current) {
      console.error('Table elements not found');
      return;
    }

    setIsSending(true);

    try {
      // Capture screenshots of both elements
      const [tableCanvas, footerCanvas] = await Promise.all([
        html2canvas(tableContainerRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: false,
        }),
        html2canvas(tableFooterRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: false,
        }),
      ]);

      // Validate source canvases
      if (!tableCanvas || !footerCanvas) {
        throw new Error('Failed to capture table elements. Please try again.');
      }

      if (tableCanvas.width === 0 || tableCanvas.height === 0) {
        throw new Error('Table canvas is empty. Please ensure the table has content.');
      }

      if (footerCanvas.width === 0 || footerCanvas.height === 0) {
        throw new Error('Footer canvas is empty. Please ensure the footer has content.');
      }

      // Create a combined canvas
      const combinedWidth = Math.max(tableCanvas.width, footerCanvas.width);
      const combinedHeight = tableCanvas.height + footerCanvas.height;
      const combinedCanvas = document.createElement('canvas');
      combinedCanvas.width = combinedWidth;
      combinedCanvas.height = combinedHeight;
      const ctx = combinedCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Validate canvas dimensions
      if (combinedCanvas.width === 0 || combinedCanvas.height === 0) {
        throw new Error('Canvas dimensions are invalid. Cannot generate PDF.');
      }

      // Convert source canvases to data URLs first to avoid tainting issues
      let tableDataUrl: string;
      let footerDataUrl: string;
      
      try {
        tableDataUrl = tableCanvas.toDataURL('image/png', 1.0);
        footerDataUrl = footerCanvas.toDataURL('image/png', 1.0);
        
        console.log('Table canvas data URL length:', tableDataUrl.length);
        console.log('Footer canvas data URL length:', footerDataUrl.length);
        
        // Validate source data URLs
        if (!tableDataUrl || tableDataUrl === 'data:,' || !tableDataUrl.startsWith('data:image/png;base64,')) {
          console.error('Invalid table canvas data URL:', tableDataUrl.substring(0, 100));
          throw new Error('Failed to capture table image. Please try again.');
        }
        
        if (!footerDataUrl || footerDataUrl === 'data:,' || !footerDataUrl.startsWith('data:image/png;base64,')) {
          console.error('Invalid footer canvas data URL:', footerDataUrl.substring(0, 100));
          throw new Error('Failed to capture footer image. Please try again.');
        }
      } catch (error) {
        console.error('Error converting source canvases to data URLs:', error);
        throw new Error('Failed to convert canvases to images. This may be due to CORS restrictions or empty content.');
      }

      // Load images from data URLs and draw them onto combined canvas
      const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load image from data URL'));
          img.src = dataUrl;
        });
      };

      try {
        const [tableImage, footerImage] = await Promise.all([
          loadImage(tableDataUrl),
          loadImage(footerDataUrl)
        ]);

        // Draw table container at the top
        ctx.drawImage(tableImage, 0, 0);
        // Draw footer below the table
        ctx.drawImage(footerImage, 0, tableCanvas.height);
      } catch (error) {
        console.error('Error loading images:', error);
        throw new Error('Failed to load images for PDF generation. Please try again.');
      }

      // Ensure canvas is fully rendered before converting
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Convert combined canvas to image data URL with validation
      let imageDataUrl: string;
      try {
        imageDataUrl = combinedCanvas.toDataURL('image/png', 1.0);
        console.log('Combined canvas data URL length:', imageDataUrl.length);
      } catch (error) {
        console.error('Error converting combined canvas to data URL:', error);
        // If toDataURL fails, try using the source canvases directly
        console.log('Attempting fallback: using source canvases directly');
        throw new Error('Failed to convert canvas to image. The canvas may be tainted due to CORS restrictions.');
      }
      
      // Validate the data URL
      if (!imageDataUrl || imageDataUrl === 'data:,') {
        console.error('Empty data URL detected. Canvas dimensions:', combinedCanvas.width, 'x', combinedCanvas.height);
        console.error('Table canvas dimensions:', tableCanvas.width, 'x', tableCanvas.height);
        console.error('Footer canvas dimensions:', footerCanvas.width, 'x', footerCanvas.height);
        throw new Error('Failed to generate image from canvas. Canvas may be empty or tainted.');
      }

      // Validate PNG signature (should start with data:image/png;base64,)
      if (!imageDataUrl.startsWith('data:image/png;base64,')) {
        console.error('Invalid PNG data URL format:', imageDataUrl.substring(0, 50));
        throw new Error('Invalid image data format. Please try again.');
      }

      // Extract base64 data and validate it's not empty
      const base64Data = imageDataUrl.split(',')[1];
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Image data is empty. Cannot generate PDF.');
      }
      
      // Create PDF from canvas image
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [combinedCanvas.width, combinedCanvas.height],
      });

      // Add image to PDF (scaled to fit)
      try {
        pdf.addImage(
          imageDataUrl,
          'PNG',
          0,
          0,
          combinedCanvas.width,
          combinedCanvas.height
        );
      } catch (error) {
        console.error('Error adding image to PDF:', error);
        throw new Error('Failed to add image to PDF. The image data may be corrupted.');
      }

      // Get PDF as arraybuffer (more reliable across jsPDF versions)
      const pdfArrayBuffer = pdf.output('arraybuffer');

      // Convert PDF arraybuffer to base64 for proper encoding
      const arrayBuffer = pdfArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert binary data to base64 string using btoa
      // Build binary string character by character for reliability
      let binaryString = '';
      const len = uint8Array.length;
      for (let i = 0; i < len; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64String = btoa(binaryString);

      // Prepare API payload
      const payload: EmailPayload = {
        recipients: recipients,
        subject: EMAIL_SUBJECT,
        body: EMAIL_BODY,
        filename: EMAIL_FILENAME,
        byte_array_base64: base64String,
      };

      // Send to API using DataService
      const result = await DataService.sendEmail(payload);
      
      if (result.success) {
        toast.success(`Email sent successfully to: ${result.sent_to.join(', ')}`);
        setShowEmailModal(false);
        setEmailRecipients('');
      } else {
        toast.error(`Failed to send email: ${result.message}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendEmailSubmit = async () => {
    if (!emailRecipients.trim()) {
      toast.warning('Please enter at least one email address');
      return;
    }

    // Validate email format (basic validation)
    const emails = emailRecipients.split(',').map(email => email.trim()).filter(email => email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return;
    }

    await handleSendEmail(emails.join(','));
  };

  return (
    <>
      {/* Loading State */}
      {isLoading && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '50px',
          fontSize: '18px',
          color: '#6b7280'
        }}>
          <svg 
            className="spinning" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none"
            style={{ marginRight: '10px', animation: 'spin 1s linear infinite' }}
          >
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              strokeLinecap="round"
              strokeDasharray="31.4 31.4"
              transform="rotate(-90 12 12)"
            />
          </svg>
          Loading releases...
        </div>
      )}

      {/* Error State */}
      {loadError && !isLoading && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fee2e2', 
          color: '#dc2626',
          borderRadius: '8px',
          margin: '20px',
          textAlign: 'center'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Failed to load releases</p>
          <p style={{ fontSize: '14px', marginBottom: '15px' }}>{loadError}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content - Only show when not loading and no error */}
      {!isLoading && !loadError && (
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

      {/* Sync Status Message */}
      {syncMessage && (
        <div className={`sync-message ${syncMessage.type}`}>
          {syncMessage.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="#10b981" />
              <path d="M6 10L8.5 12.5L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="#ef4444" />
              <path d="M7 7L13 13M7 13L13 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="action-btn primary-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Manually
        </button>
        <button 
          className="action-btn secondary-btn" 
          onClick={handleConnectNotion}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <svg className="spinning" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2V4M8 12V14M14 8H12M4 8H2M12.2 12.2L10.8 10.8M5.2 5.2L3.8 3.8M12.2 3.8L10.8 5.2M5.2 10.8L3.8 12.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <text x="8" y="11" fontSize="8" fontWeight="700" textAnchor="middle" fill="currentColor" fontFamily="system-ui">N</text>
              </svg>
              {isConnected ? 'Sync Notion' : 'Connect Notion'}
            </>
          )}
        </button>
        <button 
          className="action-btn secondary-btn" 
          onClick={handleSendEmailClick}
          disabled={isSending}
        >
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
      <div className="table-container" ref={tableContainerRef}>
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
            {paginatedReleases.length > 0 ? (
              paginatedReleases.map((release) => (
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
                        {isNewRelease(release.date) && (
                          <span className="new-badge">New</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="feature-cell">{release.feature}</td>
                  <td className="summary-cell">{release.summary}</td>
                  <td className="category-cell">{release.category}</td>
                  <td className="date-cell">{release.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    {searchQuery ? 'No releases found matching your search.' : 'No releases available.'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with Pagination */}
      <div className="table-footer" ref={tableFooterRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p className="showing-text">
              Showing {filteredReleases.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredReleases.length)} of {filteredReleases.length} releases
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="items-per-page" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Items per page:
              </label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff',
                  color: '#1a1a1a',
                  cursor: 'pointer'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  backgroundColor: currentPage === 1 ? '#f9fafb' : '#ffffff',
                  color: currentPage === 1 ? '#9ca3af' : '#1a1a1a',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Previous
              </button>

              {/* Page Numbers */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          minWidth: '36px',
                          padding: '6px 8px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          backgroundColor: currentPage === page ? '#1a1a1a' : '#ffffff',
                          color: currentPage === page ? '#ffffff' : '#1a1a1a',
                          cursor: 'pointer',
                          fontWeight: currentPage === page ? '600' : '400'
                        }}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} style={{ padding: '6px 4px', color: '#6b7280' }}>...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  backgroundColor: currentPage === totalPages ? '#f9fafb' : '#ffffff',
                  color: currentPage === totalPages ? '#9ca3af' : '#1a1a1a',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Next
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="email-modal-overlay" onClick={handleCloseModal}>
          <div className="email-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="email-modal-header">
              <h3>Send Email</h3>
              <button className="email-modal-close" onClick={handleCloseModal}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="email-modal-body">
              <div className="email-modal-field">
                <label htmlFor="email-input" className="email-modal-label">
                  Recipients:
                </label>
                <input
                  id="email-input"
                  type="text"
                  className="email-modal-input"
                  placeholder="email1@example.com,email2@example.com,..."
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  disabled={isSending}
                />
              </div>
            </div>
            <div className="email-modal-footer">
              <button
                className="email-modal-cancel"
                onClick={handleCloseModal}
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                className="email-modal-send"
                onClick={handleSendEmailSubmit}
                disabled={isSending}
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
        </>
      )}
    </>
  );
};

export default Releases;

