import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/AuthPages.css';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Validate token on mount
    const validateToken = async () => {
      if (!token) {
        setValidating(false);
        setError('No reset token provided');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/password-reset/validate/${token}`);
        const data = await response.json();

        if (data.valid) {
          setTokenValid(true);
          setEmail(data.email);
        } else {
          setError(data.message || 'Invalid or expired reset token');
        }
      } catch (err) {
        setError('Failed to validate reset token');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          new_password: password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/subscribe?mode=login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="auth-page">
        <div className="auth-container-wide">
          <div className="login-content">
            <p className="subscribe-intro">Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

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
          {success ? (
            <div className="success-content">
              <h1 className="subscribe-title">Password Reset Complete</h1>
              <p className="subscribe-intro">
                Your password has been successfully reset. You'll be redirected to the login page shortly.
              </p>
              <Link to="/subscribe?mode=login" className="submit-button" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                Sign In Now
              </Link>
            </div>
          ) : !tokenValid ? (
            <div className="error-content">
              <h1 className="subscribe-title">Invalid Reset Link</h1>
              <p className="subscribe-intro">{error}</p>
              <Link to="/forgot-password" className="submit-button" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                Request New Reset Link
              </Link>
            </div>
          ) : (
            <>
              <h1 className="subscribe-title">Create New Password</h1>
              <p className="subscribe-intro">
                Enter a new password for {email}
              </p>

              {error && (
                <div className="error-message" data-testid="reset-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form" data-testid="reset-password-form">
                <div className="form-group">
                  <label htmlFor="password">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength="6"
                      className="form-input"
                      placeholder="Enter new password"
                      data-testid="new-password-input"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength="6"
                      className="form-input"
                      placeholder="Confirm new password"
                      data-testid="confirm-password-input"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                  data-testid="reset-password-btn"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </div>
  );
};
