import React, { useState } from 'react';
import { API_BASE_URL } from '../services/api';
import '../styles/Auth.css';

interface LoginProps {
  onLogin?: (email: string, password: string, token: string, userData: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'register') {
        if (!formData.email || !formData.password || !formData.name) {
          throw new Error('Name, email, and password are required');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const response = await fetch(`${API_BASE_URL}/api/users/register/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.name,
            email: formData.email,
            password: formData.password,
            phone_no: formData.phone,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          let errorMsg = 'Registration failed';
          try {
            const errorData = JSON.parse(text);
            errorMsg = errorData.detail || errorData.email?.[0] || errorMsg;
          } catch {
            if (text.trim().startsWith('<')) {
              errorMsg = 'Server error (HTML response). Please try again later or contact support.';
            } else {
              errorMsg = text;
            }
          }
          throw new Error(errorMsg);
        }

        setSuccess('Account created! Please log in.');
        setMode('login');
        setIsLoading(false);
        return;
      }

      // Login flow
      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = 'Invalid credentials';
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.detail || errorMsg;
        } catch {
          if (text.trim().startsWith('<')) {
            errorMsg = 'Server error (HTML response). Please try again later or contact support.';
          } else {
            errorMsg = text;
          }
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Store tokens in localStorage
      localStorage.setItem('authToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('userEmail', formData.email);

      // Call parent's onLogin handler
      onLogin?.(formData.email, formData.password, data.access, data);

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">💰 ExpenseTracker</h1>
          <p className="login-subtitle">Smart Finance Management</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone (optional)</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  placeholder="+1 555..."
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (mode === 'register' ? 'Registering...' : 'Logging in...') : mode === 'register' ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          {mode === 'login' ? (
            <p className="signup-link">
              Don't have an account? <button type="button" className="link-btn" onClick={() => setMode('register')}>Register</button>
            </p>
          ) : (
            <p className="signup-link">
              Already have an account? <button type="button" className="link-btn" onClick={() => setMode('login')}>Log in</button>
            </p>
          )}
        </div>

        {/* Demo Credentials */}
        <div className="demo-info">
          <p><strong>Test Account:</strong></p>
          <small>Create an account in Django admin or use existing credentials</small>
          <small>Run: python manage.py createsuperuser</small>
        </div>
      </div>

      <div className="login-features">
        <div className="feature">
          <span className="feature-icon">🧾</span>
          <h3>Receipt Scanning</h3>
          <p>Extract transaction data using OCR</p>
        </div>
        <div className="feature">
          <span className="feature-icon">📊</span>
          <h3>Smart Analytics</h3>
          <p>Visualize spending and trends</p>
        </div>
        <div className="feature">
          <span className="feature-icon">👥</span>
          <h3>Group Expenses</h3>
          <p>Manage shared finances easily</p>
        </div>
        <div className="feature">
          <span className="feature-icon">🎯</span>
          <h3>Budget Goals</h3>
          <p>Set and track financial goals</p>
        </div>
      </div>
    </div>
  );
};
