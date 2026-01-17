import { useState, useEffect } from 'react'
import '../styles/Settings.css'
import { userAPI } from '../services/api'

export const Settings = () => {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    currency: 'INR',
    theme: 'light',
    notifications: true,
    emailAlerts: true,
    pushAlerts: true,
    autoBackup: true,
    budgetNotification: true,
    weeklyReports: true,
    monthlyAnalysis: true,
    darkMode: false
  })

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Load from localStorage first
        const savedCurrency = localStorage.getItem('currency') || 'INR'
        const savedTheme = localStorage.getItem('theme') || 'light'
        
        // Apply theme immediately
        document.documentElement.setAttribute('data-theme', savedTheme)
        
        // Try to load from backend too
        const preferences = await userAPI.getPreferences()
        if (preferences) {
          setSettings({
            currency: preferences.currency || savedCurrency,
            theme: preferences.theme || savedTheme,
            notifications: preferences.notifications !== false,
            emailAlerts: preferences.email_alerts !== false,
            pushAlerts: preferences.push_alerts !== false,
            autoBackup: preferences.auto_backup !== false,
            budgetNotification: preferences.budget_notification !== false,
            weeklyReports: preferences.weekly_reports !== false,
            monthlyAnalysis: preferences.monthly_analysis !== false,
            darkMode: preferences.theme === 'dark'
          })
        } else {
          // Use localStorage values if backend fails
          setSettings(prev => ({
            ...prev,
            currency: savedCurrency,
            theme: savedTheme,
            darkMode: savedTheme === 'dark'
          }))
        }
      } catch (error) {
        console.error('Error loading preferences:', error)
        // Use localStorage as fallback
        const savedCurrency = localStorage.getItem('currency') || 'INR'
        const savedTheme = localStorage.getItem('theme') || 'light'
        
        setSettings(prev => ({
          ...prev,
          currency: savedCurrency,
          theme: savedTheme,
          darkMode: savedTheme === 'dark'
        }))
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [])

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    
    // Apply theme immediately if dark mode is toggled
    if (key === 'darkMode') {
      if (!newSettings.darkMode) {
        document.body.classList.remove('dark-mode')
      } else {
        document.body.classList.add('dark-mode')
      }
      localStorage.setItem('darkMode', newSettings.darkMode.toString())
      // Also update theme field
      newSettings.theme = newSettings.darkMode ? 'dark' : 'light'
    }
    
    savePreferences(newSettings)
  }

  const handleSelect = (key: keyof typeof settings, value: string | boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    // Handle currency selection
    if (key === 'currency') {
      localStorage.setItem('currency', value.toString())
      // Refresh page to apply currency changes throughout the app
      window.location.reload()
    }
    
    // Handle theme selection
    if (key === 'theme') {
      const themeValue = value.toString()
      localStorage.setItem('theme', themeValue)
      document.documentElement.setAttribute('data-theme', themeValue)
      newSettings.darkMode = themeValue === 'dark'
    }
    
    savePreferences(newSettings)
  }

  const savePreferences = async (prefsToSave: typeof settings) => {
    try {
      await userAPI.updatePreferences({
        currency: prefsToSave.currency,
        theme: prefsToSave.theme,
        notifications: prefsToSave.notifications,
        email_alerts: prefsToSave.emailAlerts,
        push_alerts: prefsToSave.pushAlerts,
        auto_backup: prefsToSave.autoBackup,
        budget_notification: prefsToSave.budgetNotification,
        weekly_reports: prefsToSave.weeklyReports,
        monthly_analysis: prefsToSave.monthlyAnalysis,
        dark_mode: prefsToSave.darkMode
      })
      console.log('Preferences saved successfully')
    } catch (error) {
      console.error('Error saving preferences:', error)
      // Settings are still saved to localStorage, so it won't break the app
    }
  }

  if (loading) {
    return <div className="settings-container"><p>Loading settings...</p></div>
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your preferences and application settings</p>
      </div>

      {/* General Settings */}
      <div className="settings-section">
        <h2>General</h2>
        <div className="settings-items">
          <div className="settings-item">
            <div className="item-info">
              <h3>Currency</h3>
              <p>Choose your preferred currency for displaying amounts</p>
            </div>
            <select value={settings.currency} onChange={(e) => handleSelect('currency', e.target.value)} className="settings-select">
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>

          <div className="settings-item">
            <div className="item-info">
              <h3>Theme</h3>
              <p>Choose between light and dark mode</p>
            </div>
            <div className="theme-selector">
              <button 
                className={`theme-button ${settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => handleSelect('theme', 'light')}
              >
                ☀️ Light
              </button>
              <button 
                className={`theme-button ${settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleSelect('theme', 'dark')}
              >
                🌙 Dark
              </button>
              <button 
                className={`theme-button ${settings.theme === 'auto' ? 'active' : ''}`}
                onClick={() => handleSelect('theme', 'auto')}
              >
                🔄 Auto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="settings-section">
        <h2>Notifications</h2>
        <div className="settings-items">
          <div className="settings-toggle">
            <div className="item-info">
              <h3>Enable Notifications</h3>
              <p>Receive alerts and updates from ExpenseTracker</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.notifications}
                onChange={() => handleToggle('notifications')}
              />
              <span className="slider"></span>
            </label>
          </div>

          {settings.notifications && (
            <>
              <div className="settings-toggle">
                <div className="item-info">
                  <h3>Email Alerts</h3>
                  <p>Get alerts via email for important events</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.emailAlerts}
                    onChange={() => handleToggle('emailAlerts')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="settings-toggle">
                <div className="item-info">
                  <h3>Push Notifications</h3>
                  <p>Receive push notifications on your device</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.pushAlerts}
                    onChange={() => handleToggle('pushAlerts')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="settings-toggle">
                <div className="item-info">
                  <h3>Budget Notifications</h3>
                  <p>Alert when spending approaches budget limits</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.budgetNotification}
                    onChange={() => handleToggle('budgetNotification')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="settings-toggle">
                <div className="item-info">
                  <h3>Weekly Reports</h3>
                  <p>Receive weekly spending summaries</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.weeklyReports}
                    onChange={() => handleToggle('weeklyReports')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="settings-toggle">
                <div className="item-info">
                  <h3>Monthly Analysis</h3>
                  <p>Get detailed monthly financial analysis</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.monthlyAnalysis}
                    onChange={() => handleToggle('monthlyAnalysis')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="settings-section">
        <h2>Privacy & Security</h2>
        <div className="settings-items">
          <div className="settings-toggle">
            <div className="item-info">
              <h3>Auto Backup</h3>
              <p>Automatically backup your data daily</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.autoBackup}
                onChange={() => handleToggle('autoBackup')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-item">
            <div className="item-info">
              <h3>Last Backup</h3>
              <p>Today at 2:30 PM</p>
            </div>
            <button className="settings-button">Backup Now</button>
          </div>

          <div className="settings-item">
            <div className="item-info">
              <h3>Data Export</h3>
              <p>Download all your data in CSV format</p>
            </div>
            <button className="settings-button">Export Data</button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="settings-section about">
        <h2>About</h2>
        <div className="about-info">
          <div className="about-item">
            <span>App Version</span>
            <span>1.0.0</span>
          </div>
          <div className="about-item">
            <span>Build Number</span>
            <span>2024.01.001</span>
          </div>
          <div className="about-item">
            <span>Last Updated</span>
            <span>January 1, 2024</span>
          </div>
          <div className="about-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#feedback">Send Feedback</a>
            <a href="#help">Help & Support</a>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="settings-actions">
        <button className="save-button">Save All Changes</button>
        <button className="reset-button">Reset to Defaults</button>
      </div>
    </div>
  )
}
