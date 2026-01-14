# Notification System Setup Guide

This document explains how to set up email and SMS notifications for subscription purchases and expirations.

## Environment Variables

Add these to your `/app/backend/.env` file:

### Email (Resend) - Already configured
```
RESEND_API_KEY=re_your_api_key_here
SENDER_EMAIL=onboarding@resend.dev
FRONTEND_URL=https://faithbyexperiments.com  # Your website URL (used in email links)
```

### SMS (Twilio) - New
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number
```

## Getting Twilio Credentials

1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token from the Twilio Console
3. Get a phone number from Twilio (or use your existing one)
4. Add the credentials to your `.env` file

## How It Works

### Subscription Purchase Notifications
- When a user successfully purchases a subscription, they automatically receive:
  - **Email**: Welcome email with subscription details
  - **SMS**: Confirmation message (if mobile number is provided)

### Subscription Expiry Notifications
- When a subscription expires, users receive:
  - **Email**: Notification that subscription has expired with renewal link
  - **SMS**: Expiry notification (if mobile number is provided)

## Scheduling Expiry Checks

You need to set up a scheduled job to check for expired subscriptions. Here are options:

### Option 1: Cron Job (Recommended for Production)

Add this to your crontab (runs daily at midnight):
```bash
0 0 * * * curl -X POST http://localhost:8000/api/subscriptions/check-expiry
```

Or using a more robust approach with authentication:
```bash
0 0 * * * curl -X POST http://localhost:8000/api/subscriptions/check-expiry-sync
```

### Option 2: External Cron Service

Use services like:
- **cron-job.org** - Free web-based cron
- **EasyCron** - Reliable cron service
- **GitHub Actions** - If your code is on GitHub

Set them to call: `POST /api/subscriptions/check-expiry-sync` daily

### Option 3: Background Task Scheduler

You can also integrate a task scheduler like:
- **APScheduler** (Advanced Python Scheduler)
- **Celery** (for more complex setups)

## API Endpoints

### Manual Expiry Check (Async)
```
POST /api/subscriptions/check-expiry
```
Returns immediately, processes in background.

### Manual Expiry Check (Sync)
```
GET /api/subscriptions/check-expiry-sync
```
Returns results after processing completes. Useful for testing.

## Testing

1. **Test Email**: Set up Resend API key and send a test subscription purchase
2. **Test SMS**: Set up Twilio credentials and test with a real phone number
3. **Test Expiry**: Manually set a user's `subscription_end_at` to a past date and call the expiry check endpoint

## Development Mode

If email/SMS credentials are not configured, the system will:
- Print notification details to console (for email)
- Print SMS details to console (for SMS)
- Continue processing without errors

This allows development without setting up external services.

## Notes

- SMS requires valid phone numbers with country code (e.g., +91 for India)
- Email notifications use Resend (already configured in the project)
- Notifications are sent asynchronously to avoid blocking payment processing
- Expired subscriptions are automatically marked as `is_subscribed: false`
