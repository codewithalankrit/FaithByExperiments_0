import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, LogOut } from 'lucide-react';
import { postsAPI, authAPI, getUser } from '../services/api';

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
      <div className="min-h-screen bg-off-white relative">
        <div 
          className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}
        />
        <div className="relative z-10">
          <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-12 md:py-16">
            <div className="font-sans text-lg text-warm-black/70">Loading posts...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white relative" data-testid="admin-dashboard">
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-12 md:py-16">
          <div className="flex justify-between items-center mb-12">
            <Link to="/" className="flex justify-center">
              <img 
                src="/Logo.png" 
                alt="Faith by Experiments" 
                className="h-20 md:h-28 lg:h-36"
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="font-sans text-base text-warm-black/70 hover:text-warm-black transition-colors" data-testid="view-site-link">
                View Site
              </Link>
              <button 
                onClick={handleLogout} 
                className="inline-flex items-center gap-2 font-sans font-medium text-base text-warm-black/70 hover:text-warm-black transition-colors" 
                data-testid="admin-logout-btn"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="space-y-12 md:space-y-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight mb-3">
                  Flagship Contents
                </h1>
                <p className="font-sans text-lg text-warm-black/70">
                  Manage your flagship content posts
                </p>
              </div>
              <Link 
                to="/admin/posts/new" 
                className="inline-flex items-center justify-center gap-2 bg-accent-muted hover:bg-accent-muted/90 text-white font-sans font-semibold text-base md:text-lg px-6 py-3 rounded transition-colors" 
                data-testid="create-post-btn"
              >
                <Plus size={20} />
                <span>Create New Post</span>
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded font-sans text-sm md:text-base">
                {error}
              </div>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-16 space-y-6">
                <p className="font-sans text-lg text-warm-black/70">No posts yet. Create your first flagship content post.</p>
                <Link 
                  to="/admin/posts/new" 
                  className="inline-flex items-center justify-center gap-2 bg-accent-muted hover:bg-accent-muted/90 text-white font-sans font-semibold text-base md:text-lg px-6 py-3 rounded transition-colors"
                >
                  <Plus size={20} />
                  <span>Create Post</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white border border-black/10 p-6 md:p-8 space-y-4" data-testid={`admin-post-${post.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-serif font-semibold text-xl md:text-2xl text-warm-black leading-tight flex-1">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/admin/posts/edit/${post.id}`}
                          className="p-2 text-warm-black/60 hover:text-accent-muted transition-colors"
                          title="Edit post"
                          data-testid={`edit-post-${post.id}`}
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-warm-black/60 hover:text-red-600 transition-colors"
                          title="Delete post"
                          data-testid={`delete-post-${post.id}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="font-sans text-base text-warm-black/70 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="pt-4 border-t border-black/10">
                      <span className="font-sans text-sm text-warm-black/50">
                        Last updated: {new Date(post.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
