import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import React, { useState } from 'react';

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget;
    target.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))';
    target.style.color = '#ffffff';
    target.style.transform = 'translateY(-2px)';
    target.style.boxShadow = '0 5px 15px rgba(59, 130, 246, 0.3)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget;
    target.style.background = 'transparent';
    target.style.color = 'rgba(255, 255, 255, 0.9)';
    target.style.transform = 'translateY(0)';
    target.style.boxShadow = 'none';
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Upload', path: '/upload' },
    { name: 'My Files', path: '/my-files' },
    { name: 'Verify', path: '/verify' }
  ];

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(10, 10, 30, 0.9) 100%)',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)'
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          textShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
          animation: 'logoGlow 3s ease-in-out infinite alternate'
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            Web3 Labs
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav style={{ 
          display: 'flex', 
          gap: '40px',
          alignItems: 'center'
        }} className="desktop-nav">
          {navItems.map((item, index) => (
            <Link
              key={item.name}
              to={item.path}
              style={{
                color: location.pathname === item.path ? '#3b82f6' : 'rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: location.pathname === item.path ? '600' : '500',
                padding: '8px 16px',
                borderRadius: '25px',
                transition: 'all 0.3s ease',
                animation: `fadeInDown 0.6s ease forwards ${index * 0.1}s`,
                opacity: 0,
                position: 'relative',
                overflow: 'hidden',
                borderBottom: location.pathname === item.path ? '2px solid #3b82f6' : 'none'
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '15px'
        }} className="auth-buttons">
          <SignedOut>
            <Link to="/login">
              <button style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: 'white',
                borderRadius: '25px',
                padding: '12px 24px',
                fontWeight: '600',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 5px 15px rgba(59, 130, 246, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(59, 130, 246, 0.4)';
              }}
              >
                Sign In
              </button>
            </Link>
            <Link to="/sign-up">
              <button style={{
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                color: 'white',
                borderRadius: '25px',
                padding: '12px 24px',
                fontWeight: '600',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 5px 15px rgba(139, 92, 246, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.4)';
              }}
              >
                Sign Up
              </button>
            </Link>
          </SignedOut>
          
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: {
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2px solid rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.3s ease',
                    zIndex: 10
                  },
                  userButtonPopoverCard: {
                    background: 'rgba(10, 10, 30, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px'
                  }
                }
              }} 
            />
          </SignedIn>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-nav" style={{
          position: 'fixed',
          top: '80px',
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 30, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderTop: 'none',
          zIndex: 9,
          padding: '20px',
          display: 'none'
        }}>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                display: 'block',
                color: location.pathname === item.path ? '#3b82f6' : 'rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: location.pathname === item.path ? '600' : '500',
                padding: '12px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes logoGlow {
          0%, 100% {
            filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.8));
          }
        }
        
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-nav {
            display: block !important;
          }
          header {
            padding: 15px 20px !important;
          }
          .auth-buttons {
            gap: 10px !important;
          }
          .auth-buttons button {
            padding: 8px 16px !important;
            font-size: 12px !important;
          }
        }
        
        @media (max-width: 480px) {
          header div:first-child {
            font-size: 20px !important;
          }
          .auth-buttons {
            flex-direction: column !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </>
  );
}

export default Header;