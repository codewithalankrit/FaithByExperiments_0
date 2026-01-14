"""
Test suite for new features:
- Password Reset Flow (with Resend - mocked/dev mode)
- Razorpay Payment Config (not configured - returns configured=false)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://editorial-hub-9.preview.emergentagent.com').rstrip('/')


class TestPasswordResetFlow:
    """Password reset endpoint tests - Resend not configured, returns dev_token"""
    
    def test_password_reset_request_existing_user(self):
        """Test password reset request for existing user returns dev_token"""
        response = requests.post(
            f"{BASE_URL}/api/password-reset/request",
            json={"email": "admin@faithbyexperiments.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # Since Resend is not configured, should return dev_token
        assert "dev_token" in data
        assert len(data["dev_token"]) > 0
    
    def test_password_reset_request_nonexistent_user(self):
        """Test password reset request for non-existent user (should not reveal if email exists)"""
        response = requests.post(
            f"{BASE_URL}/api/password-reset/request",
            json={"email": "nonexistent_user_12345@example.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # Should NOT return dev_token for non-existent user
        assert "dev_token" not in data
    
    def test_password_reset_validate_invalid_token(self):
        """Test token validation with invalid token"""
        response = requests.get(f"{BASE_URL}/api/password-reset/validate/invalid_token_12345")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        assert "message" in data
    
    def test_password_reset_validate_valid_token(self):
        """Test token validation with valid token"""
        # First request a reset token
        reset_response = requests.post(
            f"{BASE_URL}/api/password-reset/request",
            json={"email": "admin@faithbyexperiments.com"}
        )
        assert reset_response.status_code == 200
        dev_token = reset_response.json().get("dev_token")
        assert dev_token is not None
        
        # Validate the token
        validate_response = requests.get(f"{BASE_URL}/api/password-reset/validate/{dev_token}")
        assert validate_response.status_code == 200
        data = validate_response.json()
        assert data["valid"] == True
        assert data["email"] == "admin@faithbyexperiments.com"
    
    def test_password_reset_full_flow(self):
        """Test complete password reset flow: request -> validate -> confirm -> login"""
        # Create a unique test user
        unique_email = f"TEST_pwreset_{uuid.uuid4().hex[:8]}@example.com"
        original_password = "original_password_123"
        new_password = "new_password_456"
        
        # Step 1: Create test user
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={"email": unique_email, "name": "Test User", "password": original_password}
        )
        assert signup_response.status_code == 200
        
        # Step 2: Request password reset
        reset_response = requests.post(
            f"{BASE_URL}/api/password-reset/request",
            json={"email": unique_email}
        )
        assert reset_response.status_code == 200
        dev_token = reset_response.json().get("dev_token")
        assert dev_token is not None
        
        # Step 3: Validate token
        validate_response = requests.get(f"{BASE_URL}/api/password-reset/validate/{dev_token}")
        assert validate_response.status_code == 200
        assert validate_response.json()["valid"] == True
        
        # Step 4: Confirm password reset
        confirm_response = requests.post(
            f"{BASE_URL}/api/password-reset/confirm",
            json={"token": dev_token, "new_password": new_password}
        )
        assert confirm_response.status_code == 200
        assert "successfully" in confirm_response.json()["message"].lower()
        
        # Step 5: Verify new password works
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": unique_email, "password": new_password}
        )
        assert login_response.status_code == 200
        assert "access_token" in login_response.json()
        
        # Step 6: Verify old password no longer works
        old_login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": unique_email, "password": original_password}
        )
        assert old_login_response.status_code == 401
    
    def test_password_reset_confirm_invalid_token(self):
        """Test password reset confirm with invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/password-reset/confirm",
            json={"token": "invalid_token_12345", "new_password": "newpassword123"}
        )
        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower() or "expired" in response.json()["detail"].lower()
    
    def test_password_reset_token_cannot_be_reused(self):
        """Test that a reset token cannot be used twice"""
        # Create test user
        unique_email = f"TEST_pwreset_reuse_{uuid.uuid4().hex[:8]}@example.com"
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={"email": unique_email, "name": "Test User", "password": "password123"}
        )
        assert signup_response.status_code == 200
        
        # Request reset token
        reset_response = requests.post(
            f"{BASE_URL}/api/password-reset/request",
            json={"email": unique_email}
        )
        dev_token = reset_response.json().get("dev_token")
        
        # Use token first time
        first_confirm = requests.post(
            f"{BASE_URL}/api/password-reset/confirm",
            json={"token": dev_token, "new_password": "newpassword1"}
        )
        assert first_confirm.status_code == 200
        
        # Try to use token second time - should fail
        second_confirm = requests.post(
            f"{BASE_URL}/api/password-reset/confirm",
            json={"token": dev_token, "new_password": "newpassword2"}
        )
        assert second_confirm.status_code == 400


