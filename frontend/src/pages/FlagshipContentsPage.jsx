import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { postsAPI } from '../services/api';
import { FlagshipContentsSEO } from '../components/SEO';
import '../styles/FlagshipContentsPage.css';

export const FlagshipContentsPage = ({ isLoggedIn, isSubscribed, isAdmin, onLogout }) => {
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const posts = await postsAPI.getAll();
        // Transform API response to match component expectations
        const formattedPosts = posts.map(post => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          previewContent: post.preview_content,
          fullContent: post.preview_content,
          isPremium: post.is_premium
        }));
        setContentItems(formattedPosts);
      } catch (err) {
        setError('Failed to load content. Please try again.');
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flagship-contents-page">
        <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
        <section className="flagship-contents-section">
          <div className="flagship-contents-container">
            <Link to="/" className="back-to-home-link">
              <ArrowLeft size={18} />
              <span>Back to Home</span>
            </Link>
            <div className="loading-state">Loading content...</div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flagship-contents-page" data-testid="flagship-contents-page">
      <FlagshipContentsSEO />
      <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
      
      <section className="flagship-contents-section">
        <div className="flagship-contents-container">
          <Link to="/" className="back-to-home-link">
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </Link>
          
          <div className="flagship-header">
            <h1 className="flagship-page-title">Flagship Contents</h1>
            <p className="flagship-description">
              Structured experiments, frameworks, and observations designed for those who treat faith as a hypothesis worth testing.
            </p>
          </div>
          
          {!isSubscribed && (
            <div className="subscription-notice">
              <p>You are viewing previews only. <Link to="/subscribe" className="subscribe-inline-link">Subscribe</Link> to access complete content.</p>
            </div>
          )}
          
          {error && (
            <div className="error-notice">
              <p>{error}</p>
            </div>
          )}
          
          <div className="content-grid">
            {contentItems.map((item) => (
              <div key={item.id} className="content-card" data-testid={`post-card-${item.id}`}>
                <div className="content-card-header">
                  <h3 className="content-title">{item.title}</h3>
                </div>
                
                <p className="content-excerpt">{item.excerpt}</p>
                
                <Link 
                  to={`/flagship-contents/${item.id}`}
                  className="read-more-link"
                  data-testid={`read-post-${item.id}`}
                >
                  {isSubscribed ? 'Read Full Content' : 'Read Preview'} →
                </Link>
              </div>
            ))}
          </div>
          
          {contentItems.length === 0 && !error && (
            <div className="empty-state">
              <p>No content available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};
