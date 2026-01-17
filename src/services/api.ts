// API service for connecting to Django backend
// Vite requires env variables to start with VITE_
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';

// // Validate that API_BASE_URL is defined in production
// if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
//   console.error('❌ VITE_API_BASE_URL is not defined in production!');
// }

// console.log('🌐 API Base URL:', API_BASE_URL);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://localhost:9000' : undefined);

if (!API_BASE_URL) {
  throw new Error('❌ API_BASE_URL not configured');
}

export default API_BASE_URL;

// Export for use in other components
export { API_BASE_URL };

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Transaction API
export const transactionAPI = {
  // Get all transactions
  getAll: async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Fetching transactions with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(`${API_BASE_URL}/api/transactions/`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        return [];
      }
      
      const data = await response.json();
      console.log('Transactions data received:', data);
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(data)) {
        return data;
      } else if (data.results && Array.isArray(data.results)) {
        return data.results;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
      
      console.warn('Unexpected data format:', data);
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },

  // Create new transaction
  create: async (data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        throw new Error(error.detail || 'Failed to create transaction');
      }
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(text);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      // Return mock transaction on error
      return {
        id: Date.now().toString(),
        ...data,
        amount: parseFloat(data.amount)
      };
    }
  },

  // Update transaction
  update: async (id: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/${id}/`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update transaction');
      return await response.json();
    } catch (error) {
      console.error('Error updating transaction:', error);
      return { id, ...data };
    }
  },

  // Delete transaction
  delete: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to delete transaction');
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return true; // Assume success on client side
    }
  },

  // Get monthly totals (all transactions for a month, not paginated)
  getMonthlyTotals: async (month: number, year: number) => {
    try {
      // const token = localStorage.getItem('authToken');
      console.log('Fetching monthly totals for', month, year);
      
      const response = await fetch(
        `${API_BASE_URL}/api/transactions/monthly-totals/?month=${month}&year=${year}`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      );

      console.log('Monthly totals response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Monthly totals API error:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('Monthly totals response:', data);

      if (data.success && data.totals) {
        return data.totals;
      }

      console.error('Unexpected response format:', data);
      return null;
    } catch (error) {
      console.error('Error fetching monthly totals:', error);
      return null;
    }
  },

  // Get all-time totals (all transactions for the user, no date filtering)
  getAllTimeTotals: async () => {
    try {
      console.log('Fetching all-time totals');
      
      const response = await fetch(
        `${API_BASE_URL}/api/transactions/all-time-totals/`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      );

      console.log('All-time totals response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('All-time totals API error:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('All-time totals response:', data);

      if (data.success && data.totals) {
        return data.totals;
      }

      console.error('Unexpected response format:', data);
      return null;
    } catch (error) {
      console.error('Error fetching all-time totals:', error);
      return null;
    }
  }
};

// Group Expenses API
export const groupAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/group/groups/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch groups');
      return await response.json();
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  },

  create: async (data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/group/groups/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create group');
      return await response.json();
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  update: async (id: string | number, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/group/groups/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update group');
      return await response.json();
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  },

  delete: async (id: string | number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/group/groups/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete group');
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  },

  // Add expense to a group
  addExpense: async (data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/group/group-expenses/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error('Failed to add expense');
      }
      return await response.json();
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  },

  updateExpense: async (id: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/group/group-expenses/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error('Failed to update expense');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  deleteExpense: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/group/group-expenses/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        throw new Error('Failed to delete expense');
      }
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
};

// User API
export const userAPI = {
  register: async (userData: any) => {
    const response = await fetch(
      `${API_BASE_URL}/api/users/register/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    return response.json();
  },


  login: async (email: string, password: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/token/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    return response.json();
  },

  getProfile: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/user-profile-complete/`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      if (response.status === 401) {
        console.error('Unauthorized - token may be invalid or expired');
        localStorage.removeItem('authToken');
        window.location.href = '/';
        return null;
      }
      if (!response.ok) throw new Error('Failed to fetch profile');
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(text);
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  updateProfile: async (data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/user-profile-complete/`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update profile');
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(text);
      }

    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  getPreferences: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/preferences/`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      if (response.status === 401) {
        console.error('Unauthorized - token may be invalid or expired');
        return null;
      }
      if (!response.ok) {
        console.warn('Failed to fetch preferences from backend, using localStorage');
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return null;
    }
  },

  updatePreferences: async (data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/preferences/`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update preferences');
      return await response.json();
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Preferences are still saved to localStorage as fallback
      throw error;
    }
  }
};

// Analytics API
export const analyticsAPI = {
  getSummary: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/summary/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  },

  getInsights: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/insights/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch insights');
      return await response.json();
    } catch (error) {
      console.error('Error fetching insights:', error);
      return null;
    }
  }
};
// AI Categorization API
export const aiAPI = {
  predictCategory: async (description: string) => {
    try {
      // Directly call ML service for prediction
      const response = await fetch('https://expense-ml-service.onrender.com/api/v1/predict/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Prediction error:', error);
        return {
          success: false,
          error: error.error || 'Failed to predict category'
        };
      }

      const data = await response.json();
      return {
        success: true,
        predicted_category: data.predicted_category,
        confidence: data.confidence
      };
    } catch (error) {
      console.error('Error predicting category:', error);
      return {
        success: false,
        error: 'Network error or server unavailable'
      };
    }
  },

  parseVoice: async (voiceText: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/process-voice-entry/`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ voice_text: voiceText })
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Failed to process voice input'
        };
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Error processing voice input:', error);
      return {
        success: false,
        error: 'Network error or server unavailable'
      };
    }
  }
};