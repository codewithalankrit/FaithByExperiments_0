import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authAPI, paymentsAPI } from '../services/api';

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
    <div className="min-h-screen bg-off-white relative">
      {/* Subtle noise texture overlay */}
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
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </Link>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded mb-8 font-sans text-sm md:text-base" data-testid="auth-error">
              {error}
            </div>
          )}
          
          {!isLogin ? (
            <div className="max-w-2xl mx-auto space-y-12 md:space-y-16">
              <div className="text-center space-y-4">
                <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight">
                  Join The Faith by Experiments Journey
                </h1>
              </div>
              
              <div className="space-y-8">
                <h2 className="font-serif font-semibold text-2xl md:text-3xl text-warm-black">Select Your Subscription</h2>
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border-2 rounded cursor-pointer transition-all p-6 md:p-8 ${
                        selectedPlan === plan.id 
                          ? 'border-accent-muted bg-accent-muted/5' 
                          : 'border-black/10 hover:border-black/20'
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                      data-testid={`plan-option-${plan.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-sans font-semibold text-xl md:text-2xl text-warm-black mb-3">{plan.name}</h3>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="font-sans font-semibold text-3xl md:text-4xl text-warm-black">{plan.price}</span>
                            <span className="font-sans text-base md:text-lg text-warm-black/50">/ {plan.period}</span>
                          </div>
                          <p className="font-sans text-sm md:text-base text-warm-black/60">{plan.note}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedPlan === plan.id 
                            ? 'border-accent-muted bg-accent-muted' 
                            : 'border-black/30'
                        }`}>
                          {selectedPlan === plan.id && (
                            <div className="w-3 h-3 rounded-full bg-white"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            
              
              <div className="space-y-8">
                <h2 className="font-serif font-semibold text-2xl md:text-3xl text-warm-black">Your Information</h2>
                <form onSubmit={handleSubmit} className="space-y-6" data-testid="signup-form">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block font-sans font-medium text-base text-warm-black">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted"
                      placeholder="Enter your full name"
                      data-testid="signup-name-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="block font-sans font-medium text-base text-warm-black">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted"
                      placeholder="your@email.com"
                      data-testid="signup-email-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="block font-sans font-medium text-base text-warm-black">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength="6"
                        className="w-full px-4 py-3 pr-12 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted"
                        placeholder="Create a secure password"
                        data-testid="signup-password-input"
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
                    <label htmlFor="mobile" className="block font-sans font-medium text-base text-warm-black">Mobile no. (Optional)</label>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted"
                      placeholder="Enter your mobile number"
                      data-testid="signup-mobile-input"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full bg-accent-muted hover:bg-accent-muted/90 text-white font-sans font-semibold text-base md:text-lg py-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={loading}
                    data-testid="signup-submit-btn"
                  >
                    {loading ? 'Processing...' : 'Subscribe to Proceed'}
                  </button>
                  
                  <p className="font-sans text-sm text-warm-black/50 text-center">
                    Cancel anytime.
                  </p>
                </form>
              </div>
              
              <div className="text-center pt-8 border-t border-black/10">
                <p className="font-sans text-base text-warm-black/70">
                  Already have an account?{' '}
                  <button 
                    onClick={() => setIsLogin(true)} 
                    className="text-accent-muted hover:text-accent-muted/80 font-medium underline"
                    data-testid="switch-to-login"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-12 md:space-y-16">
              <div className="text-center space-y-4">
                <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight">Welcome Back</h1>
                <p className="font-sans text-lg text-warm-black/70">Sign in to access your subscription.</p>
              </div>
              
              <div className="space-y-8">
                <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
                <div className="space-y-2">
                  <label htmlFor="email" className="block font-sans font-medium text-base text-warm-black">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted"
                    placeholder="your@email.com"
                    data-testid="login-email-input"
                  />
                </div>
              
                <div className="space-y-2">
                  <label htmlFor="password" className="block font-sans font-medium text-base text-warm-black">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pr-12 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted"
                      placeholder="Enter your password"
                      data-testid="login-password-input"
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
                  <Link to="/forgot-password" className="block text-sm text-accent-muted hover:text-accent-muted/80 font-medium mt-2" data-testid="forgot-password-link">
                    Forgot password?
                  </Link>
                </div>
              
                <button 
                  type="submit" 
                  className="w-full bg-accent-muted hover:bg-accent-muted/90 text-white font-sans font-semibold text-base md:text-lg py-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              </div>
            
              <div className="text-center pt-8 border-t border-black/10">
                <p className="font-sans text-base text-warm-black/70">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => setIsLogin(false)} 
                    className="text-accent-muted hover:text-accent-muted/80 font-medium underline"
                    data-testid="switch-to-signup"
                  >
                    Subscribe to Proceed
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
