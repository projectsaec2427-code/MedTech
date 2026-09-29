import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProfilePreferences from './components/ProfilePreferences';
import { User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePreferencesOpen, setProfilePreferencesOpen] = useState(false);

  // Authenticate from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('medtech_session');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('medtech_session');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (token: string, user: User) => {
    setCurrentUser(user);
    localStorage.setItem('medtech_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('medtech_session');
  };

  const handleUserUpdated = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('medtech_session', JSON.stringify(user));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500">Initializing MedTech Clinical Workspace...</p>
        </div>
      </div>
    );
  }

  // Router dispatcher
  if (!currentUser) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  switch (currentUser.role) {
    case 'patient':
      return <><PatientDashboard user={currentUser} onLogout={handleLogout} onEditProfile={() => setProfilePreferencesOpen(true)} /><ProfilePreferences user={currentUser} onUserUpdated={handleUserUpdated} isOpen={profilePreferencesOpen} onOpen={() => setProfilePreferencesOpen(true)} onClose={() => setProfilePreferencesOpen(false)} showTrigger={false} /></>;
    case 'doctor':
      return <><DoctorDashboard user={currentUser} onLogout={handleLogout} /><ProfilePreferences user={currentUser} onUserUpdated={handleUserUpdated} isOpen={profilePreferencesOpen} onOpen={() => setProfilePreferencesOpen(true)} onClose={() => setProfilePreferencesOpen(false)} /></>;
    case 'admin':
      return <><AdminDashboard user={currentUser} onLogout={handleLogout} /><ProfilePreferences user={currentUser} onUserUpdated={handleUserUpdated} isOpen={profilePreferencesOpen} onOpen={() => setProfilePreferencesOpen(true)} onClose={() => setProfilePreferencesOpen(false)} /></>;
    default:
      return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }
}
