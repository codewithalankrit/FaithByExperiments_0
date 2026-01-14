# Faith by Experiments - Product Requirements Document

## Original Problem Statement
Build a premium, author-style website with an editorial and intellectual tone for "Faith by Experiments."

## Core Requirements

### 1. Content
- Display content for "About the Founder," "Manifesto," and "Flagship Contents"
- Founder's name "Ajit Kumar" displayed under portrait
- "About the Founder" section text justified
- Specific bullet points for "How the Work is Structured" section
- Homepage "Flagship Contents Preview" with smart button (subscribe/contents based on user status)

### 2. Branding & Style
- Light theme with soft, off-white background and dark text
- User-provided logo and founder portrait images
- Clean, minimal design with editorial/book-like feel
- No flashy colors, animations, or SaaS-style cards

### 3. Subscription System
- Full subscription system (Monthly/Yearly plans)
- Premium two-column pricing section on homepage
- Content locking for non-subscribed users
- All "Membership" references changed to "Subscription"

### 4. Navigation
- Responsive header with hamburger menu for mobile/tablet
- Subscribe and Sign In buttons in header
- Page scrolls to top on route changes

### 5. Admin Panel
- Full CRUD dashboard for managing Flagship Content posts
- Dashboard only accessible after admin login
- Admin email: admin@faithbyexperiments.com redirects to dashboard
- Rich text editor (React Quill) for formatted content

---

## What's Been Implemented

### Completed (Jan 2026)
- ✅ Multi-page React frontend with light editorial theme
- ✅ All pages: HomePage, Subscribe/Login, Flagship Contents (list & detail), Contact, Admin pages
- ✅ Premium two-column subscription section
- ✅ Redesigned Subscribe page
- ✅ Responsive header with hamburger menu
- ✅ User-provided logo and founder portrait integrated
- ✅ Content formatting (justified text, bullet points)
- ✅ **Backend API with FastAPI + MongoDB**
- ✅ **User authentication (signup, login, JWT tokens)**
- ✅ **Admin authentication and protected routes**
- ✅ **Posts CRUD API (Create, Read, Update, Delete)**
- ✅ **Frontend connected to real backend API**
- ✅ Admin dashboard changes reflect on live pages via API
- ✅ Content locking for non-subscribed users
- ✅ **Rich Text Editor (React Quill) in Admin**
- ✅ **SEO Optimization (React Helmet, meta tags)**
- ✅ **Password Reset Flow** (with Resend email - needs API key)
- ✅ **Razorpay Payment Structure** (ready - needs API keys)

- ✅ **Contact Form with Email** (sends to ajitkumar.faithbyexperiments@gmail.com)
- ✅ **WhatsApp field** in contact form
- ✅ **Rich text content rendering** (HTML from editor displayed properly)

### MOCKED / Needs Configuration
- ⚠️ Password reset email (Resend API key not configured - returns dev_token for testing)
- ⚠️ Razorpay payments (keys not configured - returns configured=false)
- ⚠️ POST /api/auth/subscribe - marks user as subscribed without payment

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info (requires auth)
- `POST /api/auth/subscribe` - Mock subscription (requires auth)

### Posts
- `GET /api/posts` - Get all posts (preview for non-subscribers)
- `GET /api/posts/{id}` - Get single post by ID or slug
- `POST /api/posts` - Create post (admin only)
- `PUT /api/posts/{id}` - Update post (admin only)
- `DELETE /api/posts/{id}` - Delete post (admin only)

### Password Reset
- `POST /api/password-reset/request` - Request password reset
- `GET /api/password-reset/validate/{token}` - Validate reset token
- `POST /api/password-reset/confirm` - Confirm password reset

### Payments (Razorpay)
- `GET /api/payments/config` - Get payment configuration
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/orders` - Get user's orders

### Contact Form
- `POST /api/contact/send` - Send contact form inquiry (emails to ajitkumar.faithbyexperiments@gmail.com)
- `GET /api/health` - Health check
- `POST /api/seed` - Seed initial data

---

## Environment Variables Required

### Backend (/app/backend/.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*

# Password Reset (optional - works in dev mode without)
RESEND_API_KEY=re_your_api_key
SENDER_EMAIL=onboarding@resend.dev

# Payments (required for real payments)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

### Frontend (/app/frontend/.env)
```
REACT_APP_BACKEND_URL=https://your-domain.com
```

---

## Prioritized Backlog

### P0 - Critical (COMPLETED)
- ✅ FastAPI backend setup with MongoDB
- ✅ User authentication endpoints
- ✅ Admin CRUD API for posts
- ✅ Frontend-backend integration
- ✅ Rich text editor for posts
- ✅ Password reset flow
- ✅ SEO optimization
- ✅ Razorpay payment structure

### P1 - High Priority (Needs Configuration)
1. Configure Resend API key for password reset emails
2. Configure Razorpay keys for real payments
3. Test complete payment flow end-to-end

### P2 - Medium Priority
1. Email notifications (welcome, subscription confirmation)
2. Subscription expiry handling
3. Invoice/receipt generation

### P3 - Low Priority (Enhancements)
1. Search functionality for posts
2. Categories/tags for posts
3. Reading progress tracking
4. Social sharing buttons

---

## Technical Architecture

### Backend (FastAPI + MongoDB)
```
/app/backend/
├── server.py           # Main FastAPI app
├── models/
│   ├── user.py         # User Pydantic models
│   └── post.py         # Post Pydantic models
├── routes/
│   ├── auth.py         # Auth endpoints
│   ├── posts.py        # Posts CRUD endpoints
│   ├── password_reset.py  # Password reset
│   └── payments.py     # Razorpay payments
└── utils/
    └── auth.py         # JWT helpers, password hashing
```

### Frontend (React)
```
/app/frontend/
├── src/
│   ├── services/
│   │   └── api.js      # API client for backend
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── ScrollToTop.jsx
│   │   └── SEO.jsx     # React Helmet SEO
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── SubscribePage.jsx
│   │   ├── FlagshipContentsPage.jsx
│   │   ├── FlagshipContentDetailPage.jsx
│   │   ├── ContactPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   ├── AdminDashboardPage.jsx
│   │   ├── AdminLoginPage.jsx
│   │   └── AdminPostEditorPage.jsx (with React Quill)
│   └── styles/
│       └── [various CSS files]
```

### Database (MongoDB)
- **users**: id, email, name, password_hash, is_admin, is_subscribed, subscription_type
- **posts**: id, title, slug, excerpt, content, is_premium, created_at, updated_at
- **password_resets**: user_id, email, token, expires_at, used
- **orders**: id, razorpay_order_id, user_id, plan_id, amount, status

---

## Test Credentials
- **Admin Email:** admin@faithbyexperiments.com
- **Admin Password:** admin123

## Testing
- Backend: 42+ pytest tests (100% pass rate)
- Frontend: Playwright E2E tests
- Test files: `/app/tests/`
- Test reports: `/app/test_reports/`
