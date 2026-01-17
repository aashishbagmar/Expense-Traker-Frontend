import React, { useEffect, useRef, useState } from 'react';
import '../styles/Transactions.css';
import { transactionAPI, aiAPI } from '../services/api';
import { parseSpokenNumber } from "../utils/parseSpokenNumber";


interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  category_name?: string;
  date: string;
  type: 'income' | 'expense';
  category_type?: 'income' | 'expense';
  paymentMethod?: string;
  currency?: string;
}

interface TransactionsProps {
  transactions?: Transaction[];
  onAddTransaction?: (transaction: Transaction) => void;
  voiceInputMode?: boolean;
}

type VoiceParseResponse = {
  success?: boolean;
  raw_text?: string;
  description?: string;
  amount?: number;
  transaction_type?: 'income' | 'expense';
  category?: string;
  category_confidence?: number | null;
  date?: string;
  error?: string;
};

// const mockTransactions: Transaction[] = [
//   {
//     id: '1',
//     description: 'Grocery Shopping',
//     amount: 125.50,
//     category: 'Food',
//     date: '2024-01-15',
//     type: 'expense',
//     paymentMethod: 'Credit Card'
//   },
//   {
//     id: '2',
//     description: 'Salary Deposit',
//     amount: 5000,
//     category: 'Income',
//     date: '2024-01-01',
//     type: 'income',
//     paymentMethod: 'Bank Transfer'
//   },
//   {
//     id: '3',
//     description: 'Gas',
//     amount: 45.00,
//     category: 'Transport',
//     date: '2024-01-14',
//     type: 'expense',
//     paymentMethod: 'Debit Card'
//   },
//   {
//     id: '4',
//     description: 'Movie Tickets',
//     amount: 30.00,
//     category: 'Entertainment',
//     date: '2024-01-13',
//     type: 'expense',
//     paymentMethod: 'Cash'
//   },
//   {
//     id: '5',
//     description: 'Electricity Bill',
//     amount: 80.00,
//     category: 'Utilities',
//     date: '2024-01-10',
//     type: 'expense',
//     paymentMethod: 'Bank Transfer'
//   },
// ];

