import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

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
      <div className="min-h-screen bg-off-white relative flex items-center justify-center">
        <div className="text-center">
          <p className="font-sans text-lg text-warm-black/70">Validating reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white relative">
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="max-w-md mx-auto w-full px-6 md:px-8 lg:px-12 py-12 md:py-16">
          <Link to="/" className="inline-block mb-8">
            <img 
              src="/Logo.png" 
              alt="Faith by Experiments" 
              className="h-12 md:h-14"
            />
          </Link>

          <div className="max-w-md mx-auto space-y-8">
            {success ? (
              <div className="text-center space-y-6">
                <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight">Password Reset Complete</h1>
                <p className="font-sans text-lg text-warm-black/70">
                  Your password has been successfully reset. You'll be redirected to the login page shortly.
                </p>
                <Link to="/subscribe?mode=login" className="inline-block w-full bg-sage hover:bg-sage/90 text-white font-sans font-semibold text-base md:text-lg py-4 rounded transition-colors text-center">
                  Sign In Now
                </Link>
              </div>
            ) : !tokenValid ? (
              <div className="text-center space-y-6">
                <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight">Invalid Reset Link</h1>
                <p className="font-sans text-lg text-warm-black/70">{error}</p>
                <Link to="/forgot-password" className="inline-block w-full bg-sage hover:bg-sage/90 text-white font-sans font-semibold text-base md:text-lg py-4 rounded transition-colors text-center">
                  Request New Reset Link
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center space-y-4">
                  <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight">Create New Password</h1>
                  <p className="font-sans text-lg text-warm-black/70">
                    Enter a new password for {email}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded font-sans text-sm md:text-base" data-testid="reset-error">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" data-testid="reset-password-form">
                  <div className="space-y-2">
                    <label htmlFor="password" className="block font-sans font-medium text-base text-warm-black">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength="6"
                        className="w-full px-4 py-3 pr-12 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                        placeholder="Enter new password"
                        data-testid="new-password-input"
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

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block font-sans font-medium text-base text-warm-black">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength="6"
                        className="w-full px-4 py-3 pr-12 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                        placeholder="Confirm new password"
                        data-testid="confirm-password-input"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-black/50 hover:text-warm-black"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-sage hover:bg-sage/90 text-white font-sans font-semibold text-base md:text-lg py-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                    data-testid="reset-password-btn"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>

          <Link to="/" className="inline-flex items-center gap-2 text-warm-black/60 hover:text-warm-black font-sans text-sm md:text-base mt-8 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
