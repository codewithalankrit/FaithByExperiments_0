import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/AdminPages.css';

export const AdminLoginPage = ({ onAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login(email, password);
      
      if (!data.user.is_admin) {
        setError('Access denied. Admin credentials required.');
        authAPI.logout();
        return;
      }
      
      if (onAdminLogin) {
        onAdminLogin(data.user);
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <Link to="/" className="admin-logo-link">
          <img 
            src="https://customer-assets.emergentagent.com/job_34e2cbef-ee34-45ac-8348-79293beec714/artifacts/j8mvu38p_Production-edited-Logo-Photoroom.png" 
            alt="Faith by Experiments" 
            className="admin-logo-image"
          />
        </Link>

        <div className="admin-login-card">
          <h1 className="admin-login-title">Admin Access</h1>
          <p className="admin-login-subtitle">Authorized personnel only</p>

          {error && <div className="admin-error" data-testid="admin-error">{error}</div>}

          <form onSubmit={handleSubmit} className="admin-login-form" data-testid="admin-login-form">
            <div className="admin-form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="admin-form-input"
                placeholder="admin@faithbyexperiments.com"
                data-testid="admin-email-input"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="admin-form-input"
                placeholder="Enter admin password"
                data-testid="admin-password-input"
              />
            </div>

            <button 
              type="submit" 
              className="admin-submit-button"
              disabled={loading}
              data-testid="admin-login-btn"
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>

          <Link to="/" className="admin-back-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};
