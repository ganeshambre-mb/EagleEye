import React, { useRef } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Analysis: React.FC = () => {
  const analysisContentRef = useRef<HTMLDivElement>(null);

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
  // Chart data for Weekly Release Trend
  const weeklyData = [
    { week: 'Week 1', releases: 12 },
    { week: 'Week 2', releases: 15 },
    { week: 'Week 3', releases: 8 },
    { week: 'Week 4', releases: 22 },
    { week: 'Week 5', releases: 18 },
    { week: 'Week 6', releases: 27 }
  ];

  // Chart data for Category Distribution
  const categoryData = [
    { category: 'Analytics', count: 28 },
    { category: 'Appointments', count: 22 },
    { category: 'Marketing Suite', count: 18 },
    { category: 'Payments', count: 12 },
    { category: 'Mobile', count: 10 },
    { category: 'Integrations', count: 8 }
  ];

  // Pie chart data for Competitor Release Contribution
  const competitorContribution = [
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
            <p className="insight-text">
              Zenoti released <strong className="highlight-teal">5 new analytics features</strong> this month, representing a <strong className="highlight-teal">+200% increase</strong> from last month.
            </p>
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
            <p className="insight-text">
              <strong className="highlight-blue">Appointments category</strong> grew fastest across all competitors with <strong className="highlight-blue">22 new releases</strong> in the past 30 days.
            </p>
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
            <p className="insight-text">
              <strong className="highlight-purple">Boulevard</strong> is accelerating—they shipped <strong className="highlight-purple">18% more features</strong> this quarter vs. Q3.
            </p>
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
            <p className="insight-text">
              All <strong className="highlight-teal">competitors</strong> are investing heavily in AI-powered analytics—consider prioritizing this area.
            </p>
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
                domain={[0, 28]}
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
                domain={[0, 28]}
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
          <p className="stat-value">120</p>
          <p className="stat-change positive">+18% vs last month</p>
        </div>

        <div className="stat-card">
          <h4 className="stat-label">Active Competitors</h4>
          <p className="stat-value">4</p>
          <p className="stat-info">All tracked</p>
        </div>

        <div className="stat-card">
          <h4 className="stat-label">Avg. Weekly Releases</h4>
          <p className="stat-value">16.7</p>
          <p className="stat-change trending">Trending up</p>
        </div>

        <div className="stat-card">
          <h4 className="stat-label">Most Active Category</h4>
          <p className="stat-value">Analytics</p>
          <p className="stat-highlight">28 releases</p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;

