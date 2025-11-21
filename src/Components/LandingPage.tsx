import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartAnalysis = () => {
    navigate('/dashboard');
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="icon-container">
          <svg 
            className="radar-icon" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            <path d="M8.5 15.5C7.5 14.5 7 13.3 7 12C7 10.7 7.5 9.5 8.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M15.5 8.5C16.5 9.5 17 10.7 17 12C17 13.3 16.5 14.5 15.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M5.5 18.5C3.5 16.5 2.5 14 2.5 12C2.5 10 3.5 7.5 5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18.5 5.5C20.5 7.5 21.5 10 21.5 12C21.5 14 20.5 16.5 18.5 18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="hero-title">
          Stay two steps ahead of<br />your competitors.
        </h1>

        <p className="hero-description">
          Eagle Eye automatically aggregates competitor updates, categorizes them, and<br />
          visualizes trends—so you can focus on building, not monitoring.
        </p>

        <img src="onboarding_image.jpg" alt="Radar" className="radar-image" height={400} width={700} />

        <button className="cta-button" onClick={handleStartAnalysis}>
          Start Analysis
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="arrow-icon"
          >
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How Eagle Eye Works</h2>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number step-number-1">1</div>
            <h3 className="step-title">Connect Your Sources</h3>
            <p className="step-description">
              Add competitor blogs, changelogs, and news<br />
              feeds in seconds.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number step-number-2">2</div>
            <h3 className="step-title">AI Analyzes</h3>
            <h3 className="step-title">You Control</h3>
            <p className="step-description">
              Our AI categorizes releases, detects trends,<br />
              and surfaces insights automatically.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number step-number-3">3</div>
            <h3 className="step-title">Get Actionable Reports</h3>
            <p className="step-description">
              Weekly summaries in Slack, exportable<br />
              reports, and trend visualizations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

