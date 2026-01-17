# 🎓 AI-Powered Personal Finance Tracker - React Frontend

A modern, interactive React frontend for the AI-Powered Personal Finance Tracker project. Built with React, TypeScript, Vite, and Recharts for beautiful data visualization.

## 📋 Features

### 🏠 Dashboard
- **Summary Cards**: View total balance, monthly expenses, savings goals, and budget status
- **Interactive Charts**: 
  - Monthly spending trends (Line Chart)
  - Expense categories breakdown (Pie Chart)
- **Recent Transactions**: Quick view of latest 5 transactions
- **Quick Actions**: Fast access to add transactions, create groups, scan receipts, or use voice input

### 💳 Transactions Management
- **Transaction List**: View all transactions with filtering and search
- **Multiple Filters**: Filter by type (income/expense), category, and search by description
- **Transaction Stats**: Summary of total income, expenses, and net income
- **Add Transaction**: Modal form to quickly add new transactions
- **Payment Methods**: Support for credit card, debit card, cash, and bank transfers
- **Responsive Table**: Clear, sortable transaction history

### 👥 Group Expenses
- **Create Groups**: Set up expense groups for roommates, trips, projects, etc.
- **Member Management**: Add/manage group members with email addresses
- **Expense Tracking**: Log group expenses with equal or custom splits
- **Balance Calculation**: Auto-calculate who owes whom
- **Settlement Recommendations**: Smart suggestions for settling debts
- **Member Cards**: Visual representation of member balances with color coding

### 🎨 UI/UX Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark-Friendly Theme**: Beautiful gradient backgrounds and modern colors
- **Smooth Animations**: Subtle transitions and fade-in effects
- **Accessible Forms**: Clear labels, helpful placeholders, and validation
- **Mobile Navigation**: Bottom navigation drawer for easy access
- **Interactive Charts**: Hover effects and tooltips on charts

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Charting**: Recharts
- **Styling**: CSS3 with CSS Variables
- **State Management**: React Hooks (useState)

## 📂 Project Structure

```
src/
├── components/
│   ├── Header.tsx          # Navigation header
│   ├── Dashboard.tsx       # Main dashboard view
│   ├── Transactions.tsx    # Transaction management
│   ├── GroupExpenses.tsx   # Group expense management
│   └── Auth.tsx            # Login component
├── styles/
│   ├── Header.css
│   ├── Dashboard.css
│   ├── Transactions.css
│   ├── GroupExpenses.css
│   └── Auth.css
├── App.tsx                 # Main app component with routing
├── App.css                 # Global styles
└── index.css              # Base styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Navigate to the frontend-vite directory:
```bash
cd frontend-vite
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## 📖 Component Documentation

### Header Component
Sticky navigation header with logo, menu links, and user section.

**Props:**
- `onLogout?: () => void` - Logout callback
- `userName?: string` - Display user's name

### Dashboard Component
Main dashboard with charts and summary statistics.

**Props:**
- `recentTransactions?: Transaction[]` - Recent transaction list
- `totalBalance?: number` - Total account balance
- `monthlyExpense?: number` - Monthly expense total
- `savingsGoal?: number` - Savings goal amount

### Transactions Component
Complete transaction management interface.

**Props:**
- `transactions?: Transaction[]` - List of all transactions
- `onAddTransaction?: (transaction: Transaction) => void` - Add transaction callback

### GroupExpenses Component
Group expense tracking and management.

**Props:**
- `groups?: Group[]` - List of groups
- `onAddGroup?: (group: Group) => void` - Add group callback
- `onAddExpense?: (groupId: string, expense: GroupExpense) => void` - Add expense callback

### Auth Component (Login)
User authentication interface.

**Props:**
- `onLogin?: (username: string, password: string) => void` - Login callback

## 🎨 Color Scheme

- **Primary Gradient**: `#667eea` to `#764ba2`
- **Secondary**: `#f093fb`
- **Accent**: `#4facfe`
- **Success**: `#43e97b`
- **Danger**: `#e74c3c`
- **Warning**: `#fa709a`

## 📱 Responsive Breakpoints

- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: < 768px

## 🔄 State Management

The app uses React Hooks for state management:
- `useState` for component-level state
- Props drilling for component communication
- Mock data included for demonstration

## 🎯 Future Enhancements

- [ ] Backend API integration
- [ ] User authentication with JWT
- [ ] Receipt scanning with OCR
- [ ] Voice input for transactions
- [ ] Advanced analytics and forecasting
- [ ] Bill reminders and notifications
- [ ] Export to CSV/PDF
- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Progressive Web App (PWA)

## 📝 Demo Data

The app comes with pre-populated demo data:
- **Dashboard**: Sample transactions and balance data
- **Transactions**: 5 demo transactions across different categories
- **Groups**: 2 demo groups with members and expenses

### Demo Credentials
- Email: `demo@example.com`
- Password: `demo123`

## 🐛 Known Limitations

- Current version uses mock data (not connected to backend)
- Charts are static (based on mock data)
- Form submissions don't persist data
- No real authentication yet

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Recharts Documentation](https://recharts.org)
- [TypeScript Documentation](https://www.typescriptlang.org)

## 👨‍💻 Development

### Available Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript checks

## 📄 License

This project is part of the AI-Powered Personal Finance Tracker - Final Year Project.

## 🤝 Contributing

Feel free to fork, modify, and improve this frontend. When ready to integrate with the backend:

1. Update API endpoints in components
2. Replace mock data with API calls
3. Implement proper error handling
4. Add loading states and spinners
5. Implement user authentication flow

## 📧 Support

For issues or questions about the frontend implementation, please refer to the main project documentation.

---

**Made with ❤️ for smart finance management**
