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
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly' | ''>('');
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(1); // 0 = Sunday, 1 = Monday, etc.
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState<number>(1); // 1-31
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableFooterRef = useRef<HTMLDivElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // State for releases data
  const [releases, setReleases] = useState<Release[]>([]);

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

  // Fetch releases data from API
  useEffect(() => {
    const fetchReleases = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        const response = await fetch('http://localhost:8000/features?skip=0&limit=1000');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
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
        
        setReleases(transformedReleases);
      } catch (error) {
        console.error('Error fetching releases:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load releases');
        toast.error('Failed to load releases from API');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleases();
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
    setIsScheduled(false);
    setScheduleTime('');
    setScheduleFrequency('');
    setScheduleName('');
    setScheduleDayOfWeek(1);
    setScheduleDayOfMonth(1);
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
        }),
        html2canvas(tableFooterRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        }),
      ]);

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

      // Draw table container at the top
      ctx.drawImage(tableCanvas, 0, 0);
      // Draw footer below the table
      ctx.drawImage(footerCanvas, 0, tableCanvas.height);

      // Convert canvas to image data URL
      const imageDataUrl = combinedCanvas.toDataURL('image/png', 1.0);
      
      // Create PDF from canvas image
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [combinedCanvas.width, combinedCanvas.height],
      });

      // Add image to PDF (scaled to fit)
      pdf.addImage(
        imageDataUrl,
        'PNG',
        0,
        0,
        combinedCanvas.width,
        combinedCanvas.height
      );

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

      // Add scheduling information if scheduled
      if (isScheduled && scheduleFrequency) {
        payload.schedule_frequency = scheduleFrequency;
        if (scheduleName.trim()) {
          payload.schedule_name = scheduleName.trim();
        }
        
        // Include time for all frequencies
        if (scheduleTime) {
          payload.schedule_time = scheduleTime;
        }
        
        // For weekly, include day of week
        if (scheduleFrequency === 'weekly') {
          payload.schedule_day_of_week = scheduleDayOfWeek;
        }
        
        // For monthly, include day of month
        if (scheduleFrequency === 'monthly') {
          payload.schedule_day_of_month = scheduleDayOfMonth;
        }
      }

      // Send to API using DataService
      const result = await DataService.sendEmail(payload);
      
      if (result.success) {
        if (isScheduled) {
          const frequencyText = `${scheduleFrequency}ly`;
          const nameText = scheduleName.trim() ? ` "${scheduleName.trim()}"` : '';
          let scheduleDetails = '';
          if (scheduleTime) {
            scheduleDetails = ` at ${scheduleTime}`;
          }
          if (scheduleFrequency === 'weekly') {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            scheduleDetails += ` on ${days[scheduleDayOfWeek]}`;
          } else if (scheduleFrequency === 'monthly') {
            scheduleDetails += ` on day ${scheduleDayOfMonth}`;
          }
          toast.success(`Email schedule${nameText} created successfully (${frequencyText}${scheduleDetails}) to: ${result.sent_to.join(', ')}`);
        } else {
          toast.success(`Email sent successfully to: ${result.sent_to.join(', ')}`);
        }
        setShowEmailModal(false);
        setIsScheduled(false);
        setScheduleTime('');
        setScheduleFrequency('');
        setScheduleName('');
        setScheduleDayOfWeek(1);
        setScheduleDayOfMonth(1);
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

    // Validate scheduling if enabled
    if (isScheduled) {
      if (!scheduleFrequency) {
        toast.warning('Please select a frequency for the scheduled email');
        return;
      }
      
      if (!scheduleName.trim()) {
        toast.warning('Please enter a name for the scheduled email');
        return;
      }
      
      // Validate time for all frequencies
      if (!scheduleTime) {
        toast.warning('Please select a time for the schedule');
        return;
      }
      
      // Validate day of week for weekly frequency
      if (scheduleFrequency === 'weekly' && scheduleDayOfWeek === undefined) {
        toast.warning('Please select a day of the week');
        return;
      }
      
      // Validate day of month for monthly frequency
      if (scheduleFrequency === 'monthly') {
        if (!scheduleDayOfMonth || scheduleDayOfMonth < 1 || scheduleDayOfMonth > 31) {
          toast.warning('Please select a valid day of the month (1-31)');
          return;
        }
      }
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="table-footer" ref={tableFooterRef}>
        <p className="showing-text">Showing {releases.length} of {releases.length} releases</p>
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
              
              <div className="email-modal-schedule-section">
                <label className="email-modal-checkbox-label">
                  <input
                    type="checkbox"
                    className="email-modal-checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    disabled={isSending}
                  />
                  <span>Schedule Email</span>
                </label>
                
                {isScheduled && (
                  <div className="email-modal-schedule-fields">
                    <div className="email-modal-field">
                      <label htmlFor="schedule-name" className="email-modal-label">
                        Schedule Name:
                      </label>
                      <input
                        id="schedule-name"
                        type="text"
                        className="email-modal-input"
                        placeholder="e.g., Weekly Report"
                        value={scheduleName}
                        onChange={(e) => setScheduleName(e.target.value)}
                        disabled={isSending}
                      />
                    </div>
                    <div className="email-modal-field">
                      <label htmlFor="schedule-frequency" className="email-modal-label">
                        Frequency:
                      </label>
                      <select
                        id="schedule-frequency"
                        className="email-modal-input email-modal-select"
                        value={scheduleFrequency}
                        onChange={(e) => setScheduleFrequency(e.target.value as 'daily' | 'weekly' | 'monthly' | '')}
                        disabled={isSending}
                      >
                        <option value="">Select</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    {scheduleFrequency && (
                      <div className="email-modal-field">
                        <label htmlFor="schedule-time" className="email-modal-label">
                          Time:
                        </label>
                        <input
                          id="schedule-time"
                          type="time"
                          className="email-modal-input email-modal-time-input"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          disabled={isSending}
                        />
                      </div>
                    )}
                    {scheduleFrequency === 'weekly' && (
                      <div className="email-modal-field">
                        <label htmlFor="schedule-day-of-week" className="email-modal-label">
                          Day of Week:
                        </label>
                        <select
                          id="schedule-day-of-week"
                          className="email-modal-input email-modal-select"
                          value={scheduleDayOfWeek}
                          onChange={(e) => setScheduleDayOfWeek(Number(e.target.value))}
                          disabled={isSending}
                        >
                          <option value="0">Sunday</option>
                          <option value="1">Monday</option>
                          <option value="2">Tuesday</option>
                          <option value="3">Wednesday</option>
                          <option value="4">Thursday</option>
                          <option value="5">Friday</option>
                          <option value="6">Saturday</option>
                        </select>
                      </div>
                    )}
                    {scheduleFrequency === 'monthly' && (
                      <div className="email-modal-field">
                        <label htmlFor="schedule-day-of-month" className="email-modal-label">
                          Day of Month:
                        </label>
                        <select
                          id="schedule-day-of-month"
                          className="email-modal-input email-modal-select"
                          value={scheduleDayOfMonth}
                          onChange={(e) => setScheduleDayOfMonth(Number(e.target.value))}
                          disabled={isSending}
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
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
                {isSending 
                  ? (isScheduled ? 'Creating Schedule...' : 'Sending...') 
                  : (isScheduled ? 'Create Schedule' : 'Send')}
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

