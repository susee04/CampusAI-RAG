import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ChatInterface } from './components/ChatInterface';
import { UserSession } from './lib/supabase';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'admin' | 'chat'>('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<'student' | 'admin'>('student');
  const [session, setSession] = useState<UserSession | null>(null);

  const handleOpenAuth = (role: 'student' | 'admin') => {
    setAuthInitialRole(role);
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    if (newSession.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('chat');
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {currentView === 'landing' && (
        <LandingPage
          onGetStarted={() => {
            if (session) {
              setCurrentView('chat');
            } else {
              handleOpenAuth('student');
            }
          }}
          onAdminUpload={() => {
            if (session?.role === 'admin') {
              setCurrentView('admin');
            } else {
              handleOpenAuth('admin');
            }
          }}
        />
      )}

      {currentView === 'admin' && session?.role === 'admin' && (
        <AdminDashboard
          session={session}
          onBackToLanding={() => setCurrentView('landing')}
          onOpenChat={() => setCurrentView('chat')}
        />
      )}

      {currentView === 'chat' && (
        <ChatInterface
          session={session}
          onBackToLanding={() => setCurrentView('landing')}
          onOpenAdmin={() => setCurrentView('admin')}
          onLogout={handleLogout}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        initialRole={authInitialRole}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
