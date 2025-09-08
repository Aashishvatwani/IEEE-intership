// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HeroSection from './Components/Herosection'; 
import Header from './Components/Header';
import Upload from './pages/Upload';
import Home from './pages/Home';
import MyFiles from './pages/MyFiles';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { useUser } from '@clerk/clerk-react';
import Verify from './pages/Verify';

 function App() {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();

  // Hide header on login and sign-up pages
  const hideHeader = location.pathname === '/login' || location.pathname === '/sign-up';

  // Show loading while user data is being loaded
  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>Loading...</div>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '3px solid rgba(59, 130, 246, 0.3)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {!hideHeader && <Header />}
      <Routes>
        {isSignedIn ? (
          <>
            {/* Authenticated Routes */}
            <Route path="/" element={<HeroSection />} />
            <Route path="/home" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/my-files" element={<MyFiles />} />
            <Route path="/verify" element={<Verify />} />
            {/* Redirect auth pages to home if already signed in */}
            <Route path="/login" element={<Navigate to="/home" replace />} />
            <Route path="/sign-up" element={<Navigate to="/home" replace />} />
          </>
        ) : (
          <>
            {/* Public Routes */}
            <Route path="/" element={<HeroSection />} />
            <Route path="/home" element={<HeroSection />} />
            <Route path="/login" element={<Login />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/verify" element={<Verify />} />
            {/* Redirect protected routes to login */}
            <Route path="/upload" element={<Navigate to="/login" replace />} />
            <Route path="/my-files" element={<Navigate to="/login" replace />} />
          </>
        )}
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
