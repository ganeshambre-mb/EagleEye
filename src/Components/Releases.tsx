import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataService from '../services/DataService';
import type { EmailPayload } from '../services/DataService';
import { EMAIL_BODY, EMAIL_SUBJECT, EMAIL_FILENAME } from '../constants/emailConstants';
import { AUTH_HEADER } from '../constants/auth';
import InsightsGrid from './InsightsGrid';

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
  synced_to_notion: boolean;
}

const Releases: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableFooterRef = useRef<HTMLDivElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  // Helper function to highlight matching search text
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) {
      return text;
    }

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span style={{ display: 'inline' }}>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark 
              key={index} 
              style={{ 
                backgroundColor: '#fde047', 
                color: '#1a1a1a',
                padding: '1px 0',
                margin: '0',
                fontWeight: '600',
                borderRadius: '2px',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
                display: 'inline',
                lineHeight: 'inherit'
              }}
            >
              {part}
            </mark>
          ) : (
            <span key={index} style={{ display: 'inline' }}>{part}</span>
          )
        )}
      </span>
    );
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
  const fetchReleases = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // Use relative URL if in development with Vite proxy, otherwise use full URL
      const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8000');
      const healthUrl = baseURL ? `${baseURL}/health` : '/health';
      const featuresUrl = baseURL ? `${baseURL}/features?skip=0&limit=1000` : '/features?skip=0&limit=1000';
      
      console.log('[Releases] Fetching features from:', featuresUrl);
      console.log('[Releases] Development mode:', import.meta.env.DEV);
      
      // Test API connectivity first
      try {
        console.log('[Releases] Testing connection to:', healthUrl);
        const testResponse = await fetch(healthUrl, {
          headers: {
            'Authorization': AUTH_HEADER
          }
        });
        console.log('[Releases] Health check response:', testResponse.status, testResponse.statusText);
        
        if (!testResponse.ok) {
          throw new Error(`Health check failed: ${testResponse.status} ${testResponse.statusText}`);
        }
      } catch (healthError) {
        console.error('[Releases] Health check failed:', healthError);
        if (healthError instanceof TypeError && healthError.message.includes('Failed to fetch')) {
          throw new Error(`Cannot connect to API server at ${baseURL || 'localhost:8000'}. Please ensure:\n\n1. The API server is running on port 8000\n2. The server is accessible from your browser\n3. CORS is configured to allow requests from ${window.location.origin}`);
        } else {
          throw new Error(`API server health check failed: ${healthError instanceof Error ? healthError.message : 'Unknown error'}`);
        }
      }
      
      const response = await fetch(featuresUrl, {
        headers: {
          'Authorization': AUTH_HEADER
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Releases] Features data received:', data.length, 'items');
      
      // Transform API data to match our Release interface
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
      
      setReleases(transformedReleases);
    } catch (error) {
      console.error('[Releases] Error fetching releases:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load releases');
      toast.error('Failed to load releases from API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  // Refresh releases list after re-run
  const refreshReleases = async () => {
    console.log('[Releases] Refreshing releases data...');
    await fetchReleases();
  };

  // Re-run analysis handler
  const handleRerunAnalysis = async () => {
    if (releases.length === 0) {
      toast.warning('No data to analyze. Please add a company first.');
      return;
    }

    setIsAnalyzing(true);
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const toastId = toast.info('Starting analysis...', { autoClose: false });

    try {
      // Get first company from API
      const companiesResponse = await fetch(`${baseURL}/companies?skip=0&limit=1`, {
        headers: {
          'Authorization': AUTH_HEADER
        }
      });
      
      if (!companiesResponse.ok) {
        throw new Error('Failed to fetch companies');
      }

      const companies = await companiesResponse.json();
      
      if (companies.length === 0) {
        toast.update(toastId, {
          render: 'No companies found to analyze',
          type: 'error',
          autoClose: 5000
        });
        return;
      }

      const targetCompanyId = companies[0].id;

      // Call process-company API
      toast.update(toastId, { render: 'Processing company data...' });
      const processResponse = await fetch(
        `${baseURL}/process-company`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTH_HEADER
          },
          body: JSON.stringify({
            company_id: targetCompanyId.toString()
          })
        }
      );
      
      if (processResponse.ok) {
        const processData = await processResponse.json();
        console.log('✓ Company processing completed:', processData);
        
        // Success - refresh data
        toast.update(toastId, {
          render: 'Re-run successful! Refreshing data...',
          type: 'success',
          autoClose: 2000
        });

        await refreshReleases();
        
        toast.success('Analysis complete and data refreshed!');
      } else {
        throw new Error('Failed to process company');
      }
    } catch (error) {
      console.error('[Releases] Re-run analysis error:', error);
      toast.update(toastId, {
        render: 'Analysis failed. Please try again.',
        type: 'error',
        autoClose: 5000
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConnectNotion = async () => {
    // Sync releases to Notion if already connected
    setIsSyncing(true);
    setSyncMessage(null);

    // Determine if we're actually in development (localhost) or production (Vercel)
    const isActuallyDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const envApiUrl = import.meta.env.VITE_API_URL;
    
    // Force staging URL if not localhost and no env var is set
    let apiUrl;
    if (isActuallyDev) {
      apiUrl = 'http://localhost:8000';
    } else {
      // On Vercel/production, ensure we never use localhost
      apiUrl = envApiUrl || 'https://www.staging.arcusplatform.io/eagle-eye';
    }
    
    console.log('[Releases] Environment check:', {
      hostname: window.location.hostname,
      isActuallyDev: isActuallyDev,
      finalApiUrl: apiUrl
    });
    
    // Use simple endpoint - backend handles everything
    const syncUrl = isActuallyDev 
      ? '/api/notion/sync-releases'
      : `${apiUrl}/api/notion/sync-releases`;
    
    console.log('[Releases] Sync URL:', syncUrl);

    try {
      console.log('[Releases] Calling Notion sync API...');
      
      // Simple POST request - backend handles all authentication and logic
      const response = await fetch(syncUrl, {
        method: 'POST'
      });

      console.log('[Releases] Response status:', response.status, response.statusText);
      
      // Get response body
      const responseText = await response.text();
      console.log('[Releases] Response body:', responseText);
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('[Releases] Failed to parse response as JSON:', e);
        data = { error: 'Invalid JSON response', raw: responseText };
      }
      
      console.log('[Releases] Parsed response:', data);

      if (response.ok) {
        console.log('✅ Successfully synced to Notion:', data);
        const successMessage = data.message || data.detail || 'Successfully synced releases to Notion!';
        setSyncMessage({ 
          type: 'success', 
          text: successMessage
        });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setSyncMessage(null), 5000);
      } else {
        console.error('❌ Sync failed with status:', response.status);
        console.error('❌ Error data:', data);
        
        // Handle specific HTTP errors
        let errorMessage = data.error || data.detail || 'Failed to sync to Notion';
        
        if (response.status === 422) {
          errorMessage = `Validation Error: ${data.detail || 'Invalid request format'}`;
        } else if (response.status === 404) {
          errorMessage = `Endpoint not found: ${syncUrl} doesn't exist on the server.`;
        } else if (response.status === 500) {
          errorMessage = `Server Error: ${data.detail || 'Internal server error occurred'}`;
        }
        
        setSyncMessage({ 
          type: 'error', 
          text: `${errorMessage} (Status: ${response.status})` 
        });
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      
      let errorMessage = 'Network error. ';
      
      if (error instanceof TypeError) {
        if (error.message.includes('fetch') || error.message.includes('CORS') || error.message.includes('cross-origin')) {
          if (isActuallyDev) {
            errorMessage = 'Cannot connect to local backend. Make sure API server is running on localhost:8000.';
          } else {
            errorMessage = `CORS Error: Your staging API server needs to allow requests from ${window.location.origin}.`;
          }
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage += `Cannot reach ${syncUrl}. Check if the API endpoint exists and is accessible.`;
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Make sure backend is running.';
      }
      
      setSyncMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendEmailClick = () => {
    setShowEmailModal(true);
  };

  const handleExportCSV = () => {
    if (filteredReleases.length === 0) {
      toast.info('No data to export');
      return;
    }

    // CSV header
    const headers = ['Competitor', 'Feature', 'Summary', 'Category', 'Date'];
    
    // Helper function to escape CSV values
    const escapeCSV = (value: string): string => {
      if (value == null) return '';
      const stringValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Create CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...filteredReleases.map(release => [
        escapeCSV(release.competitor),
        escapeCSV(release.feature),
        escapeCSV(release.summary),
        escapeCSV(release.category),
        escapeCSV(release.date)
      ].join(','))
    ];

    // Combine all rows
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    link.setAttribute('href', url);
    link.setAttribute('download', `releases_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredReleases.length} releases to CSV`);
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
          padding: '30px', 
          backgroundColor: '#fee2e2', 
          color: '#dc2626',
          borderRadius: '8px',
          margin: '20px',
          textAlign: 'center',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '18px' }}>API Server Connection Failed</p>
          <p style={{ fontSize: '14px', marginBottom: '20px', whiteSpace: 'pre-line', textAlign: 'left' }}>{loadError}</p>
          
          <div style={{ backgroundColor: '#fef2f2', padding: '15px', borderRadius: '6px', marginBottom: '20px', textAlign: 'left' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>To fix this issue:</p>
            <ol style={{ fontSize: '13px', paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '5px' }}>Start your API server on port 8000</li>
              <li style={{ marginBottom: '5px' }}>Ensure the server is accessible at <code>http://localhost:8000</code></li>
              <li style={{ marginBottom: '5px' }}>Check that CORS is configured to allow requests from this domain</li>
              <li style={{ marginBottom: '5px' }}>Verify the server has the <code>/features</code> and <code>/health</code> endpoints</li>
            </ol>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Retry Connection
            </button>
            <button 
              onClick={() => setLoadError(null)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: '#dc2626',
                border: '2px solid #dc2626',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Only show when not loading and no error */}
      {!isLoading && !loadError && (
        <>
      {/* Insights Section */}
      <div className="section-header" style={{ marginBottom: '24px', marginTop: '24px', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px', textAlign: 'left' }}>
          Key Insights
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'left' }}>
          Market intelligence at a glance
        </p>
      </div>

      <InsightsGrid />

      {/* Releases Section */}
      <div className="section-header" style={{ marginBottom: '20px', marginTop: '40px', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px', textAlign: 'left' }}>
          Release Tracker
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'left' }}>
          All competitor feature releases and updates
        </p>
      </div>

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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className="inline-action-button"
            onClick={() => navigate('/onboarding?step=1')}
            disabled={isAnalyzing}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Add Company
          </button>
          <button 
            className="inline-action-button"
            onClick={() => navigate('/onboarding?step=2')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Add Category
          </button>
          <button 
            className="rerun-button"
            onClick={handleRerunAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <svg className="spinning" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="9.42 9.42" strokeLinecap="round"/>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.2091 2 12.1046 3.13258 13.1244 4.83337" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 2V5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Re-run Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sync Status Message */}
      {syncMessage && (
        <div className={`sync-message ${syncMessage.type}`}>
          {syncMessage.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="#10b981" />
              <path d="M6 10L8.5 12.5L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : syncMessage.type === 'error' ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="#ef4444" />
              <path d="M7 7L13 13M7 13L13 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="#3b82f6" />
              <circle cx="10" cy="6" r="1" fill="white" />
              <path d="M10 9V14" stroke="white" strokeWidth="2" strokeLinecap="round" />
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
          title={'Sync releases to Notion'}
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
              {'Sync Notion'}
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
        <button 
          className="action-btn secondary-btn"
          onClick={handleExportCSV}
        >
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
                        <span className="competitor-name">{highlightText(release.competitor, searchQuery)}</span>
                        {isNewRelease(release.date) && (
                          <span className="new-badge">New</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="feature-cell">{highlightText(release.feature, searchQuery)}</td>
                  <td className="summary-cell">{highlightText(release.summary, searchQuery)}</td>
                  <td className="category-cell">{highlightText(release.category, searchQuery)}</td>
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

