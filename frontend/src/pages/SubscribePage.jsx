import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authAPI, paymentsAPI } from '../services/api';
import '../styles/AuthPages.css';

export const SubscribePage = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') === 'login');
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    mobile: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(searchParams.get('mode') === 'login');
  }, [searchParams]);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Subscription',
      price: '₹499',
      period: 'month',
      note: 'Cancel anytime'
    },
    {
      id: 'yearly',
      name: 'Yearly Subscription',
      price: '₹4,999',
      period: 'year',
      note: 'Cancel anytime',
      recommended: false
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login
        const data = await authAPI.login(formData.email, formData.password);
        
        console.log('Login successful:', data);
        
        if (onLogin) {
          onLogin(data.user);
        }
        
        setLoading(false); // Ensure loading is set to false before navigation
        
        // Small delay to ensure state updates
        setTimeout(() => {
          // Redirect admin to dashboard
          if (data.user.is_admin) {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        }, 100);
      } else {
        // Signup - Create order first, then process payment, then create account
        try {
          // Step 1: Create pending signup order (includes user data)
          const orderData = await paymentsAPI.createPendingSignupOrder(
            selectedPlan,
            formData.name,
            formData.email,
            formData.password,
            formData.mobile || null
          );

          // Step 2: Get payment config
          const paymentConfig = await paymentsAPI.getConfig();
          
          if (!paymentConfig.configured) {
            throw new Error('Payment system not configured. Please contact support.');
          }

          // Step 3: Open Razorpay checkout
          const options = {
            key: orderData.key_id,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'Faith by Experiments',
            description: `Subscription: ${orderData.plan_name}`,
            order_id: orderData.order_id,
            handler: async function (response) {
              try {
                // Step 4: Verify payment and create account
                const verifyResult = await paymentsAPI.verifyPayment(
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                  response.razorpay_signature
                );

                // If this is a new signup, verifyResult will contain access_token and user
                if (verifyResult.access_token && verifyResult.user) {
                  // Store token and user
                  localStorage.setItem('authToken', verifyResult.access_token);
                  localStorage.setItem('user', JSON.stringify(verifyResult.user));

                  if (onLogin) {
                    onLogin(verifyResult.user);
                  }

                  // Redirect based on user type
                  if (verifyResult.user.is_admin) {
                    navigate('/admin/dashboard');
                  } else {
                    navigate('/');
                  }
                } else {
                  // Existing user payment
                  setError('Payment successful! Please log in to continue.');
                  setIsLogin(true);
                }
              } catch (err) {
                setError(err.message || 'Payment verification failed. Please contact support.');
                setLoading(false);
              }
            },
            prefill: {
              name: formData.name,
              email: formData.email,
              contact: formData.mobile || undefined,
            },
            theme: {
              color: '#4A5568',
            },
            modal: {
              ondismiss: function() {
                setLoading(false);
                setError('Payment cancelled. Please try again.');
              }
            }
          };

          const razorpay = new window.Razorpay(options);
          razorpay.on('payment.failed', function (response) {
            setError(`Payment failed: ${response.error.description || 'Please try again.'}`);
            setLoading(false);
          });
          razorpay.open();
        } catch (err) {
          setError(err.message || 'Failed to initiate payment. Please try again.');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Login/Signup error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
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
        
        <Link to="/" className="back-to-home-link">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
        
        {error && (
          <div className="error-message" data-testid="auth-error">
            {error}
          </div>
        )}
        
        {!isLogin ? (
          <div className="subscribe-content">
            <div className="subscribe-header">
              <h1 className="subscribe-title">Join The Faith by Experiments Journey</h1>
            </div>
            
            <div className="pricing-selection">
              <h2 className="selection-title">Select Your Subscription</h2>
              <div className="plan-options">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`plan-option ${selectedPlan === plan.id ? 'selected' : ''} ${plan.recommended ? 'recommended' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                    data-testid={`plan-option-${plan.id}`}
                  >
                    <div className="plan-option-content">
                      <h3 className="plan-option-name">{plan.name}</h3>
                      <div className="plan-option-price">
                        <span className="option-price">{plan.price}</span>
                        <span className="option-period">/ {plan.period}</span>
                      </div>
                      <p className="plan-option-note">{plan.note}</p>
                    </div>
                    <div className="plan-radio">
                      <div className={`radio-circle ${selectedPlan === plan.id ? 'checked' : ''}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="subscribe-form-section">
              <h2 className="form-section-title">Your Information</h2>
              <form onSubmit={handleSubmit} className="auth-form" data-testid="signup-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Enter your full name"
                    data-testid="signup-name-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="your@email.com"
                    data-testid="signup-email-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength="6"
                      className="form-input"
                      placeholder="Create a secure password"
                      data-testid="signup-password-input"
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
                  <label htmlFor="mobile">Mobile no. (Optional)</label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your mobile number"
                    data-testid="signup-mobile-input"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="submit-button" 
                  disabled={loading}
                  data-testid="signup-submit-btn"
                >
                  {loading ? 'Processing...' : 'Continue to Secure Payment'}
                </button>
                
                <p className="reassurance-text">
                  Cancel anytime. No ads. No spam.
                </p>
              </form>
            </div>
            
            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <button 
                  onClick={() => setIsLogin(true)} 
                  className="toggle-link"
                  data-testid="switch-to-login"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div className="login-content">
            <h1 className="subscribe-title">Welcome Back</h1>
            <p className="subscribe-intro">Sign in to access your subscription.</p>
            
            <form onSubmit={handleSubmit} className="auth-form" data-testid="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="your@email.com"
                  data-testid="login-email-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Enter your password"
                    data-testid="login-password-input"
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
                <Link to="/forgot-password" className="forgot-password-link" data-testid="forgot-password-link">
                  Forgot password?
                </Link>
              </div>
              
              <button 
                type="submit" 
                className="submit-button" 
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            
            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <button 
                  onClick={() => setIsLogin(false)} 
                  className="toggle-link"
                  data-testid="switch-to-signup"
                >
                  Join now
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
