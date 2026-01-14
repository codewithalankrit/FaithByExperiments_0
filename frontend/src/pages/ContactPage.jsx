import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ContactSEO } from '../components/SEO';
import { getUser } from '../services/api';
import '../styles/ContactPage.css';

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
    <div className="contact-page" data-testid="contact-page">
      <ContactSEO />
      <Header isAdmin={isAdmin} />
      
      <section className="contact-section">
        <div className="contact-container">
          <h1 className="contact-title">Contact for In-Person Meetings</h1>
          
          <div className="contact-intro">
            <p>Faith by Experiments offers select in-person meetings for serious inquirers interested in deep discussion and collaborative experimentation.</p>
            <p>These are paid sessions for the people who wish to engage beyond written content.</p>
          </div>
          
          {submitted ? (
            <div className="success-message" data-testid="contact-success">
              <h2>Thank You!</h2>
              <p>Your inquiry has been received. We will contact you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form" data-testid="contact-form">
              {error && (
                <div className="error-message" data-testid="contact-error">
                  {error}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  data-testid="contact-name-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  data-testid="contact-email-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="whatsapp">WhatsApp Number (Optional)</label>
                <input
                  type="tel"
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+91 98765 43210"
                  data-testid="contact-whatsapp-input"
                />
                <span className="field-hint">Include country code for international numbers</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  required
                  className="form-textarea"
                  placeholder="Please share your background, areas of interest, and what you hope to explore in an in-person meeting."
                  data-testid="contact-message-input"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="submit-button"
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
  );
};
