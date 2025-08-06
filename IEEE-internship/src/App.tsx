// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HeroSection from './Components/HeroSection';
import Header from './Components/Header';
import Upload from './pages/Upload';
import Home from './pages/Home';
import MyFiles from './pages/MyFiles';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { useUser } from '@clerk/clerk-react';

function App() {
  const { isSignedIn } = useUser();
  const location = useLocation();

  // Hide header on login and sign-up pages
  const hideHeader = location.pathname === '/login' || location.pathname === '/sign-up';

  return (
    <>
      {!hideHeader && <Header />} {/* ✅ Show header only when not on login/sign-up */}
      <Routes>
        {isSignedIn ? (
          <>
            <Route path="/" element={<HeroSection />} />
            <Route path="/home" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/my-files" element={<MyFiles />} />
            <Route path="/login" element={<Navigate to="/home" replace />} />
            <Route path="/sign-up" element={<Navigate to="/home" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<HeroSection />} />
            <Route path="/login" element={<Login />} />
            <Route path="/sign-up" element={<SignUp />} />
             <Route path="/home" element={<Home />} />
            <Route path="/upload" element={<Navigate to="/login" replace />} />
            <Route path="/my-files" element={<Navigate to="/login" replace />} />
          </>
        )}
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
