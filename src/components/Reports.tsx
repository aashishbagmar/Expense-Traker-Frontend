import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../services/api'
import '../styles/Reports.css'

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}


interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  type: string;
  amount: number;
}

interface ReportSummary {
  income: number;
  expense: number;
  net_savings: number;
  savings_rate: number;
  transaction_count: number;
  income_count: number;
  expense_count: number;
}


export const Reports = () => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const [selectedMonth, setSelectedMonth] = useState(months[currentMonth])
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [summaryCards, setSummaryCards] = useState<ReportSummary>({
    income: 0,
    expense: 0,
    net_savings: 0,
    savings_rate: 0,
    transaction_count: 0,
    income_count: 0,
    expense_count: 0
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  const handleExportPDF = async () => {
    try {
      const monthIndex = months.indexOf(selectedMonth) + 1
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        alert('Please log in to export PDF')
        return
      }

      const response = await fetch(
        `expense-report-traker.onrender.com/api/analytics/export-pdf/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            month: monthIndex,
            year: selectedYear,
            category: selectedCategory !== 'all' ? selectedCategory : null,
            transaction_type: selectedType !== 'all' ? selectedType : null,
          }),
        }
      )

      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Financial_Report_${selectedMonth}_${selectedYear}.pdf`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  // Load report data from backend when filters change
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true)
        const monthIndex = months.indexOf(selectedMonth) + 1
        
        // Build query parameters
        const params = new URLSearchParams()
        params.append('month', monthIndex.toString())
        params.append('year', selectedYear.toString())
        if (selectedCategory !== 'all') params.append('category', selectedCategory)
        if (selectedType !== 'all') params.append('transaction_type', selectedType)
        
        const token = localStorage.getItem('authToken')
        if (!token) {
          console.error('No auth token found')
          return
        }
        
        // Call backend financial report endpoint
        const response = await fetch(
          `${API_BASE_URL}/api/analytics/financial-report/`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              month: monthIndex,
              year: selectedYear,
              category: selectedCategory !== 'all' ? selectedCategory : null,
              transaction_type: selectedType !== 'all' ? selectedType : null,
            }),
          }
        )

        
        if (!response.ok) {
          throw new Error('Failed to load financial report data')
        }
        
        const data = await response.json()
        console.log('✅ Financial report data:', data)
        
        if (data.success) {
          // Update summary cards from backend
          setSummaryCards(data.summary)
          
          // Update category breakdown
          setCategories(data.category_breakdown)
          
          // Update transactions
          setTransactions(data.transactions)
          
          // Extract available categories from all transactions on first load
          if (selectedCategory === 'all' && selectedType === 'all') {
            const uniqueCategories = [...new Set(data.transactions.map((t: Transaction) => t.category))]
            setAvailableCategories(uniqueCategories.sort() as string[])
          }
        }
      } catch (error) {
        console.error('Error loading report data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReportData()
  }, [selectedMonth, selectedYear, selectedCategory, selectedType])

  if (loading) {
    return <div className="reports-container"><p>Loading reports...</p></div>
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Financial Reports</h1>
        <p>Detailed analysis of your spending and income patterns</p>
      </div>

      {/* Filters */}
      <div className="reports-filters">
        <div className="filter-group">
          <label>Month</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Year</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Category</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Type</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>
        </div>
        <button className="report-button" onClick={handleExportPDF}>📥 Export PDF</button>
      </div>

      {/* Summary Cards */}
      <div className="report-cards">
        <div className="report-card">
          <div className="card-label">Total Income</div>
          <div className="card-amount">₹{summaryCards.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="card-change positive">↑ {summaryCards.income_count} transactions</div>
        </div>
        <div className="report-card">
          <div className="card-label">Total Expense</div>
          <div className="card-amount">₹{summaryCards.expense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="card-change negative">↓ {summaryCards.expense_count} transactions</div>
        </div>
        <div className="report-card">
          <div className="card-label">Net Savings</div>
          <div className="card-amount">₹{summaryCards.net_savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className={`card-change ${summaryCards.net_savings >= 0 ? 'positive' : 'negative'}`}>
            {summaryCards.net_savings >= 0 ? '↑' : '↓'} This Month
          </div>
        </div>
        <div className="report-card">
          <div className="card-label">Savings Rate</div>
          <div className="card-amount">{summaryCards.savings_rate.toFixed(1)}%</div>
          <div className="card-change neutral">Target: 30%</div>
        </div>
      </div>

      {/* Category Report */}
      {categories.length > 0 ? (
        <div className="report-section">
          <h2>Expense Breakdown by Category</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Percentage</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((item, index) => (
                <tr key={index}>
                  <td>{item.category}</td>
                  <td className="amount">₹{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <span>{item.percentage}%</span>
                  </td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="report-section"><p>No data available for selected filters</p></div>
      )}

      {/* Transactions List */}
      {transactions.length > 0 && (
        <div className="report-section">
          <h2>Transactions ({transactions.length})</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, index) => (
                <tr key={index}>
                  <td>{new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</td>
                  <td>{txn.description || '—'}</td>
                  <td>{txn.category}</td>
                  <td><span className={`badge ${txn.type}`}>{txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}</span></td>
                  <td className={`amount ${txn.type}`}>₹{txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
