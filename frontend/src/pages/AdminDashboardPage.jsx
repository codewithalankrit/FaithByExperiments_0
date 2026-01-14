import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, LogOut } from 'lucide-react';
import { postsAPI, authAPI, getUser } from '../services/api';
import '../styles/AdminPages.css';

export const AdminDashboardPage = ({ user, onAdminLogout }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is admin
    const currentUser = user || getUser();
    if (!currentUser || !currentUser.is_admin) {
      navigate('/admin/login');
      return;
    }

    // Load posts from API
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await postsAPI.getAll();
        setPosts(fetchedPosts);
      } catch (err) {
        setError('Failed to load posts');
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [navigate, user]);

  const handleLogout = () => {
    authAPI.logout();
    if (onAdminLogout) onAdminLogout();
    navigate('/');
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await postsAPI.delete(postId);
        setPosts(posts.filter(post => post.id !== postId));
      } catch (err) {
        alert('Failed to delete post: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <header className="admin-header">
          <div className="admin-header-content">
            <Link to="/" className="admin-logo">
              <img 
                src="https://customer-assets.emergentagent.com/job_34e2cbef-ee34-45ac-8348-79293beec714/artifacts/j8mvu38p_Production-edited-Logo-Photoroom.png" 
                alt="Faith by Experiments" 
                className="admin-header-logo"
              />
            </Link>
          </div>
        </header>
        <div className="admin-dashboard-container">
          <div className="loading-state">Loading posts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page" data-testid="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <Link to="/" className="admin-logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_34e2cbef-ee34-45ac-8348-79293beec714/artifacts/j8mvu38p_Production-edited-Logo-Photoroom.png" 
              alt="Faith by Experiments" 
              className="admin-header-logo"
            />
          </Link>
          <div className="admin-header-actions">
            <Link to="/" className="admin-header-link" data-testid="view-site-link">View Site</Link>
            <button onClick={handleLogout} className="admin-logout-button" data-testid="admin-logout-btn">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="admin-dashboard-container">
        <div className="admin-dashboard-header">
          <div>
            <h1 className="admin-dashboard-title">Flagship Contents</h1>
            <p className="admin-dashboard-subtitle">Manage your flagship content posts</p>
          </div>
          <Link to="/admin/posts/new" className="admin-create-button" data-testid="create-post-btn">
            <Plus size={20} />
            <span>Create New Post</span>
          </Link>
        </div>

        {error && (
          <div className="admin-error">{error}</div>
        )}

        {posts.length === 0 ? (
          <div className="admin-empty-state">
            <p>No posts yet. Create your first flagship content post.</p>
            <Link to="/admin/posts/new" className="admin-create-button">
              <Plus size={20} />
              <span>Create Post</span>
            </Link>
          </div>
        ) : (
          <div className="admin-posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="admin-post-card" data-testid={`admin-post-${post.id}`}>
                <div className="admin-post-header">
                  <h3 className="admin-post-title">{post.title}</h3>
                  <div className="admin-post-actions">
                    <Link 
                      to={`/admin/posts/edit/${post.id}`}
                      className="admin-action-button edit"
                      title="Edit post"
                      data-testid={`edit-post-${post.id}`}
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="admin-action-button delete"
                      title="Delete post"
                      data-testid={`delete-post-${post.id}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="admin-post-excerpt">{post.excerpt}</p>
                <div className="admin-post-meta">
                  <span>Last updated: {new Date(post.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
