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
            <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-6">
              <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black">Content Not Found</h1>
              <Link to="/flagship-contents" className="inline-flex items-center gap-2 text-accent-muted hover:text-accent-muted/80 font-sans font-semibold text-base">
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
        
        <section className="py-20 md:py-24 border-b border-black/10 overflow-x-hidden">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 overflow-x-hidden">
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
              
              <div className="space-y-8 md:space-y-12">
                {showFullContent ? (
                  <div 
                    className="font-sans text-base md:text-lg text-warm-black/80 leading-relaxed prose prose-lg max-w-none overflow-wrap-break-word" 
                    style={{ overflowWrap: 'break-word', wordWrap: 'break-word' }}
                    data-testid="full-content"
                    dangerouslySetInnerHTML={{ __html: content.fullContent }}
                  />
                ) : (
                  <>
                    {/* Preview content - shown clearly */}
                    <div 
                      className="font-sans text-base md:text-lg text-warm-black/80 leading-relaxed prose prose-lg max-w-none overflow-wrap-break-word"
                      style={{ overflowWrap: 'break-word', wordWrap: 'break-word' }}
                      data-testid="preview-content"
                      dangerouslySetInnerHTML={{ __html: content.previewContent }}
                    />
                    
                    {/* Blurred remaining content section */}
                    <div className="relative">
                      <div 
                        className="font-sans text-base md:text-lg text-warm-black/80 leading-relaxed prose prose-lg max-w-none blur-sm select-none pointer-events-none overflow-wrap-break-word"
                        style={{ minHeight: '400px', overflowWrap: 'break-word', wordWrap: 'break-word' }}
                      >
                        <p className="text-warm-black/60">
                          This content continues with additional frameworks, structured practices, and in-depth explorations. 
                          The full article contains detailed experimental methodologies, case studies, and reflective exercises 
                          designed to help you test faith as a hypothesis in your own life. Subscribe to access the complete 
                          content and join a community of thoughtful practitioners engaged in serious inquiry.
                        </p>
                        <p className="text-warm-black/60 mt-4">
                          The remaining sections cover advanced concepts, practical applications, and deeper philosophical 
                          considerations that build upon the foundation presented in the preview above. These sections explore 
                          the intersection of empirical observation and spiritual practice, providing structured approaches 
                          to testing hypotheses about meaning, intention, and the relationship between inner work and external outcomes.
                        </p>
                        <p className="text-warm-black/60 mt-4">
                          Through carefully designed experiments and reflective frameworks, readers can engage with these 
                          concepts in their own lives, collecting data and drawing conclusions based on personal experience 
                          rather than inherited belief or abstract speculation.
                        </p>
                      </div>
                    </div>
                    
                    {/* Subscribe box - appears after blurred content */}
                    <div className="text-center space-y-6">
                      <h3 className="font-serif font-semibold italic text-2xl md:text-3xl text-warm-black">Subscribe to Continue Reading</h3>
                      <p className="font-sans text-base md:text-lg text-warm-black/70 leading-relaxed">
                        This is premium content available exclusively to subscribers. Get full access to all experimental frameworks, structured practices, and in-depth explorations.
                      </p>
                      <Link to="/subscribe" className="inline-block bg-accent-muted hover:bg-accent-muted/90 text-white font-sans font-semibold text-base md:text-lg px-8 py-4 rounded transition-colors" data-testid="subscribe-cta">
                        Subscribe Now
                      </Link>
                    </div>
                  </>
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
