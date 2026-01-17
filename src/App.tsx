import { useState, useEffect } from 'react'
import './App.css'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { Transactions } from './components/Transactions'
import { GroupExpenses } from './components/GroupExpenses'
import { Login } from './components/Auth'
import { Reports } from './components/Reports'
import { Settings } from './components/Settings'
import { Profile } from './components/Profile'
import { userAPI } from './services/api'

type Page = 'dashboard' | 'transactions' | 'groups' | 'reports' | 'settings' | 'profile'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [userName, setUserName] = useState('User')
  const [, setAuthToken] = useState<string | null>(null)
  const [voiceInputMode, setVoiceInputMode] = useState(false)

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');
    const storedDisplayName = localStorage.getItem('userDisplayName');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Initialize theme on app load
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (token && email) {
      setAuthToken(token);
      setIsAuthenticated(true);
      setUserName(storedDisplayName || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1));
    }
  }, []);

  // Fetch profile to get full name for navbar display
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadDisplayName = async () => {
      try {
        const data = await userAPI.getProfile();
        const fullName = data?.profile?.full_name || '';
        const fallbackEmail = localStorage.getItem('userEmail') || '';
        const fallback = fallbackEmail
          ? fallbackEmail.split('@')[0].charAt(0).toUpperCase() + fallbackEmail.split('@')[0].slice(1)
          : 'User';

        const nameToUse = fullName.trim() || data?.user?.username || fallback;
        setUserName(nameToUse);
        localStorage.setItem('userDisplayName', nameToUse);
      } catch (error) {
        console.error('Failed to load display name', error);
      }
    };

    loadDisplayName();
  }, [isAuthenticated]);

  const handleLogin = (email: string, _password: string, token: string, _userData: any) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    setUserName(email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1));
    localStorage.setItem('userEmail', email);
    localStorage.removeItem('userDisplayName'); // will refresh after profile fetch
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
    setAuthToken(null);
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userDisplayName');
  }

  // Listen for navigation events from components
  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const customEvent = event as CustomEvent
      const page = customEvent.detail?.page
      const voiceInput = customEvent.detail?.voiceInput || false
      
      console.log('🔔 Navigation event received:', { page, voiceInput });
      
      // Map page names to Page type
      const pageMap: Record<string, Page> = {
        'dashboard': 'dashboard',
        'transactions': 'transactions',
        'group-expenses': 'groups',
        'groups': 'groups',
        'reports': 'reports',
        'profile': 'profile',
        'settings': 'settings'
      }
      
      if (page && pageMap[page]) {
        setCurrentPage(pageMap[page])
        // Only enable voice input mode when explicitly requested
        if (voiceInput && pageMap[page] === 'transactions') {
          console.log('✅ Enabling voiceInputMode for transactions navigation');
          setVoiceInputMode(true)
        } else {
          // Ensure normal navigation does not auto-open the modal
          setVoiceInputMode(false)
        }
      }
    }
    
    window.addEventListener('navigate', handleNavigate)
    return () => window.removeEventListener('navigate', handleNavigate)
  }, [])

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <Header onLogout={handleLogout} userName={userName} />
      
      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard />
        )}
        {currentPage === 'transactions' && (
          <Transactions voiceInputMode={voiceInputMode} />
        )}
        {currentPage === 'groups' && (
          <GroupExpenses />
        )}
        {currentPage === 'reports' && (
          <Reports />
        )}
        {currentPage === 'profile' && (
          <Profile />
        )}
        {currentPage === 'settings' && (
          <Settings />
        )}
      </main>

    </div>
  )
}

export default App