export const Transactions: React.FC<TransactionsProps> = ({ onAddTransaction, voiceInputMode = false }) => {
  console.log('Transactions component rendering, voiceInputMode:', voiceInputMode);
  const [transactions, setTransactions] = useState<Transaction[]>([]);  // Use mock data by default
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLoading] = useState(false);
  const [predictingCategory, setPredictingCategory] = useState(false);
  const [predictionConfidence, setPredictionConfidence] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [aiPrediction, setAiPrediction] = useState<{ category: string; confidence: number } | null>(null);
  
  // Monthly totals state - fetched from backend API (all transactions, not just paginated)
  const [monthlyTotals, setMonthlyTotals] = useState({
    income: 0,
    expense: 0,
    net_income: 0,
    transaction_count: 0
  });
  const voiceInputTriggeredRef = useRef(false);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
    paymentMethod: 'Credit Card'
  });

  // Load transactions on mount
  useEffect(() => {
    loadTransactions();
    loadMonthlyTotals();  // Load aggregated totals from backend
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognition));
  }, []);

  // Separate effect for handling voice input mode to ensure modal is rendered first
  useEffect(() => {
    // Only act when voiceInputMode becomes true
    if (!voiceInputMode) return;

    console.log('🎤 Voice input mode triggered from dashboard');
    voiceInputTriggeredRef.current = true;

    setShowModal(true);
    console.log('📟 Opening Add Transaction modal');

    // Delay to ensure the modal and button render, then click the speak button
    const timer = setTimeout(() => {
      console.log('🔴 Attempting to click speak button...');
      let attempts = 0;
      const clickInterval = setInterval(() => {
        const voiceBtn = document.querySelector('[data-testid="speak-button"]') as HTMLButtonElement;
        console.log(`Attempt ${attempts + 1}: Button found:`, !!voiceBtn);
        if (voiceBtn) {
          console.log('🖱️ Clicking speak button now!');
          voiceBtn.click();
          clearInterval(clickInterval);
          // Reset the ref after successful click so it can work again next time
          setTimeout(() => {
            voiceInputTriggeredRef.current = false;
            console.log('♻️ Reset voiceInputTriggeredRef for next use');
          }, 500);
        } else if (attempts >= 10) {
          console.log('❌ Could not find speak button after 10 attempts');
          clearInterval(clickInterval);
          voiceInputTriggeredRef.current = false;
        }
        attempts++;
      }, 200);
    }, 900);

    return () => {
      clearTimeout(timer);
      voiceInputTriggeredRef.current = false;
    };
  }, [voiceInputMode])

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionAPI.getAll();
      console.log('Raw API data:', data);
      console.log('Is array?', Array.isArray(data));
      console.log('Data length:', data?.length);
      
      if (!data || data.length === 0) {
        console.log('No transactions returned, using empty array');
        setTransactions([]);
      } else {
        console.log(`Loaded ${data.length} transactions:`, data);
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Load monthly totals from backend (all transactions for current month)
  const loadMonthlyTotals = async () => {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      console.log('Loading monthly totals for', month, year);
      
      const totals = await transactionAPI.getMonthlyTotals(month, year);
      
      if (totals) {
        setMonthlyTotals(totals);
        console.log('✅ Monthly totals loaded successfully:', totals);
      } else {
        console.error('Failed to load monthly totals');
      }
    } catch (error) {
      console.error('Error in loadMonthlyTotals:', error);
    }
  };

  console.log('Current transactions state:', transactions);
  console.log('Transactions count:', transactions.length);

  const categories = ['Entertainment', 'Food', 'Groceries', 'Health', 'Income', 'Shopping', 'Transport', 'Travel', 'Utilities'];
  const paymentMethods = ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'Mobile Wallet'];


  const filteredTransactions = transactions.filter(t => {
    const matchesCategory = filterCategory === 'all' || t.category_name === filterCategory || t.category === filterCategory;
    const matchesType = filterType === 'all' || t.type === filterType || t.category_type === filterType;
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesType && matchesSearch;
  });

  // Sort by date descending (latest first), then by id descending for same date
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    // If date is the same, sort by id descending (assuming string id, fallback to string compare)
    if (a.id && b.id) {
      // Try numeric compare if possible
      const aNum = Number(a.id);
      const bNum = Number(b.id);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return bNum - aNum;
      }
      // Otherwise, string compare (newer id lexically last)
      return b.id.localeCompare(a.id);
    }
    return 0;
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If category is changed manually, update type accordingly
    if (name === 'category') {
      const isIncome = value.toLowerCase() === 'income';
      setFormData(prev => ({
        ...prev,
        category: value,
        type: isIncome ? 'income' : 'expense'
      }));
      
      // Log if user is overriding AI prediction
      if (aiPrediction && aiPrediction.category !== value) {
        console.log(`🔄 User override detected: AI suggested "${aiPrediction.category}" but user selected "${value}"`);
      }
    } else if (name === 'description') {
      const trimmedValue = value.trim();
      
      // Check if description matches any category name (case-insensitive)
      const matchedCategory = categories.find(
        cat => cat.toLowerCase() === trimmedValue.toLowerCase()
      );
      
      if (matchedCategory) {
        // User typed a category name directly - auto-select it
        const isIncome = matchedCategory.toLowerCase() === 'income';
        setFormData(prev => ({
          ...prev,
          description: value,
          category: matchedCategory,
          type: isIncome ? 'income' : 'expense'
        }));
        setPredictionConfidence(1); // 100% confidence since it's exact match
        // Clear AI prediction when user explicitly types category
        setAiPrediction(null);
      } else {
        // Regular description - set and trigger AI prediction
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        
        // AI auto-categorization when description changes
        if (trimmedValue.length > 3) {
          handleAIAutoCategorize(value);
        } else {
          // Clear prediction for very short descriptions
          setAiPrediction(null);
          setPredictionConfidence(null);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAIAutoCategorize = async (description: string) => {
    if (!description.trim()) return;
    
    setPredictingCategory(true);
    try {
      const result = await aiAPI.predictCategory(description);
      
      if (result.success) {
        // Automatically set type based on category
        const isIncome = result.predicted_category.toLowerCase() === 'income';
        
        setFormData(prev => ({
          ...prev,
          category: result.predicted_category,
          type: isIncome ? 'income' : 'expense'
        }));
        setPredictionConfidence(result.confidence);
        
        // Store AI prediction for correction tracking
        setAiPrediction({
          category: result.predicted_category,
          confidence: result.confidence
        });
        
        // Log AI prediction for tracking
        console.log(`✨ AI Prediction: "${description}" → ${result.predicted_category} (${(result.confidence * 100).toFixed(1)}%)`);
      }
    } catch (error) {
      console.error('AI prediction failed silently - will use manual category selection');
      setPredictionConfidence(null);
      setAiPrediction(null);
    } finally {
      setPredictingCategory(false);
    }
  };

    const handleVoiceTranscript = async (transcript: string) => {
      const cleanedTranscript = transcript.trim();
      if (!cleanedTranscript) return;

      setPredictingCategory(true);
      setVoiceError(null);
      setVoiceTranscript(cleanedTranscript);

      try {
        const result = (await aiAPI.parseVoice(cleanedTranscript)) as VoiceParseResponse;

        if (!result || result.success === false) {
          setVoiceError(result?.error || 'Unable to process voice input');
          return;
        }

        // Use backend amount if valid, otherwise use parseSpokenNumber
        // ✅ Decide final amount (frontend parser has priority for large values)
        let amountToUse = '';

        const backendAmount =
          result.amount !== undefined && result.amount !== null
            ? Number(result.amount)
            : null;

        const parsedAmount = parseSpokenNumber(cleanedTranscript);

        // ✅ If spoken number is large (lakh, crore, etc), trust it
        if (parsedAmount !== null && parsedAmount >= 1000) {
          amountToUse = parsedAmount.toString();
        } 
        // Otherwise fallback to backend
        else if (backendAmount !== null && !isNaN(backendAmount)) {
          amountToUse = backendAmount.toString();
        }


        setFormData(prev => ({
          ...prev,
          description: result.description || cleanedTranscript,
          amount: amountToUse || prev.amount,
          category: result.category || prev.category,
          date: result.date || prev.date,
          type: result.transaction_type === 'income' ? 'income' : 'expense'
        }));

        if (typeof result.category_confidence === 'number') {
          setPredictionConfidence(result.category_confidence);
          // Store AI prediction for correction tracking
          setAiPrediction({
            category: result.category || 'Uncategorized',
            confidence: result.category_confidence
          });
        } else {
          setPredictionConfidence(null);
          setAiPrediction(null);
        }
      } catch (error) {
        setVoiceError('Failed to process voice input. Please try again.');
      } finally {
        setPredictingCategory(false);
      }
    };

  const handleStartVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    setVoiceTranscript('');
    setVoiceError(null);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results || [])
        .map((r: any) => (r[0]?.transcript || ''))
        .join(' ')
        .trim();

      if (transcript) {
        setVoiceTranscript(transcript);        
      }

      const isFinal = event.results && event.results[event.results.length - 1]?.isFinal;
      if (isFinal && transcript) {
        recognition.stop();
        handleVoiceTranscript(transcript);
      }
    };

    recognition.onerror = () => {
      setVoiceError('Speech recognition error. Please try again.');
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    setIsRecording(true);
    recognition.start();
  };

  const handleStopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    let categoryToUse = formData.category;

    // If no category selected, use AI to predict it
    if (!categoryToUse || categoryToUse === '' || categoryToUse === 'Uncategorized') {
      try {
        const prediction = await aiAPI.predictCategory(formData.description);
        if (prediction.success) {
          categoryToUse = prediction.predicted_category;
          console.log(`🤖 AI Auto-Categorized: "${formData.description}" → ${categoryToUse}`);
        }
      } catch (error) {
        console.error('AI prediction failed during submit, using default category');
        categoryToUse = 'Other';
      }
    }

    const transactionData = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: categoryToUse,
      date: formData.date,
      type: formData.type,
      paymentMethod: formData.paymentMethod,
      currency: 'USD',
      // Include AI prediction for correction tracking
      ai_predicted_category: aiPrediction?.category || '',
      ai_confidence: aiPrediction?.confidence || null
    };

    try {
      setLoading(true);
      
      if (editingId) {
        // Update existing transaction
        await transactionAPI.update(editingId, transactionData);
        setTransactions(transactions.map(t => 
          t.id === editingId 
            ? { ...t, ...transactionData }
            : t
        ));
        setEditingId(null);
        await loadMonthlyTotals();  // Reload monthly totals after update
        alert('Transaction updated successfully!');
      } else {
        // Create new transaction
        await transactionAPI.create(transactionData);
        
        // Reload all transactions from backend to ensure sync
        await loadTransactions();
        await loadMonthlyTotals();  // Reload monthly totals after adding transaction
        
        alert('Transaction added successfully!');
      }
      
      onAddTransaction?.(transactionData as any);
      setShowModal(false);
      setFormData({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        paymentMethod: 'Credit Card'
      });
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category || '',
      date: transaction.date,
      type: transaction.type,
      paymentMethod: transaction.paymentMethod || 'Credit Card'
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      setLoading(true);
      await transactionAPI.delete(id);
      setTransactions(transactions.filter(t => t.id !== id));
      await loadMonthlyTotals();  // Reload monthly totals after deletion
      alert('Transaction deleted successfully!');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    handleStopVoice();
    setVoiceTranscript('');
    setVoiceError(null);
    setAiPrediction(null);
    setPredictionConfidence(null);
    setFormData({
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      paymentMethod: 'Credit Card'
    });
  };

  // Get current month and year
  // const currentDate = new Date();
  // const currentMonth = currentDate.getMonth() + 1;
  // const currentYear = currentDate.getFullYear();

  // Filter transactions for current month only (for table display)
  // const currentMonthTransactions = transactions.filter(t => {
  //   const txDate = new Date(t.date);
  //   return txDate.getMonth() + 1 === currentMonth && txDate.getFullYear() === currentYear;
  // });

  // Use backend totals (all transactions for month) instead of calculating from visible transactions
  const totalIncome = monthlyTotals.income;
  const totalExpense = monthlyTotals.expense;
  const netIncome = monthlyTotals.net_income;

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <div className="header-info">
          <h1>📝 Transactions</h1>
          <p>Manage and track all your financial transactions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Add Transaction
        </button>
      </div>

      {/* Summary Stats */}
      <div className="transaction-stats">
        <div className="stat-card income">
          <h3>Total Income</h3>
          <p className="stat-value">+₹{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <span className="stat-label">This month</span>
        </div>
        <div className="stat-card expense">
          <h3>Total Expenses</h3>
          <p className="stat-value">-₹{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <span className="stat-label">This month</span>
        </div>
        <div className="stat-card net">
          <h3>Net Income</h3>
          <p className="stat-value">₹{netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <span className="stat-label">This month</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Category:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="transactions-list">
        {filteredTransactions.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Payment Method</th>
                  <th className="amount-col">Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((transaction) => (
                  <tr key={transaction.id} className={`transaction-row ${transaction.category_type || transaction.type}`}>
                    <td className="date-col">
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="description-col">
                      <span className="transaction-desc">{transaction.description}</span>
                    </td>
                    <td className="category-col">
                      <span className="category-badge">{transaction.category_name || transaction.category || 'Uncategorized'}</span>
                    </td>
                    <td className="payment-col">{transaction.paymentMethod || 'INR'}</td>
                    <td className={`amount-col ${transaction.category_type || transaction.type}`}>
                      <span className="amount-value">
                        {(transaction.category_type === 'income' || transaction.type === 'income') ? '+' : '-'}₹{Number(transaction.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="actions-col">
                      <button 
                        className="action-icon" 
                        title="Edit"
                        onClick={() => handleEdit(transaction)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-icon" 
                        title="Delete"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="transactions-mobile-cards">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className={`transaction-card ${transaction.category_type || transaction.type}`}>
                  <div className="transaction-card-row">
                    <span className="transaction-card-label">Date</span>
                    <span className="transaction-card-value">
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="transaction-card-row">
                    <span className="transaction-card-label">Description</span>
                    <span className="transaction-card-value">{transaction.description}</span>
                  </div>
                  <div className="transaction-card-row">
                    <span className="transaction-card-label">Category</span>
                    <span className="transaction-card-value">
                      <span className="category-badge">{transaction.category_name || transaction.category || 'Uncategorized'}</span>
                    </span>
                  </div>
                  <div className="transaction-card-row">
                    <span className="transaction-card-label">Amount</span>
                    <span className={`transaction-card-value amount-value ${transaction.category_type || transaction.type}`}>
                      {(transaction.category_type === 'income' || transaction.type === 'income') ? '+' : '-'}₹{Number(transaction.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="transaction-card-actions">
                    <button 
                      className="action-icon" 
                      title="Edit"
                      onClick={() => handleEdit(transaction)}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="action-icon" 
                      title="Delete"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>No transactions found</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create your first transaction
            </button>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Transaction' : 'Add New Transaction'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="transaction-form">
              <div className="form-group">
                <label>Description *</label>
                <div className="description-input-wrapper">
                  <input
                    type="text"
                    name="description"
                    placeholder="e.g., Grocery Shopping (AI will auto-suggest category)"
                    value={formData.description}
                    onChange={handleFormChange}
                    required
                  />
                  <div className="description-actions">
                    {voiceSupported ? (
                      <button
                        type="button"
                        data-testid="speak-button"
                        className={`voice-btn ${isRecording ? 'recording' : ''}`}
                        onClick={isRecording ? handleStopVoice : handleStartVoice}
                        disabled={predictingCategory}
                        aria-label="Record expense via voice"
                      >
                        {isRecording ? 'Stop' : '🎙️ Speak'}
                      </button>
                    ) : (
                      <span className="voice-support-note">Voice input not supported in this browser</span>
                    )}
                    {predictingCategory && <span className="ai-loading">🤖 Analyzing...</span>}
                  </div>
                </div>
                {isRecording && (
                  <div className="listening-indicator">
                    <span className="listening-dot"></span>
                    <span className="listening-dot"></span>
                    <span className="listening-dot"></span>
                    <span className="listening-text">Listening...</span>
                  </div>
                )}
                {voiceTranscript && (
                  <div className="voice-transcript">
                    <span className="voice-label">Transcript</span>
                    <span className="voice-text">{voiceTranscript}</span>
                  </div>
                )}
                {voiceError && <div className="voice-error">{voiceError}</div>}
                {aiPrediction && predictionConfidence !== null && (
                  <div className="ai-suggestion">
                    <span className="ai-badge">✨ AI Prediction</span>
                    <span className="confidence-score">
                      Category: <strong>{aiPrediction.category}</strong>
                      ({(aiPrediction.confidence * 100).toFixed(1)}% confidence)
                    </span>
                  </div>
                )}

              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount *</label>
                  <div className="amount-input">
                    <span className="currency">₹</span>
                    <input
                      type="number"
                      name="amount"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Type *</label>
                  <select name="type" value={formData.type} onChange={handleFormChange}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleFormChange}>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleFormChange}>
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
