import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../styles/Dashboard.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { transactionAPI } from '../services/api';

interface DashboardProps {
  recentTransactions?: Transaction[];
  totalBalance?: number;
  monthlyExpense?: number;
  savingsGoal?: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  category_name?: string;
  date: string;
  type?: 'income' | 'expense';
  category_type?: 'income' | 'expense';
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyData {
  month: string;
  spending: number;
  income: number;
}

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#cccccc', '#444444', '#888888'];

export const Dashboard: React.FC<DashboardProps> = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  // Memoize expensive chart calculations
  const calculateChartData = useCallback((data: Transaction[]) => {
    const categoryTotals: { [key: string]: number } = {};
    const monthlyTotals: { [key: string]: { income: number; expense: number } } = {};

    data.forEach((t: Transaction) => {
      const amount = Number(t.amount);
      const transactionType = t.category_type || t.type;

      // Aggregate by category
      const categoryName = t.category_name || t.category || 'Uncategorized';
      if (transactionType === 'expense') {
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + amount;
      }

      // Aggregate by month
      const date = new Date(t.date);
      const monthKey = date.toLocaleString('en-US', { month: 'short' });
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = { income: 0, expense: 0 };
      }
      if (transactionType === 'income') {
        monthlyTotals[monthKey].income += amount;
      } else {
        monthlyTotals[monthKey].expense += amount;
      }
    });

    // Convert category totals to chart data
    const categoryChartData = Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value: Number(value.toFixed(2)),
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
    setCategoryData(categoryChartData);

    // Convert monthly totals to chart data
    const monthlyChartData = Object.entries(monthlyTotals)
      .map(([month, totals]) => ({
        month,
        spending: Number(totals.expense.toFixed(2)),
        income: Number(totals.income.toFixed(2))
      }));
    setMonthlyData(monthlyChartData);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all-time totals from backend
      const allTimeTotals = await transactionAPI.getAllTimeTotals();
      
      if (allTimeTotals) {
        setTotalIncome(allTimeTotals.income || 0);
        setTotalExpense(allTimeTotals.expense || 0);
        setTotalBalance(allTimeTotals.net_balance || 0);
        console.log('✅ All-time totals loaded:', allTimeTotals);
      } else {
        console.error('❌ Failed to load all-time totals');
      }
      
      // Fetch transactions for charts and recent transactions
      const data = await transactionAPI.getAll();
      setTransactions(data);

      // Calculate category and monthly data for charts
      calculateChartData(data);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [, ] = useState<string | null>(null);

  const handleAddTransaction = useCallback(() => {
    // Navigate to transactions page
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'transactions' } }));
  }, []);

  const handleCreateGroup = useCallback(() => {
    // Navigate to group expenses page
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'group-expenses' } }));
  }, []);

  const handleScanReceipt = useCallback(() => {
    alert('📸 Receipt Scan Feature: Coming Soon!\n\nCapture a receipt photo to auto-categorize expenses.');
  }, []);

  const handleVoiceInput = useCallback(() => {
    console.log('🎙️ Voice Input button clicked on Dashboard');
    // Navigate to transactions page with voice input flag
    window.dispatchEvent(new CustomEvent('navigate', { 
      detail: { 
        page: 'transactions',
        voiceInput: true 
      } 
    }));
    console.log('📤 Navigation event dispatched with voiceInput: true');
  }, []);

  const savingsGoal = 10000;
  const savingsPercentage = useMemo(() => 
    savingsGoal && totalExpense ? ((savingsGoal - totalExpense) / savingsGoal) * 100 : 0,
    [totalExpense]
  );
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-state">
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card balance-card">
          <div className="card-header">
            <h3> Total Balance</h3>
            <span className="card-icon"></span>
          </div>
          <p className="card-value">₹{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="card-trend">Net balance</p>
        </div>

        <div className="card expense-card">
          <div className="card-header">
            <h3> Total Expenses</h3>
            <span className="card-icon"></span>
          </div>
          <p className="card-value">₹{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="card-trend">All time</p>
        </div>

        <div className="card income-card">
          <div className="card-header">
            <h3> Total Income</h3>
            <span className="card-icon"></span>
          </div>
          <p className="card-value">₹{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="card-trend">All time</p>
        </div>

        <div className="card savings-card">
          <div className="card-header">
            <h3> Savings Goal</h3>
            <span className="card-icon"></span>
          </div>
          <p className="card-value">₹{Math.max(savingsGoal - totalExpense, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${Math.min(Math.max(savingsPercentage, 0), 100)}%` }}></div>
          </div>
          <p className="card-trend">{Math.max(savingsPercentage, 0).toFixed(1)}% remaining</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h2> Monthly Spending Trend</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                  formatter={(value) => `₹${value}`}
                />
                <Legend />
                <Line type="monotone" dataKey="spending" stroke="#000000" strokeWidth={2} dot={{ fill: '#000000' }} name="Expenses" />
                <Line type="monotone" dataKey="income" stroke="#4CAF50" strokeWidth={2} dot={{ fill: '#4CAF50' }} name="Income" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">
              <p>No data available yet. Start adding transactions!</p>
            </div>
          )}
        </div>

        <div className="chart-container">
          <h2> Expense Categories</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₹${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">
              <p>No expense data available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="recent-transactions">
        <div className="transactions-header">
          <h2>📝 Recent Transactions</h2>
          <a href="#transactions" onClick={(e) => { e.preventDefault(); handleAddTransaction(); }} className="view-all">View All →</a>
        </div>
        
        {recentTransactions.length > 0 ? (
          <div className="transactions-list">
            {recentTransactions.map((transaction) => {
              const transactionType = transaction.category_type || transaction.type || 'expense';
              return (
                <div key={transaction.id} className={`transaction-item ${transactionType}`}>
                  <div className="transaction-info">
                    <p className="transaction-description">{transaction.description}</p>
                    <p className="transaction-category">{transaction.category_name || transaction.category || 'Uncategorized'}</p>
                  </div>
                  <p className="transaction-date">{new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  <p className={`transaction-amount ${transactionType}`}>
                    {transactionType === 'income' ? '+' : '-'}₹{Number(transaction.amount).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No transactions yet. Start tracking your expenses!</p>
            <button className="btn btn-primary" onClick={handleAddTransaction}>Add First Transaction</button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>⚡ Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={handleAddTransaction}>
            <span className="icon">➕</span>
            <span>Add Transaction</span>
          </button>
          <button className="action-btn success" onClick={handleCreateGroup}>
            <span className="icon">👥</span>
            <span>Create Group</span>
          </button>
          <button className="action-btn info" onClick={handleScanReceipt}>
            <span className="icon">📸</span>
            <span>Scan Receipt</span>
          </button>
          <button className="action-btn warning" onClick={handleVoiceInput}>
            <span className="icon">🎤</span>
            <span>Voice Input</span>
          </button>
        </div>
      </div>
    </div>
  );
};
