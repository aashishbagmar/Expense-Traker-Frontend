import React, { useState } from 'react';
import '../styles/Header.css';

interface HeaderProps {
  onLogout?: () => void;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, userName = 'User' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (page: string) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page } }));
    setMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <h1 className="logo">💰 ExpenseTracker</h1>
          <p className="tagline">Smart Finance Management</p>
        </div>

        {/* Hamburger Menu Button (mobile only) */}
        <button 
          className="hamburger-btn" 
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Desktop Navigation */}
        <nav className="nav-menu">
           <a href="#dashboard" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('dashboard'); }}>Dashboard</a>
           <a href="#transactions" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('transactions'); }}>Transactions</a>
           <a href="#groups" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('groups'); }}>Group Expenses</a>
           <a href="#analytics" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('reports'); }}>Analytics</a>
        </nav>

        <div className="user-section">
          <button className="settings-btn" onClick={() => handleNavigation('settings')}>⚙️ Settings</button>
          <button className="user-name" onClick={() => handleNavigation('profile')}>👤 {userName}</button>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <nav className="mobile-nav-menu">
            <a href="#dashboard" className="mobile-nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('dashboard'); }}>Dashboard</a>
            <a href="#transactions" className="mobile-nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('transactions'); }}>Transactions</a>
            <a href="#groups" className="mobile-nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('groups'); }}>Group Expenses</a>
            <a href="#analytics" className="mobile-nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('reports'); }}>Analytics</a>
            <a href="#settings" className="mobile-nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('settings'); }}>Settings</a>
            <a href="#profile" className="mobile-nav-link" onClick={(e) => { e.preventDefault(); handleNavigation('profile'); }}>Profile</a>
            <button className="mobile-nav-link logout" onClick={() => { onLogout?.(); setMobileMenuOpen(false); }}>Logout</button>
          </nav>
        </div>
      )}
    </header>
  );
};