class TestRazorpayPayments:
    """Razorpay payment endpoint tests - Not configured, returns configured=false"""
    
    def test_payments_config_returns_not_configured(self):
        """Test GET /api/payments/config returns configured=false"""
        response = requests.get(f"{BASE_URL}/api/payments/config")
        assert response.status_code == 200
        data = response.json()
        assert data["configured"] == False
        assert data["key_id"] is None
        assert "plans" in data
    
    def test_payments_config_has_plans(self):
        """Test payments config includes subscription plans"""
        response = requests.get(f"{BASE_URL}/api/payments/config")
        assert response.status_code == 200
        data = response.json()
        
        plans = data["plans"]
        assert "monthly" in plans
        assert "yearly" in plans
        
        # Verify monthly plan structure
        monthly = plans["monthly"]
        assert monthly["name"] == "Monthly Subscription"
        assert monthly["amount"] == 49900  # ₹499.00 in paise
        assert monthly["currency"] == "INR"
        
        # Verify yearly plan structure
        yearly = plans["yearly"]
        assert yearly["name"] == "Yearly Subscription"
        assert yearly["amount"] == 499900  # ₹4,999.00 in paise
        assert yearly["currency"] == "INR"
    
    def test_create_order_returns_error_when_not_configured(self):
        """Test create order returns error when Razorpay not configured"""
        # First login to get auth token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@faithbyexperiments.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Try to create order
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"plan_id": "monthly"},
            headers={"Authorization": f"Bearer {token}"}
        )
        # 503 from FastAPI may be converted to 520 by Cloudflare
        assert response.status_code in [503, 520]
        data = response.json()
        assert "not configured" in data["detail"].lower()
    
    def test_create_order_requires_auth_or_returns_not_configured(self):
        """Test create order requires authentication or returns not configured"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"plan_id": "monthly"}
        )
        # Should return 503/520 (not configured) before checking auth, or 401 if auth checked first
        assert response.status_code in [401, 503, 520]
    
    def test_verify_payment_returns_error_when_not_configured(self):
        """Test verify payment returns error when Razorpay not configured"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@faithbyexperiments.com", "password": "admin123"}
        )
        token = login_response.json()["access_token"]
        
        response = requests.post(
            f"{BASE_URL}/api/payments/verify",
            json={
                "razorpay_order_id": "order_test123",
                "razorpay_payment_id": "pay_test123",
                "razorpay_signature": "sig_test123"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        # 503 from FastAPI may be converted to 520 by Cloudflare
        assert response.status_code in [503, 520]
    
    def test_get_orders_requires_auth(self):
        """Test get orders requires authentication"""
        response = requests.get(f"{BASE_URL}/api/payments/orders")
        assert response.status_code == 401


class TestExistingEndpoints:
    """Verify existing endpoints still work after new features added"""
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        assert "Faith by Experiments" in response.json()["message"]
    
    def test_login_still_works(self):
        """Test login endpoint still works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@faithbyexperiments.com", "password": "admin123"}
        )
        assert response.status_code == 200
        assert "access_token" in response.json()
    
    def test_get_posts_still_works(self):
        """Test posts endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
