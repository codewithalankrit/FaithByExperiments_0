import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import '../styles/Header.css';

export const Header = ({ isLoggedIn, isAdmin, onLogout }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownContainerRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleScroll = (id) => {
    navigate('/');
    setIsMobileMenuOpen(false); // Close mobile menu after clicking
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const handleNavLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleDropdownToggle = () => {
    if (dropdownContainerRef.current) {
      const rect = dropdownContainerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 2,
        left: rect.left
      });
    }
    setIsAdminDropdownOpen(!isAdminDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAdminDropdownOpen(false);
      }
    };

    if (isAdminDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAdminDropdownOpen]);

  useEffect(() => {
    const updatePosition = () => {
      if (isAdminDropdownOpen && dropdownContainerRef.current) {
        const rect = dropdownContainerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 2,
          left: rect.left
        });
      }
    };

    if (isAdminDropdownOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isAdminDropdownOpen]);

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="logo-link">
          <img 
            src="/Logo.png" 
            alt="Faith by Experiments" 
            className="site-logo-image"
          />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="main-nav desktop-nav">
          <button onClick={() => handleScroll('about-founder')} className="nav-link">About the Founder</button>
          <button onClick={() => handleScroll('manifesto')} className="nav-link">Manifesto</button>
          <Link to="/flagship-contents" className="nav-link">Flagship Contents</Link>
          {!isLoggedIn ? (
            <>
              <Link to="/subscribe" className="nav-link subscribe-link">Subscribe</Link>
              <Link to="/subscribe?mode=login" className="nav-link">Sign In</Link>
            </>
          ) : (
            <div 
              ref={dropdownContainerRef}
              className="admin-dropdown-container"
            >
              <button 
                className="admin-icon-link" 
                title="User Menu"
                aria-label="User Menu"
                aria-expanded={isAdminDropdownOpen}
                onClick={handleDropdownToggle}
              >
                <User size={20} />
              </button>
            </div>
          )}
        </nav>
        
        {/* Hamburger Menu Button */}
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <p className="header-tagline desktop-only">Faith, tested in real life.</p>
      </div>
      
      {/* Dropdown Menu Portal */}
      {isAdminDropdownOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="admin-dropdown-menu admin-dropdown-menu-portal"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          {isAdmin && (
            <Link 
              to="/admin/dashboard" 
              className="admin-dropdown-item"
              onClick={() => setIsAdminDropdownOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          <button 
            className="admin-dropdown-item"
            onClick={() => {
              setIsAdminDropdownOpen(false);
              handleLogout();
            }}
          >
            Logout
          </button>
        </div>,
        document.body
      )}
      
      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <nav className="mobile-nav" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => handleScroll('about-founder')} className="mobile-nav-link">
              About the Founder
            </button>
            <button onClick={() => handleScroll('manifesto')} className="mobile-nav-link">
              Manifesto
            </button>
            <Link to="/flagship-contents" className="mobile-nav-link" onClick={handleNavLinkClick}>
              Flagship Contents
            </Link>
            {!isLoggedIn ? (
              <>
                <Link to="/subscribe" className="mobile-nav-link mobile-subscribe-link" onClick={handleNavLinkClick}>
                  Subscribe
                </Link>
                <Link to="/subscribe?mode=login" className="mobile-nav-link" onClick={handleNavLinkClick}>
                  Sign In
                </Link>
              </>
            ) : (
              <>
                {isAdmin && (
                  <Link 
                    to="/admin/dashboard" 
                    className="mobile-nav-link mobile-admin-link" 
                    onClick={handleNavLinkClick}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="mobile-nav-link">
                  Logout
                </button>
              </>
            )}
            <p className="mobile-tagline">Faith, tested in real life.</p>
          </nav>
        </div>
      )}
    </header>
  );
};