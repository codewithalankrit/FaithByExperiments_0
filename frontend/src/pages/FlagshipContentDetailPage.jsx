import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { postsAPI } from '../services/api';
import { ArrowLeft } from 'lucide-react';

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
      <div className="min-h-screen bg-off-white relative">
        <div 
          className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}
        />
        <div className="relative z-10">
          <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
          <section className="py-20 md:py-24">
            <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
              <div className="font-sans text-lg text-warm-black/70">Loading content...</div>
            </div>
          </section>
          <Footer />
        </div>
      </div>
    );
  }
  
  if (error || !content) {
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
          <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
          <section className="py-20 md:py-24">
            <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12 text-center space-y-6">
              <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black">Content Not Found</h1>
              <Link to="/flagship-contents" className="inline-flex items-center gap-2 text-sage hover:text-sage/80 font-sans font-semibold text-base">
                ← Back to Flagship Contents
              </Link>
            </div>
          </section>
          <Footer />
        </div>
      </div>
    );
  }
  
  const showFullContent = !content.isPremium || isSubscribed;
  
  return (
    <div className="min-h-screen bg-off-white relative" data-testid="content-detail-page">
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />
      <div className="relative z-10">
        <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
        
        <section className="py-20 md:py-24 border-b border-black/10">
          <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
            <Link to="/flagship-contents" className="inline-flex items-center gap-2 text-warm-black/60 hover:text-warm-black font-sans text-sm md:text-base mb-12 transition-colors">
              <ArrowLeft size={18} />
              <span>Back to Flagship Contents</span>
            </Link>
            
            <article className="space-y-8 md:space-y-12">
              <header>
                <h1 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl text-warm-black leading-tight" data-testid="post-title">
                  {content.title}
                </h1>
              </header>
              
              <div className="relative">
                {showFullContent ? (
                  <div 
                    className="font-sans text-base md:text-lg text-warm-black/80 leading-relaxed prose prose-lg max-w-none" 
                    data-testid="full-content"
                    dangerouslySetInnerHTML={{ __html: content.fullContent }}
                  />
                ) : (
                  <div className="relative" data-testid="preview-content">
                    <div 
                      className="font-sans text-base md:text-lg text-warm-black/80 leading-relaxed prose prose-lg max-w-none blur-sm"
                      dangerouslySetInnerHTML={{ __html: content.previewContent }}
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                      <div className="max-w-md mx-auto text-center space-y-6 p-8">
                        <h3 className="font-serif font-semibold text-2xl md:text-3xl text-warm-black">Subscribe to Continue Reading</h3>
                        <p className="font-sans text-base text-warm-black/70 leading-relaxed">
                          This is premium content available exclusively to subscribers. Get full access to all experimental frameworks, structured practices, and in-depth explorations.
                        </p>
                        <Link to="/subscribe" className="inline-block bg-sage hover:bg-sage/90 text-white font-sans font-semibold text-base md:text-lg px-8 py-4 rounded transition-colors" data-testid="subscribe-cta">
                          Subscribe Now
                        </Link>
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
    </div>
  );
};
