import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { postsAPI } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import '../styles/FlagshipContentDetailPage.css';

export const FlagshipContentDetailPage = ({ isLoggedIn, isSubscribed, isAdmin, onLogout }) => {
  const { contentId } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const post = await postsAPI.getOne(contentId);
        setContent({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          previewContent: post.content,
          fullContent: post.content,
          isPremium: post.is_premium
        });
      } catch (err) {
        setError('Content not found');
        console.error('Error fetching post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [contentId]);

  if (loading) {
    return (
      <div className="content-detail-page">
        <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
        <section className="content-detail-section">
          <div className="content-detail-container">
            <div className="loading-state">Loading content...</div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }
  
  if (error || !content) {
    return (
      <div className="content-detail-page">
        <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
        <div className="not-found-container">
          <h1>Content Not Found</h1>
          <Link to="/flagship-contents" className="back-link">← Back to Flagship Contents</Link>
        </div>
        <Footer />
      </div>
    );
  }
  
  const showFullContent = !content.isPremium || isSubscribed;
  
  return (
    <div className="content-detail-page" data-testid="content-detail-page">
      <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
      
      <section className="content-detail-section">
        <div className="content-detail-container">
          <Link to="/flagship-contents" className="back-nav">
            <ArrowLeft size={18} />
            <span>Back to Flagship Contents</span>
          </Link>
          
          <article className="content-article">
            <header className="article-header">
              <h1 className="article-title" data-testid="post-title">{content.title}</h1>
            </header>
            
            <div className="article-body">
              {showFullContent ? (
                <div 
                  className="full-content" 
                  data-testid="full-content"
                  dangerouslySetInnerHTML={{ __html: content.fullContent }}
                />
              ) : (
                <div className="preview-content" data-testid="preview-content">
                  <div 
                    className="preview-text"
                    dangerouslySetInnerHTML={{ __html: content.previewContent }}
                  />
                  
                  <div className="content-lock-overlay">
                    <div className="lock-message">
                      <h3>Subscribe to Continue Reading</h3>
                      <p>This is premium content available exclusively to subscribers. Get full access to all experimental frameworks, structured practices, and in-depth explorations.</p>
                      <Link to="/subscribe" className="subscribe-cta" data-testid="subscribe-cta">Subscribe Now</Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};
