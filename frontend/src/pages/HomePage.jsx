import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { siteContent } from '../data/content';
import { postsAPI } from '../services/api';
import { HomePageSEO } from '../components/SEO';
import { Link } from 'react-router-dom';

export const HomePage = ({ isLoggedIn, isSubscribed, isAdmin, onLogout }) => {
  const [flagshipPreviewPost, setFlagshipPreviewPost] = useState(null);

  useEffect(() => {
    // Load the first post from API for the preview section
    const fetchFirstPost = async () => {
      try {
        const posts = await postsAPI.getAll();
        if (posts.length > 0) {
          setFlagshipPreviewPost({
            title: posts[0].title,
            content: posts[0].preview_content
          });
        }
      } catch (err) {
        console.error('Error fetching flagship preview:', err);
      }
    };
    
    fetchFirstPost();
  }, []);

  // Helper to strip HTML tags for preview
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  // Get preview content - from API post or fallback to static content
  const previewContent = flagshipPreviewPost 
    ? (() => {
        const stripped = stripHtml(flagshipPreviewPost.content);
        return stripped.length > 500 ? stripped.substring(0, 500) + '...' : stripped;
      })()
    : siteContent.flagshipPreview.previewContent;

  return (
    <div className="min-h-screen bg-off-white relative" data-testid="home-page">
      {/* Subtle noise texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />
      
      <div className="relative z-10">
        <HomePageSEO />
        <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
        
        {/* Hero Section */}
        <section className="pt-28 pb-20 md:pt-32 md:pb-24 border-b border-black/10 relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 relative">
            {/* Logo with 10% opacity in the center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 pb-8 md:pb-12 lg:pb-16">
              <img 
                src="/Logo.png" 
                alt="" 
                className="opacity-10 max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl w-auto h-auto object-contain"
              />
            </div>
            
            <div className="text-center space-y-8 md:space-y-12 relative z-10">
              <h1 className="font-serif font-bold text-5xl md:text-6xl lg:text-[64px] leading-tight text-warm-black tracking-tight">
                {siteContent.hero.headline}
              </h1>
              <div className="space-y-6 max-w-3xl mx-auto">
                {siteContent.hero.supportingText.map((text, index) => (
                  <p key={index} className="font-sans text-lg md:text-xl text-warm-black/70 leading-relaxed font-light">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* About the Founder */}
        <section id="about-founder" className="py-20 md:py-24 space-y-16 border-b border-black/10">
          <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
            {/* Mobile: Flex column with custom order */}
            <div className="flex flex-col lg:hidden gap-12">
              {/* Title - Order 1 */}
              <div className="order-1">
                <h2 className="font-serif font-semibold text-3xl md:text-4xl text-warm-black leading-tight">
                  {siteContent.aboutFounder.title}
                </h2>
              </div>
              
              {/* Image - Order 2 */}
              <div className="order-2">
                <div className="border border-black/10 max-w-md mx-auto">
                  <img 
                    src={siteContent.aboutFounder.imageUrl} 
                    alt="Ajit Kumar - Founder" 
                    className="w-full h-auto block grayscale"
                  />
                  <p className="font-sans text-lg font-semibold text-warm-black text-center py-4 bg-white border-t border-black/10">
                    Ajit Kumar
                  </p>
                </div>
              </div>
              
              {/* Description - Order 3 */}
              <div className="order-3">
                <div className="space-y-7 font-sans text-base md:text-lg text-warm-black/70 leading-relaxed">
                  {siteContent.aboutFounder.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="whitespace-pre-line">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8 space-y-12">
                <h2 className="font-serif font-semibold text-3xl md:text-4xl text-warm-black leading-tight">
                  {siteContent.aboutFounder.title}
                </h2>
                <div className="space-y-7 font-sans text-base md:text-lg text-warm-black/70 leading-relaxed">
                  {siteContent.aboutFounder.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="whitespace-pre-line">{paragraph}</p>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="sticky top-28 border border-black/10">
                  <img 
                    src={siteContent.aboutFounder.imageUrl} 
                    alt="Ajit Kumar - Founder" 
                    className="w-full h-auto block grayscale"
                  />
                  <p className="font-sans text-lg font-semibold text-warm-black text-center py-4 bg-white border-t border-black/10">
                    Ajit Kumar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Positioning Bridge */}
        <section className="py-20 md:py-24 border-b border-black/10 bg-off-white/50">
          <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
            <p className="font-sans text-2xl md:text-3xl text-warm-black leading-relaxed text-center font-medium">
              {siteContent.positioningBridge.statement}
            </p>
          </div>
        </section>
        
        {/* Manifesto */}
        <section id="manifesto" className="py-20 md:py-24 space-y-20 border-b border-black/10">
          <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight text-center mb-16 md:mb-20">
              {siteContent.manifesto.title}
            </h2>
            <div className="space-y-16 md:space-y-20">
              {siteContent.manifesto.sections.map((section, index) => (
                <div key={index} className="space-y-6">
                  <h3 className="font-serif font-bold text-2xl md:text-3xl text-warm-black leading-tight">
                    {section.heading}
                  </h3>
                  <div className="space-y-5 font-sans text-base md:text-lg text-warm-black/80 leading-relaxed">
                    {section.content.split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: paragraph }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How the Work is Structured */}
        <section className="py-20 md:py-24 border-b border-black/10">
          <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
            <h2 className="font-serif font-semibold text-3xl md:text-4xl text-warm-black leading-tight mb-12">
              {siteContent.workStructure.title}
            </h2>
            <ul className="space-y-5 font-sans text-base md:text-lg text-warm-black/70 leading-relaxed">
              {siteContent.workStructure.items.map((item, index) => (
                <li key={index} className="pl-8 relative before:content-['#'] before:absolute before:left-0 before:text-warm-black before:font-semibold">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
        
        {/* Flagship Content Preview Section */}
        <section className="py-20 md:py-24 border-b border-black/10">
          <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="font-serif font-semibold text-3xl md:text-4xl text-warm-black leading-tight">
                {siteContent.flagshipPreview.title}
              </h2>
            </div>
            
            <div className="bg-white border border-black/10 p-8 md:p-12 mb-12" data-testid="flagship-preview">
              {flagshipPreviewPost && (
                <h3 className="font-serif font-semibold text-2xl md:text-3xl text-warm-black mb-6 leading-tight">
                  {flagshipPreviewPost.title}
                </h3>
              )}
              <div 
                className="font-sans text-base md:text-lg text-warm-black/70 leading-relaxed prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }} 
              />
              
              {!isSubscribed && (
                <div className="mt-10 pt-8 border-t border-black/10 text-center">
                  <p className="font-sans text-base text-warm-black/50 italic leading-relaxed">
                    {siteContent.flagshipPreview.lockedMessage}
                  </p>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <Link 
                to={isSubscribed ? "/flagship-contents" : "/subscribe"} 
                className="inline-block font-sans font-semibold text-base md:text-lg text-warm-black border-2 border-black/20 px-8 py-4 hover:border-sage hover:text-sage transition-colors"
                data-testid="flagship-cta"
              >
                {isSubscribed ? "View Complete Flagship Contents" : "Subscribe to View Complete Contents"}
              </Link>
            </div>
          </div>
        </section>
        
        {/* Pricing / Subscribe Section - Only show if user is not subscribed */}
        {!isSubscribed && (
          <section className="py-20 md:py-24 border-b border-black/10 bg-off-white/30">
            <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
                {/* Left Column - Value & Meaning */}
                <div className="space-y-12">
                  <h2 className="font-serif font-semibold text-4xl md:text-5xl text-warm-black leading-tight">
                    {siteContent.pricing.title}
                  </h2>
                  {siteContent.pricing.description && (
                    <p className="font-sans text-xl text-warm-black/70 leading-relaxed">
                      {siteContent.pricing.description}
                    </p>
                  )}
                  
                  {siteContent.pricing.valuePoints.length > 0 && (
                    <ul className="space-y-5 font-sans text-base md:text-lg text-warm-black/70 leading-relaxed">
                      {siteContent.pricing.valuePoints.map((point, index) => (
                        <li key={index} className="pl-6 relative before:content-['•'] before:absolute before:left-0 before:text-sage before:text-xl before:font-semibold">
                          {point}
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <blockquote className="font-sans text-base md:text-lg text-warm-black/60 italic leading-relaxed pl-6 border-l-2 border-black/20">
                    {siteContent.pricing.quote}
                  </blockquote>
                </div>
                
                {/* Right Column - Subscription Options */}
                <div className="bg-white border border-black/10 p-8 md:p-12">
                  <div className="space-y-6 mb-10">
                    {siteContent.pricing.plans.map((plan, index) => (
                      <div 
                        key={index} 
                        className={`p-8 border border-black/10 ${plan.recommended ? 'bg-off-white/50 border-black/20' : ''}`}
                      >
                        <h3 className="font-sans font-semibold text-xl text-warm-black mb-6 leading-tight">
                          {plan.name}
                        </h3>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="font-sans font-semibold text-2xl text-warm-black/70">{plan.currency}</span>
                          <span className="font-sans font-semibold text-5xl text-warm-black leading-none tracking-tight">{plan.price}</span>
                          <span className="font-sans text-base text-warm-black/50 font-medium ml-1">/ {plan.period}</span>
                        </div>
                        <p className="font-sans text-sm text-warm-black/60 leading-relaxed">
                          {plan.note}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <Link 
                    to="/subscribe" 
                    className="block w-full text-center font-sans font-semibold text-lg text-white bg-sage hover:bg-sage/90 py-5 transition-colors"
                    data-testid="pricing-subscribe-btn"
                  >
                    {siteContent.pricing.cta}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
        
        <Footer />
      </div>
    </div>
  );
};
