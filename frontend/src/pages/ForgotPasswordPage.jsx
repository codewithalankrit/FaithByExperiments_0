import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
    <div className="min-h-screen bg-off-white relative">
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-6 md:px-8 lg:px-12 py-12 md:py-16">
          <Link to="/" className="flex justify-center mb-8">
            <img 
              src="/Logo.png" 
              alt="Faith by Experiments" 
              className="h-20 md:h-28 lg:h-36"
            />
          </Link>
          
          <Link to="/" className="inline-flex items-center gap-2 text-warm-black/60 hover:text-warm-black font-sans text-sm md:text-base mb-8 transition-colors">
            ← Back to Home
          </Link>

          <div className="max-w-2xl mx-auto space-y-12 md:space-y-16">
            {!submitted ? (
              <>
                <div className="text-center space-y-4">
                  <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight">Reset Your Password</h1>
                  <p className="font-sans text-lg text-warm-black/70">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded font-sans text-sm md:text-base" data-testid="reset-error">
                    {error}
                  </div>
                )}

                <div className="space-y-8">
                  <form onSubmit={handleSubmit} className="space-y-6" data-testid="forgot-password-form">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block font-sans font-medium text-base text-warm-black">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                        placeholder="your@email.com"
                        data-testid="reset-email-input"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-sage hover:bg-sage/90 text-white font-sans font-semibold text-base md:text-lg py-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                      data-testid="reset-submit-btn"
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6">
                <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight">Check Your Email</h1>
                <p className="font-sans text-lg text-warm-black/70">
                  If an account with that email exists, we've sent a password reset link. 
                  Please check your inbox and spam folder.
                </p>
                
                {devToken && (
                  <div className="bg-yellow-50 border border-yellow-300 p-4 rounded text-left">
                    <p className="font-sans font-semibold text-base text-warm-black mb-2">Development Mode</p>
                    <p className="font-sans text-sm text-warm-black/70 mb-2">
                      Email service not configured. Use this link to reset:
                    </p>
                    <Link 
                      to={`/reset-password?token=${devToken}`}
                      className="font-sans text-sm text-sage hover:text-sage/80 font-medium break-all"
                    >
                      Reset Password →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="text-center pt-8 border-t border-black/10">
              <p className="font-sans text-base text-warm-black/70">
                Remember your password?{' '}
                <Link to="/subscribe?mode=login" className="text-sage hover:text-sage/80 font-medium underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
