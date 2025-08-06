// src/components/HeroSection.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
// IMPORTANT: Place your video file in your project's `public` folder.
const VIDEO_PATH = '/video.mp4';

const HeroSection: React.FC = () => {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();
  return (
    <div style={{
      backgroundColor: '	#000000',
      color: 'white',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Minimal background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
        animation: 'pulse 6s ease-in-out infinite alternate'
      }} />

      {/* Header */}


      {/* Main content container */}
      <div style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 40px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '80px',
        alignItems: 'center',
        zIndex: 5
      }}>
        
        {/* Left side - Text content */}
        <div style={{
          animation: 'slideInLeft 1s ease forwards',
          opacity: 0
        }}>
          <div style={{
            fontSize: '14px',
            letterSpacing: '2px',
            color: '#3b82f6',
            marginBottom: '20px',
            fontWeight: '500',
            animation: 'fadeInUp 0.8s ease forwards 0.2s',
            opacity: 0
          }}>
            NEXT GENERATION TECHNOLOGY
          </div>
          
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: '900',
            lineHeight: '1.1',
            marginBottom: '30px',
            animation: 'fadeInUp 0.8s ease forwards 0.4s',
            opacity: 0
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 3s ease infinite'
            }}>
              Web3
            </span>
            <br />
            <span style={{ color: 'white' }}>Revolution</span>
          </h1>
          
          <p style={{
            fontSize: '20px',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '40px',
            maxWidth: '500px',
            animation: 'fadeInUp 0.8s ease forwards 0.6s',
            opacity: 0
          }}>
            Experience the future of the internet with decentralized applications, 
            blockchain technology, and limitless possibilities.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '20px',
            animation: 'fadeInUp 0.8s ease forwards 0.8s',
            opacity: 0
          }}>
            <button style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
            }}
            onClick={() => (isSignedIn ? navigate('/home') : navigate('/login'))}
            >
            
              Get Started
            </button>
            <button style={{
              background: 'transparent',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              padding: '14px 30px',
              borderRadius: '50px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}>
              Learn More
            </button>
          </div>
        </div>

        {/* Right side - Video */}
        <div style={{
          position: 'relative',
          animation: 'slideInRight 1s ease forwards 0.4s',
          opacity: 0,
          width: '116%',
          maxWidth: '800px'
        }}>
          {/* Blue light at bottom border */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '10%',
            right: '10%',
            height: '40px',
            background: 'linear-gradient(to top, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0.4) 50%, transparent 100%)',
            filter: 'blur(15px)',
            animation: 'blueGlow 3s ease-in-out infinite alternate',
            zIndex: 1
          }} />
          
          {/* Blue ambient glow at bottom */}
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: '0%',
            right: '0%',
            height: '60px',
            background: 'radial-gradient(ellipse at center bottom, rgba(59, 130, 246, 0.6) 0%, rgba(139, 92, 246, 0.3) 40%, transparent 70%)',
            filter: 'blur(25px)',
            animation: 'pulseBlue 4s ease-in-out infinite',
            zIndex: 0
          }} />
          
          <video
            style={{ 
              width: '100%', 
              height: 'auto',
              display: 'block',
              objectFit: 'cover',
              filter: 'brightness(0.6) contrast(1.2) saturate(1.1)',
              minHeight: '500px',
              position: 'relative',
              zIndex: 2
            }}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={(e) => {
              const video = e.target as HTMLVideoElement;
              if (video.dataset.playCount === '1') {
                video.pause();
              } else {
                video.dataset.playCount = '1';
                video.play();
              }
            }}
            onError={(e) => {
              console.error('Video element error:', e);
              console.error('Video source:', VIDEO_PATH);
            }}
          >
            <source src={VIDEO_PATH} type="video/mp4" />
            <p>Your browser does not support the video tag.</p>
          </video>
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            background: '#3b82f6',
            borderRadius: '50%',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`,
            opacity: 0.6
          }}
        />
      ))}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
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
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes blueGlow {
          0%, 100% {
            opacity: 0.6;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.2);
          }
        }
        
        @keyframes pulseBlue {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
        
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.4);
        }
        
        nav a:hover {
          color: white;
          transform: translateY(-2px);
        }
        
        @media (max-width: 768px) {
          header {
            padding: 15px 20px;
          }
          nav {
            display: none;
          }
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr;
            gap: 40px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroSection;