import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { siteContent } from '../data/content';
import { postsAPI } from '../services/api';
import { HomePageSEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

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
    <div className="home-page" data-testid="home-page">
      <HomePageSEO />
      <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-headline">{siteContent.hero.headline}</h1>
          <div className="hero-supporting">
            {siteContent.hero.supportingText.map((text, index) => (
              <p key={index} className="hero-text">{text}</p>
            ))}
          </div>
        </div>
      </section>
      
      {/* About the Founder */}
      <section id="about-founder" className="about-founder-section">
        <div className="about-container">
          <h2 className="section-title about-heading">{siteContent.aboutFounder.title}</h2>
          <div className="about-image">
            <img src={siteContent.aboutFounder.imageUrl} alt="Ajit Kumar - Founder" />
            <p className="founder-name">Ajit Kumar</p>
          </div>
          <div className="about-content">
            <div className="about-text">
              {siteContent.aboutFounder.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="about-paragraph">{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Positioning Bridge */}
      <section className="positioning-bridge">
        <div className="bridge-container">
          <p className="bridge-statement">{siteContent.positioningBridge.statement}</p>
        </div>
      </section>
      
      {/* Manifesto */}
      <section id="manifesto" className="manifesto-section">
        <div className="manifesto-container">
          <h2 className="manifesto-title">{siteContent.manifesto.title}</h2>
          <div className="manifesto-content">
            {siteContent.manifesto.sections.map((section, index) => (
              <div key={index} className="manifesto-section-block">
                <h3 className="manifesto-heading">{section.heading}</h3>
                <div className="manifesto-text">
                  {section.content.split('\n\n').map((paragraph, pIndex) => (
                    <p key={pIndex} className="manifesto-paragraph" dangerouslySetInnerHTML={{ __html: paragraph }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How the Work is Structured */}
      <section className="work-structure-section">
        <div className="work-structure-container">
          <h2 className="section-title">{siteContent.workStructure.title}</h2>
          <ul className="work-structure-list">
            {siteContent.workStructure.items.map((item, index) => (
              <li key={index} className="work-structure-item">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
      
      {/* Flagship Content Preview Section */}
      <section className="flagship-home-section">
        <div className="flagship-home-container">
          <div className="flagship-home-header">
            <h2 className="section-title">{siteContent.flagshipPreview.title}</h2>
          </div>
          
          <div className="flagship-preview-content" data-testid="flagship-preview">
            {flagshipPreviewPost && (
              <h3 className="flagship-preview-title">{flagshipPreviewPost.title}</h3>
            )}
            <p className="flagship-preview-text" dangerouslySetInnerHTML={{ __html: previewContent }} />
            
            {!isSubscribed && (
              <div className="flagship-preview-lock">
                <p className="lock-message">{siteContent.flagshipPreview.lockedMessage}</p>
              </div>
            )}
          </div>
          
          <div className="flagship-home-cta">
            <Link 
              to={isSubscribed ? "/flagship-contents" : "/subscribe"} 
              className="view-all-link"
              data-testid="flagship-cta"
            >
              {isSubscribed ? "View Complete Flagship Contents" : "Subscribe to View Complete Contents"}
            </Link>
          </div>
        </div>
      </section>
      
      {/* Pricing / Subscribe Section - Only show if user is not subscribed */}
      {!isSubscribed && (
        <section className="pricing-section">
          <div className="pricing-container">
            <div className="pricing-grid">
              {/* Left Column - Value & Meaning */}
              <div className="pricing-left">
                <h2 className="pricing-title">{siteContent.pricing.title}</h2>
                <p className="pricing-description">{siteContent.pricing.description}</p>
                
                <ul className="value-points">
                  {siteContent.pricing.valuePoints.map((point, index) => (
                    <li key={index} className="value-point">{point}</li>
                  ))}
                </ul>
                
                <blockquote className="pricing-quote">
                  {siteContent.pricing.quote}
                </blockquote>
              </div>
              
              {/* Right Column - Subscription Options */}
              <div className="pricing-right">
                <div className="membership-options">
                  {siteContent.pricing.plans.map((plan, index) => (
                    <div 
                      key={index} 
                      className={`membership-plan ${plan.recommended ? 'recommended-plan' : ''}`}
                    >
                      <h3 className="plan-name">{plan.name}</h3>
                      <div className="plan-price">
                        <span className="currency">{plan.currency}</span>
                        <span className="price">{plan.price}</span>
                        <span className="period">/ {plan.period}</span>
                      </div>
                      <p className="plan-note">{plan.note}</p>
                    </div>
                  ))}
                </div>
                
                <div className="pricing-cta-wrapper">
                  <Link to="/subscribe" className="pricing-cta" data-testid="pricing-subscribe-btn">
                    {siteContent.pricing.cta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      <Footer />
    </div>
  );
};
