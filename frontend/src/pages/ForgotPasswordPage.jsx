import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/AuthPages.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send reset email');
      }

      setSubmitted(true);
      
      // For development - show token if email not configured
      if (data.dev_token) {
        setDevToken(data.dev_token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container-wide">
        <Link to="/" className="auth-logo-link">
          <img 
            src="https://customer-assets.emergentagent.com/job_34e2cbef-ee34-45ac-8348-79293beec714/artifacts/j8mvu38p_Production-edited-Logo-Photoroom.png" 
            alt="Faith by Experiments" 
            className="auth-logo-image"
          />
        </Link>

        <div className="login-content">
          {!submitted ? (
            <>
              <h1 className="subscribe-title">Reset Your Password</h1>
              <p className="subscribe-intro">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="error-message" data-testid="reset-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form" data-testid="forgot-password-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                    placeholder="your@email.com"
                    data-testid="reset-email-input"
                  />
                </div>

                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                  data-testid="reset-submit-btn"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="success-content">
              <h1 className="subscribe-title">Check Your Email</h1>
              <p className="subscribe-intro">
                If an account with that email exists, we've sent a password reset link. 
                Please check your inbox and spam folder.
              </p>
              
              {devToken && (
                <div className="dev-token-notice" style={{ 
                  background: '#fef3c7', 
                  border: '1px solid #f59e0b', 
                  padding: '16px', 
                  borderRadius: '6px',
                  marginTop: '20px'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Development Mode</p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                    Email service not configured. Use this link to reset:
                  </p>
                  <Link 
                    to={`/reset-password?token=${devToken}`}
                    style={{ color: '#d97706', wordBreak: 'break-all' }}
                  >
                    Reset Password →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <Link to="/subscribe?mode=login" className="toggle-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </div>
  );
};
