import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Footer.css';

export const Footer = () => {
  const navigate = useNavigate();
  
  const handleScroll = (id) => {
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-statement">
          <p>This is a reader-supported platform dedicated to intellectual integrity and experimental faith.</p>
        </div>
        
        <nav className="footer-nav">
          <button onClick={() => handleScroll('manifesto')} className="footer-link">Manifesto</button>
          <span className="footer-separator">|</span>
          <Link to="/subscribe" className="footer-link">Subscribe</Link>
          <span className="footer-separator">|</span>
          <Link to="/contact" className="footer-link">Contact for in-person meetings</Link>
        </nav>
        
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} Faith by Experiments. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};