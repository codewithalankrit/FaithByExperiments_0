# Faith by Experiments

**Faith, tested in real life.**

A premium subscription platform for structured experiments, frameworks, and observations for those who treat faith as a hypothesis worth testing.

## 🌟 Features

- **Premium Content Management**: Admin dashboard for creating and managing premium posts
- **User Authentication**: Secure JWT-based authentication with role-based access control
- **Subscription Management**: Monthly and yearly subscription plans with Razorpay integration
- **Password Management**: Secure password reset functionality with email notifications
- **Content Preview**: Locked content previews for non-subscribers
- **Responsive Design**: Modern, mobile-first UI built with React and Tailwind CSS
- **MongoDB Atlas Integration**: Cloud-hosted database for scalability
- **Email & SMS Notifications**: Automated notifications via email and Twilio

## 🛠️ Tech Stack

### Backend

- **Framework**: FastAPI (Python)
- **Database**: MongoDB Atlas (via Motor async driver)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Payment Gateway**: Razorpay
- **SMS Service**: Twilio
- **Server**: Uvicorn

### Frontend

- **Framework**: React 19
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS + Custom CSS
- **UI Components**: Radix UI, Lucide React icons
- **Build Tool**: CRACO (Create React App Configuration Override)
- **State Management**: React Hooks

## 📁 Project Structure

```
FaithByExperiments-main/
├── backend/                 # FastAPI backend
│   ├── models/             # Pydantic models
│   ├── routes/             # API route handlers
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── posts.py        # Post management
│   │   ├── payments.py     # Payment processing
│   │   ├── password_reset.py
│   │   └── contact.py
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   ├── uploads/            # Uploaded files
│   ├── server.py           # Main FastAPI application
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── styles/        # CSS stylesheets
│   │   └── data/          # Static content data
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
│
└── tests/                 # Test files
```

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm/yarn
- MongoDB Atlas account
- Razorpay account (for payments)
- Twilio account (for SMS, optional)

### Backend Setup

1. **Navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Create virtual environment** (recommended):

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   - Copy `env.template` to `.env`
   - Fill in your MongoDB Atlas connection string and other credentials:

   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=app
   DB_NAME=faith_by_experiments
   CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
   JWT_SECRET=your-secret-key-here
   FRONTEND_URL=http://localhost:3000
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

5. **Start the server**:

   ```bash
   uvicorn server:app --reload
   ```

   Server will run on `http://localhost:8000`

6. **Seed the database** (optional):
   ```bash
   curl -X POST http://localhost:8000/api/seed
   ```

### Frontend Setup

1. **Navigate to frontend directory**:

   ```bash
   cd frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**:
   - Create `.env` file in the `frontend` directory:

   ```env
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```

4. **Start the development server**:
   ```bash
   npm start
   # or
   yarn start
   ```
   Frontend will run on `http://localhost:3000`

## 🔐 Environment Variables

### Backend (.env)

| Variable                  | Description                            | Required             |
| ------------------------- | -------------------------------------- | -------------------- |
| `MONGODB_URI`             | MongoDB Atlas connection string        | Yes                  |
| `DB_NAME`                 | Database name                          | Yes                  |
| `CORS_ORIGINS`            | Allowed CORS origins (comma-separated) | Yes                  |
| `JWT_SECRET`              | Secret key for JWT tokens              | Yes                  |
| `FRONTEND_URL`            | Frontend application URL               | Yes                  |
| `RAZORPAY_KEY_ID`         | Razorpay API key ID                    | For payments         |
| `RAZORPAY_KEY_SECRET`     | Razorpay API secret                    | For payments         |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret                | For payment webhooks |
| `TWILIO_ACCOUNT_SID`      | Twilio account SID                     | For SMS (optional)   |
| `TWILIO_AUTH_TOKEN`       | Twilio auth token                      | For SMS (optional)   |
| `TWILIO_PHONE_NUMBER`     | Twilio phone number                    | For SMS (optional)   |

### Frontend (.env)

| Variable                | Description     | Required |
| ----------------------- | --------------- | -------- |
| `REACT_APP_BACKEND_URL` | Backend API URL | Yes      |

## 📡 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/subscribe` - Mock subscription (for testing)

### Posts

- `GET /api/posts` - Get all posts
- `GET /api/posts/{post_id}` - Get single post
- `POST /api/posts` - Create post (admin only)
- `PUT /api/posts/{post_id}` - Update post (admin only)
- `DELETE /api/posts/{post_id}` - Delete post (admin only)

### Payments

- `GET /api/payments/config` - Get payment configuration
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/create-pending-signup-order` - Create order for new signup
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Razorpay webhook endpoint

### Password Reset

- `POST /api/password-reset/request` - Request password reset
- `POST /api/password-reset/confirm` - Confirm password reset

### Utilities

- `GET /api/health` - Health check
- `POST /api/seed` - Seed database with initial data
- `POST /api/create-test-user` - Create test user (for development)

## 👤 Default Admin Credentials

After seeding the database:

- **Email**: `admin@faithbyexperiments.com`
- **Password**: `admin123`

⚠️ **Important**: Change the admin password in production!

## 🧪 Testing

Run backend tests:

```bash
cd backend
pytest
```

## 🚢 Deployment

### Backend (Render/Heroku/etc.)

1. Set all environment variables in your hosting platform
2. Ensure MongoDB Atlas allows connections from your server IP
3. Deploy your code (usually via Git push)

### Frontend (Vercel/Netlify/etc.)

1. Set `REACT_APP_BACKEND_URL` to your production backend URL
2. Build the project: `npm run build`
3. Deploy the `build` folder

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- CORS configuration
- Input validation with Pydantic
- Secure password reset tokens
- Role-based access control (Admin/User)

## 📝 Key Features Implementation

### Password Visibility Toggle

All password fields include an eye icon to show/hide passwords for better UX.

### Subscription Management

- Automatic subscription expiry checking
- Email and SMS notifications for subscription events
- Razorpay payment integration

### Content Access Control

- Premium content locked for non-subscribers
- Preview content available to all users
- Admin dashboard for content management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 👨‍💻 Author

**Ajit Kumar**

- Mechanical Engineer
- Systems Thinker
- Experimentalist

## 📞 Support

For support, email or contact through the website contact form.

---

**Faith by Experiments** - _Faith, tested in real life._
