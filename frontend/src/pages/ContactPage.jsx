import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ContactSEO } from '../components/SEO';
import { getUser } from '../services/api';
import { siteContent } from '../data/content';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const ContactPage = () => {
  const user = getUser();
  const isAdmin = user?.is_admin || false;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/contact/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          whatsapp: formData.whatsapp || null,
          message: formData.message
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send inquiry');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white relative" data-testid="contact-page">
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />
      <div className="relative z-10">
        <ContactSEO />
        <Header isAdmin={isAdmin} />
        
        <section className="py-20 md:py-24 border-b border-black/10">
          <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
            <h1 className="font-serif font-bold text-4xl md:text-5xl text-warm-black leading-tight mb-12">
              Contact for In-Person Meetings
            </h1>
            
            <div className="space-y-6 mb-16 font-sans text-base md:text-lg text-warm-black/70 leading-relaxed">
              <p>Faith by Experiments offers select in-person meetings for serious inquirers interested in deep discussion and collaborative experimentation.</p>
              <p>These are paid sessions for the people who wish to engage beyond written content.</p>
              <p>
                Prefer direct contact? Email us at{' '}
                <a href={`mailto:${siteContent.contact.email}`} className="text-accent-muted hover:text-accent-muted/80 font-medium underline">
                  {siteContent.contact.email}
                </a>
                {' '}or WhatsApp{' '}
                <a
                  href={`https://wa.me/${siteContent.contact.whatsappE164.replace('+', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent-muted hover:text-accent-muted/80 font-medium underline"
                >
                  {siteContent.contact.whatsappDisplay}
                </a>
                .
              </p>
            </div>
            
            {submitted ? (
              <div className="bg-white border border-black/10 p-8 md:p-12 text-center space-y-4" data-testid="contact-success">
                <h2 className="font-serif font-semibold text-3xl md:text-4xl text-warm-black">Thank You!</h2>
                <p className="font-sans text-lg text-warm-black/70">Your inquiry has been received. We will contact you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border border-black/10 p-8 md:p-12 space-y-6" data-testid="contact-form">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded font-sans text-sm md:text-base" data-testid="contact-error">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="name" className="block font-sans font-medium text-base text-warm-black">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted"
                    data-testid="contact-name-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="block font-sans font-medium text-base text-warm-black">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted"
                    data-testid="contact-email-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="whatsapp" className="block font-sans font-medium text-base text-warm-black">WhatsApp Number (Optional)</label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted"
                    placeholder="+91 98765 43210"
                    data-testid="contact-whatsapp-input"
                  />
                  <span className="font-sans text-sm text-warm-black/50">Include country code for international numbers</span>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="block font-sans font-medium text-base text-warm-black">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    required
                    className="w-full px-4 py-3 border border-black/20 rounded font-sans text-base text-warm-black bg-white focus:outline-none focus:border-accent-muted focus:ring-1 focus:ring-accent-muted resize-y"
                    placeholder="Please share your background, areas of interest, and what you hope to explore in an in-person meeting."
                    data-testid="contact-message-input"
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-accent-muted hover:bg-accent-muted/90 text-white font-sans font-semibold text-base md:text-lg py-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  data-testid="contact-submit-btn"
                >
                  {loading ? 'Sending...' : 'Send Enquiry'}
                </button>
              </form>
            )}
          </div>
        </section>
        
        <Footer />
      </div>
    </div>
  );
};
