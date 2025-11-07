import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempted with:', { email, password, rememberMe });
    
    // After successful login, redirect to ConnectToNotion page
    navigate('/connect-notion');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-icon-container">
            <svg 
              className="login-icon" 
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

          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">
            Sign in to access your competitive intelligence<br />dashboard
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Company Email</label>
              <div className="input-wrapper">
                <svg 
                  className="input-icon" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none"
                >
                  <path 
                    d="M3 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    fill="none"
                  />
                  <path 
                    d="M2 5l8 5 8-5" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <svg 
                  className="input-icon" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none"
                >
                  <rect 
                    x="4" 
                    y="9" 
                    width="12" 
                    height="8" 
                    rx="1" 
                    stroke="currentColor" 
                    strokeWidth="1.5"
                  />
                  <path 
                    d="M7 9V6a3 3 0 0 1 6 0v3" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="13" r="1" fill="currentColor"/>
                </svg>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">Remember me</span>
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="login-button">
              Login
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none"
                className="login-arrow-icon"
              >
                <path 
                  d="M6 3L11 8L6 13" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>

          <p className="signup-text">
            Don't have an account? <Link to="/signup" className="signup-link">Sign up</Link>
          </p>
        </div>

        <div className="login-footer">
          Track competitor releases • Spot trends • Share insights
        </div>
      </div>
    </div>
  );
};

export default Login;

