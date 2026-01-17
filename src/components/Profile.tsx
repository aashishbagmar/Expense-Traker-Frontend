import { useState, useEffect } from 'react'
import '../styles/Profile.css'
import { userAPI } from '../services/api'

export const Profile = () => {
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    bio: ''
  })
  const [stats, setStats] = useState([
    { label: 'Total Transactions', value: '0' },
    { label: 'Total Income', value: '₹0' },
    { label: 'Total Expenses', value: '₹0' },
    { label: 'Net Balance', value: '₹0' }
  ])

  // Load user profile data on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Single API call gets everything
        const data = await userAPI.getProfile()
        if (data) {
          // Set profile data
          setProfile({
            fullName: data.profile.full_name || '',
            email: data.user.email || '',
            phone: data.profile.phone_number || '',
            address: data.profile.address || '',
            city: data.profile.city || '',
            state: data.profile.state || '',
            zipCode: data.profile.zip_code || '',
            country: data.profile.country || '',
            bio: data.profile.bio || ''
          })

          // Set stats from calculated data
          setStats([
            { label: 'Total Transactions', value: data.stats.total_transactions.toString() },
            { label: 'Total Income', value: `₹${data.stats.total_income.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: 'Total Expenses', value: `₹${data.stats.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: 'Net Balance', value: `₹${data.stats.net_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
          ])
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [])

  const handleChange = (field: keyof typeof profile, value: string) => {
    setProfile({ ...profile, [field]: value })
  }

  const handleSaveProfile = async () => {
    try {
      const updateData = {
        full_name: profile.fullName,
        phone_number: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip_code: profile.zipCode,
        country: profile.country,
        bio: profile.bio
      }
      await userAPI.updateProfile(updateData)
      setEditMode(false)
      alert('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
  }

  if (loading) {
    return <div className="profile-container"><p>Loading profile...</p></div>
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-initial">
            {profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
        </div>
        <div className="profile-info">
          <h1>{profile.fullName || 'User'}</h1>
          <p className="profile-email">{profile.fullName || 'User'}</p>
          <button 
            className={`edit-button ${editMode ? 'cancel' : ''}`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="profile-stats">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Personal Information */}
      <div className="profile-section">
        <h2>Personal Information</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              value={profile.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="tel" 
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="form-group">
            <label>Country</label>
            <input 
              type="text" 
              value={profile.country}
              onChange={(e) => handleChange('country', e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input 
              type="text" 
              value={profile.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input 
              type="text" 
              value={profile.city}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="form-group">
            <label>State/Province</label>
            <input 
              type="text" 
              value={profile.state}
              onChange={(e) => handleChange('state', e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="form-group">
            <label>Zip Code</label>
            <input 
              type="text" 
              value={profile.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="form-group full-width">
            <label>Bio</label>
            <textarea 
              value={profile.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              disabled={!editMode}
              rows={3}
            />
          </div>
        </div>
        {editMode && (
          <div className="form-actions">
            <button className="save-button" onClick={handleSaveProfile}>Save Changes</button>
            <button className="cancel-button" onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="profile-section">
        <h2>Account Settings</h2>
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <h3>Privacy</h3>
              <p>Control who can see your profile</p>
            </div>
            <button className="setting-button">Manage</button>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Two-Factor Authentication</h3>
              <p>Add an extra layer of security</p>
            </div>
            <button className="setting-button">Enable</button>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Password</h3>
              <p>Last changed 3 months ago</p>
            </div>
            <button className="setting-button">Change</button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="profile-section danger">
        <h2>Danger Zone</h2>
        <div className="danger-actions">
          <button className="danger-button">Delete Account</button>
          <button className="warning-button">Download My Data</button>
        </div>
      </div>
    </div>
  )
}
