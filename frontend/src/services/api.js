// API service for Faith by Experiments
let API_URL = process.env.REACT_APP_BACKEND_URL;

// If the site is served over HTTPS, ensure we never call an HTTP backend (mixed content).
// This helps avoid production issues if REACT_APP_BACKEND_URL was mistakenly set to http://...
if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && API_URL?.startsWith('http://')) {
  API_URL = API_URL.replace(/^http:\/\//, 'https://');
}

// Validate API URL is configured
console.log('API_URL loaded:', API_URL);
if (!API_URL) {
  console.error('REACT_APP_BACKEND_URL is not set. Please create a .env file with REACT_APP_BACKEND_URL=https://your-backend-domain.com (or http://localhost:8000 for local dev)');
  console.error('Current env:', process.env);
}

// Token management
export const getToken = () => localStorage.getItem('authToken');
export const setToken = (token) => localStorage.setItem('authToken', token);
export const removeToken = () => localStorage.removeItem('authToken');

// User session management
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('user');

// Auth headers helper
const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API request wrapper
const apiRequest = async (endpoint, options = {}) => {
  if (!API_URL) {
    console.error('API_URL is undefined. REACT_APP_BACKEND_URL not loaded from .env file.');
    throw new Error('Backend URL not configured. Please set REACT_APP_BACKEND_URL in your .env file and restart the dev server.');
  }
  
  const url = `${API_URL}/api${endpoint}`;
  console.log('Making API request to:', url);
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  };

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      ...config,
      credentials: "include", // Required for cookies/session
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('API response status:', response.status, 'for', url);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }
    
    return response.json();
  } catch (err) {
    console.error('API request failed:', err);
    // Handle network errors (Failed to fetch)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check if the backend server is running.');
    }
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error(`Cannot connect to backend at ${API_URL}. Make sure the backend server is running.`);
    }
    throw err;
  }
};

// Auth API
export const authAPI = {
  signup: async (name, email, password) => {
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.access_token);
    setUser(data.user);
    return data;
  },

  login: async (email, password) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      console.log('Login API response:', data);
      setToken(data.access_token);
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  logout: () => {
    removeToken();
    removeUser();
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },

  subscribe: async () => {
    return apiRequest('/auth/subscribe', { method: 'POST' });
  },
};

// Posts API
export const postsAPI = {
  getAll: async () => {
    return apiRequest('/posts');
  },

  getOne: async (postId) => {
    return apiRequest(`/posts/${postId}`);
  },

  create: async (postData) => {
    return apiRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  update: async (postId, postData) => {
    return apiRequest(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  },

  delete: async (postId) => {
    return apiRequest(`/posts/${postId}`, {
      method: 'DELETE',
    });
  },
};

// Seed database (for initial setup)
export const seedDatabase = async () => {
  return apiRequest('/seed', { method: 'POST' });
};

// Image upload API
export const uploadImage = async (file) => {
  if (!API_URL) {
    throw new Error('Backend URL not configured');
  }
  
  const formData = new FormData();
  formData.append('image', file);
  
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const response = await fetch(`${API_URL}/api/upload-image`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }
  
  const data = await response.json();
  // Return full URL
  return `${API_URL}${data.url}`;
};

// Payments API
export const paymentsAPI = {
  getConfig: async () => {
    return apiRequest('/payments/config');
  },

  createOrder: async (planId) => {
    return apiRequest('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  },

  createPendingSignupOrder: async (planId, name, email, password, mobile = null) => {
    return apiRequest('/payments/create-pending-signup-order', {
      method: 'POST',
      body: JSON.stringify({ 
        plan_id: planId,
        name: name,
        email: email,
        password: password,
        mobile: mobile || null
      }),
    });
  },

  verifyPayment: async (orderId, paymentId, signature) => {
    return apiRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    });
  },
};
