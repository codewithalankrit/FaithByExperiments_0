import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { postsAPI } from '../services/api';
import { FlagshipContentsSEO } from '../components/SEO';

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
            <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
              <Link to="/" className="inline-flex items-center gap-2 text-warm-black/60 hover:text-warm-black font-sans text-sm md:text-base mb-8 transition-colors">
                <ArrowLeft size={18} />
                <span>Back to Home</span>
              </Link>
              <div className="font-sans text-lg text-warm-black/70">Loading content...</div>
            </div>
          </section>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white relative" data-testid="flagship-contents-page">
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />
      <div className="relative z-10">
        <FlagshipContentsSEO />
        <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
        
        <section className="py-20 md:py-24 border-b border-black/10">
          <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
            <Link to="/" className="inline-flex items-center gap-2 text-warm-black/60 hover:text-warm-black font-sans text-sm md:text-base mb-12 transition-colors">
              <ArrowLeft size={18} />
              <span>Back to Home</span>
            </Link>
            
            <div className="mb-12 space-y-4">
              <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight">Flagship Contents</h1>
              <p className="font-sans text-lg md:text-xl text-warm-black/70 leading-relaxed max-w-3xl">
                Structured experiments, frameworks, and observations designed for those who treat faith as a hypothesis worth testing.
              </p>
            </div>
            
            {!isSubscribed && (
              <div className="bg-sage/10 border border-sage/30 px-6 py-4 rounded mb-8">
                <p className="font-sans text-base text-warm-black/80">
                  You are viewing previews only. <Link to="/subscribe" className="text-sage hover:text-sage/80 font-semibold underline">Subscribe</Link> to access complete content.
                </p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded mb-8 font-sans text-base">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {contentItems.map((item) => (
                <div key={item.id} className="bg-white border border-black/10 p-6 md:p-8 space-y-4" data-testid={`post-card-${item.id}`}>
                  <h3 className="font-serif font-semibold text-xl md:text-2xl text-warm-black leading-tight">{item.title}</h3>
                  <p className="font-sans text-base text-warm-black/70 leading-relaxed">{item.excerpt}</p>
                  <Link 
                    to={`/flagship-contents/${item.id}`}
                    className="inline-flex items-center gap-2 text-sage hover:text-sage/80 font-sans font-semibold text-base transition-colors"
                    data-testid={`read-post-${item.id}`}
                  >
                    {isSubscribed ? 'Read Full Content' : 'Read Preview'} →
                  </Link>
                </div>
              ))}
            </div>
            
            {contentItems.length === 0 && !error && (
              <div className="text-center py-16">
                <p className="font-sans text-lg text-warm-black/60">No content available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>
        
        <Footer />
      </div>
    </div>
  );
};
