"""
Backend API Tests for Faith by Experiments
Tests: Auth (signup, login, admin login) and Posts CRUD operations
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_USER_EMAIL = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "test123"
TEST_USER_NAME = "Test User"

ADMIN_EMAIL = "admin@faithbyexperiments.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def test_user_token(api_client):
    """Create a test user and return token"""
    response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
        "name": TEST_USER_NAME,
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Could not create test user")


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Login as admin and return token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin login failed")


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self, api_client):
        """Test /api/health returns healthy status"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_root_endpoint(self, api_client):
        """Test /api/ returns API info"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["status"] == "running"


class TestUserSignup:
    """User signup endpoint tests"""
    
    def test_signup_success(self, api_client):
        """Test successful user signup returns JWT token"""
        unique_email = f"signup_test_{uuid.uuid4().hex[:8]}@example.com"
        response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Signup Test User",
            "email": unique_email,
            "password": "testpass123"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify token is returned
        assert "access_token" in data
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
        
        # Verify user data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["name"] == "Signup Test User"
        assert data["user"]["is_admin"] == False
        assert data["user"]["is_subscribed"] == False
    
    def test_signup_duplicate_email(self, api_client):
        """Test signup with existing email fails"""
        # First signup
        unique_email = f"dup_test_{uuid.uuid4().hex[:8]}@example.com"
        api_client.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "First User",
            "email": unique_email,
            "password": "testpass123"
        })
        
        # Second signup with same email
        response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Second User",
            "email": unique_email,
            "password": "testpass456"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "already registered" in data["detail"].lower()


class TestUserLogin:
    """User login endpoint tests"""
    
    def test_login_success(self, api_client, test_user_token):
        """Test successful login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify token is returned
        assert "access_token" in data
        assert isinstance(data["access_token"], str)
        
        # Verify user data
        assert "user" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
    
    def test_login_invalid_password(self, api_client):
        """Test login with wrong password fails"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_login_nonexistent_user(self, api_client):
        """Test login with non-existent email fails"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        })
        
        assert response.status_code == 401


class TestAdminLogin:
    """Admin login tests"""
    
    def test_admin_login_success(self, api_client):
        """Test admin login returns is_admin=true"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify admin flag
        assert data["user"]["is_admin"] == True
        assert data["user"]["email"] == ADMIN_EMAIL
        
        # Verify token
        assert "access_token" in data
    
    def test_admin_is_subscribed(self, api_client):
        """Test admin user is subscribed"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["is_subscribed"] == True


class TestGetMe:
    """Test /auth/me endpoint"""
    
    def test_get_me_authenticated(self, api_client, test_user_token):
        """Test getting current user info with valid token"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_USER_EMAIL
        assert "id" in data
    
    def test_get_me_unauthenticated(self, api_client):
        """Test getting current user without token fails"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401


