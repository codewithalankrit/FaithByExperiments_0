import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';

export const AdminLoginPage = ({ onAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-off-white relative">
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-6 md:px-8 lg:px-12 py-12 md:py-16">
          <Link to="/" className="inline-block mb-12">
            <img 
              src="/Logo.png" 
              alt="Faith by Experiments" 
              className="h-12 md:h-14"
            />
          </Link>

          <div className="bg-white border border-black/10 p-8 md:p-12 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="font-serif font-bold text-3xl md:text-4xl text-warm-black leading-tight">Admin Access</h1>
              <p className="font-sans text-base text-warm-black/60">Authorized personnel only</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded font-sans text-sm md:text-base" data-testid="admin-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" data-testid="admin-login-form">
              <div className="space-y-2">
                <label htmlFor="email" className="block font-sans font-medium text-base text-warm-black">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                  placeholder="admin@faithbyexperiments.com"
                  data-testid="admin-email-input"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block font-sans font-medium text-base text-warm-black">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                    placeholder="Enter admin password"
                    data-testid="admin-password-input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-black/50 hover:text-warm-black"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-sage hover:bg-sage/90 text-white font-sans font-semibold text-base md:text-lg py-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                data-testid="admin-login-btn"
              >
                {loading ? 'Authenticating...' : 'Access Dashboard'}
              </button>
            </form>

            <Link to="/" className="inline-flex items-center gap-2 text-warm-black/60 hover:text-warm-black font-sans text-sm md:text-base transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