class TestPostsListing:
    """Posts listing endpoint tests"""
    
    def test_get_all_posts(self, api_client):
        """Test GET /api/posts returns posts list"""
        response = api_client.get(f"{BASE_URL}/api/posts")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list)
        
        # If posts exist, verify structure
        if len(data) > 0:
            post = data[0]
            assert "id" in post
            assert "title" in post
            assert "slug" in post
            assert "excerpt" in post
            assert "preview_content" in post
            assert "is_premium" in post
            assert "created_at" in post
    
    def test_get_posts_with_auth(self, api_client, admin_token):
        """Test GET /api/posts with auth returns full content for subscribed users"""
        response = api_client.get(
            f"{BASE_URL}/api/posts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestSinglePost:
    """Single post endpoint tests"""
    
    def test_get_post_by_id(self, api_client):
        """Test GET /api/posts/{id} returns post details"""
        # First get all posts to find an ID
        posts_response = api_client.get(f"{BASE_URL}/api/posts")
        posts = posts_response.json()
        
        if len(posts) == 0:
            pytest.skip("No posts available to test")
        
        post_id = posts[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/posts/{post_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == post_id
        assert "title" in data
        assert "content" in data
    
    def test_get_post_not_found(self, api_client):
        """Test GET /api/posts/{id} with invalid ID returns 404"""
        response = api_client.get(f"{BASE_URL}/api/posts/nonexistent-post-id")
        assert response.status_code == 404


class TestAdminCreatePost:
    """Admin create post tests"""
    
    def test_create_post_as_admin(self, api_client, admin_token):
        """Test POST /api/posts creates new post (admin only)"""
        post_data = {
            "title": f"TEST_Post_{uuid.uuid4().hex[:8]}",
            "excerpt": "This is a test post excerpt",
            "content": "This is the full content of the test post. It contains detailed information.",
            "is_premium": True
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/posts",
            json=post_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify post data
        assert data["title"] == post_data["title"]
        assert data["excerpt"] == post_data["excerpt"]
        assert data["content"] == post_data["content"]
        assert data["is_premium"] == True
        assert "id" in data
        assert "slug" in data
        
        # Store for cleanup
        return data["id"]
    
    def test_create_post_without_auth(self, api_client):
        """Test POST /api/posts without auth fails"""
        response = api_client.post(f"{BASE_URL}/api/posts", json={
            "title": "Unauthorized Post",
            "excerpt": "Test",
            "content": "Test content"
        })
        
        assert response.status_code == 401
    
    def test_create_post_as_non_admin(self, api_client, test_user_token):
        """Test POST /api/posts as non-admin fails"""
        response = api_client.post(
            f"{BASE_URL}/api/posts",
            json={
                "title": "Non-admin Post",
                "excerpt": "Test",
                "content": "Test content"
            },
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        
        assert response.status_code == 403


class TestAdminUpdatePost:
    """Admin update post tests"""
    
    def test_update_post_as_admin(self, api_client, admin_token):
        """Test PUT /api/posts/{id} updates post"""
        # First create a post
        create_response = api_client.post(
            f"{BASE_URL}/api/posts",
            json={
                "title": f"TEST_Update_{uuid.uuid4().hex[:8]}",
                "excerpt": "Original excerpt",
                "content": "Original content"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert create_response.status_code == 200
        post_id = create_response.json()["id"]
        
        # Update the post
        update_data = {
            "title": "Updated Title",
            "excerpt": "Updated excerpt"
        }
        
        update_response = api_client.put(
            f"{BASE_URL}/api/posts/{post_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["title"] == "Updated Title"
        assert data["excerpt"] == "Updated excerpt"
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/posts/{post_id}")
        assert get_response.status_code == 200
        assert get_response.json()["title"] == "Updated Title"
    
    def test_update_post_not_found(self, api_client, admin_token):
        """Test PUT /api/posts/{id} with invalid ID returns 404"""
        response = api_client.put(
            f"{BASE_URL}/api/posts/nonexistent-id",
            json={"title": "New Title"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 404


class TestAdminDeletePost:
    """Admin delete post tests"""
    
    def test_delete_post_as_admin(self, api_client, admin_token):
        """Test DELETE /api/posts/{id} removes post"""
        # First create a post
        create_response = api_client.post(
            f"{BASE_URL}/api/posts",
            json={
                "title": f"TEST_Delete_{uuid.uuid4().hex[:8]}",
                "excerpt": "To be deleted",
                "content": "This post will be deleted"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert create_response.status_code == 200
        post_id = create_response.json()["id"]
        
        # Delete the post
        delete_response = api_client.delete(
            f"{BASE_URL}/api/posts/{post_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert delete_response.status_code == 200
        
        # Verify deletion with GET
        get_response = api_client.get(f"{BASE_URL}/api/posts/{post_id}")
        assert get_response.status_code == 404
    
    def test_delete_post_without_auth(self, api_client):
        """Test DELETE /api/posts/{id} without auth fails"""
        response = api_client.delete(f"{BASE_URL}/api/posts/any-id")
        assert response.status_code == 401
    
    def test_delete_post_not_found(self, api_client, admin_token):
        """Test DELETE /api/posts/{id} with invalid ID returns 404"""
        response = api_client.delete(
            f"{BASE_URL}/api/posts/nonexistent-id",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 404


class TestMockSubscription:
    """Mock subscription endpoint tests"""
    
    def test_subscribe_authenticated(self, api_client, test_user_token):
        """Test POST /api/auth/subscribe marks user as subscribed"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/subscribe",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_subscribed"] == True
    
    def test_subscribe_unauthenticated(self, api_client):
        """Test POST /api/auth/subscribe without auth fails"""
        response = api_client.post(f"{BASE_URL}/api/auth/subscribe")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
