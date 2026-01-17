import React, { useState, useEffect } from 'react';
import '../styles/GroupExpenses.css';
import { groupAPI } from '../services/api';

interface GroupMember {
  id: string;
  name: string;
  email: string;
  balance: number;
}

interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paidBy: string;
  paidById?: number;
  splitType: 'equal' | 'custom';
  splitAmount?: number;
  splitMembers?: number[];
  members?: string[];
  splitBreakdown?: Record<string, number>;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  expenses: GroupExpense[];
  totalExpense: number;
}

export const GroupExpenses: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'groups' | 'create'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);

  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    members: ['']
  });

  const [editGroupData, setEditGroupData] = useState({
    name: '',
    description: '',
    members: [{ id: undefined, name: '' }] as { id?: string | number; name: string }[]
  });

  const [newExpenseData, setNewExpenseData] = useState({
    description: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    paidBy: '',
    splitType: 'equal' as 'equal' | 'custom',
    selectedMembers: [] as string[],
    customAmounts: {} as Record<string, string>  // Store custom amount for each member
  });

  const [editingExpense, setEditingExpense] = useState<GroupExpense | null>(null);

  // Ensure Paid By options reflect the current group's members
  useEffect(() => {
    if (selectedGroup?.members?.length) {
      const memberIds = selectedGroup.members.map(m => m.id.toString());
      setNewExpenseData(prev => ({
        ...prev,
        paidBy: prev.paidBy || memberIds[0],
        selectedMembers: prev.selectedMembers.length ? prev.selectedMembers : memberIds
      }));
    } else {
      setNewExpenseData(prev => ({ ...prev, paidBy: '', selectedMembers: [] }));
    }
  }, [selectedGroup]);

  const resetExpenseForm = (groupOverride?: Group | null) => {
    const targetGroup = typeof groupOverride === 'undefined' ? selectedGroup : groupOverride;

    setNewExpenseData({
      description: '',
      amount: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      paidBy: targetGroup?.members[0]?.id.toString() || '',
      splitType: 'equal',
      selectedMembers: targetGroup?.members.map(m => m.id.toString()) || [],
      customAmounts: {}
    });

    setEditingExpense(null);
  };

  // Load groups from API on mount
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        const fetchedGroups = await groupAPI.getAll();

        const normalizedGroups = Array.isArray(fetchedGroups)
          ? fetchedGroups.map(group => ({
              ...group,
              members: group.members || []
            }))
          : [];

        if (normalizedGroups.length > 0) {
          setGroups(normalizedGroups);
          setSelectedGroup(normalizedGroups[0]);
        } else {
          setGroups([]);
          setSelectedGroup(null);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  const reloadGroups = async (preferGroupId?: string | number) => {
    try {
      setLoading(true);
      const fetchedGroups = await groupAPI.getAll();
      const normalizedGroups = Array.isArray(fetchedGroups)
        ? fetchedGroups.map(group => ({
            ...group,
            members: group.members || [],
          }))
        : [];

      setGroups(normalizedGroups);

      if (preferGroupId) {
        const found = normalizedGroups.find(g => g.id.toString() === preferGroupId.toString());
        if (found) {
          setSelectedGroup(found);
          return;
        }
      }

      setSelectedGroup(normalizedGroups[0] || null);
    } catch (error) {
      console.error('Error reloading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddExpenseModal = () => {
    resetExpenseForm();
    setShowAddExpenseModal(true);
  };

  const closeExpenseModal = () => {
    resetExpenseForm();
    setShowAddExpenseModal(false);
  };

  const openEditGroupModal = () => {
    if (!selectedGroup) return;
    setEditGroupData({
      name: selectedGroup.name,
      description: selectedGroup.description,
      members: selectedGroup.members.map(m => ({ id: m.id, name: m.name }))
    });
    setShowEditGroupModal(true);
  };

  const handleAddGroup = async () => {
    if (newGroupData.name && newGroupData.members.some(m => m)) {
      try {
        const groupPayload = {
          name: newGroupData.name,
          description: newGroupData.description,
          members: newGroupData.members.filter(m => m)
        };
        
        const newGroup = await groupAPI.create(groupPayload);
        
        if (newGroup) {
          setGroups([...groups, newGroup]);
          setSelectedGroup(newGroup);
          setShowCreateGroupModal(false);
          setNewGroupData({ name: '', description: '', members: [''] });
          setActiveTab('groups');
        }
      } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group');
      }
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;
    if (!editGroupData.name) {
      alert('Group name is required');
      return;
    }

    try {
      const payload = {
        name: editGroupData.name,
        description: editGroupData.description,
        members: editGroupData.members
          .filter(m => m.name)
          .map(m => ({ id: m.id, name: m.name }))
      };

      const updated = await groupAPI.update(selectedGroup.id, payload);

      // refresh groups to sync balances/members
      await reloadGroups(selectedGroup.id.toString());

      setShowEditGroupModal(false);
      alert('Group updated');

      // update local selected group if response available
      if (updated) {
        const refreshed = await groupAPI.getAll();
        const normalizedGroups = Array.isArray(refreshed)
          ? refreshed.map(group => ({ ...group, members: group.members || [] }))
          : [];
        const found = normalizedGroups.find(g => g.id === selectedGroup.id);
        if (found) {
          setGroups(normalizedGroups);
          setSelectedGroup(found);
        }
      }
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Failed to update group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    const confirmed = window.confirm('Delete this group and all its expenses?');
    if (!confirmed) return;

    try {
      await groupAPI.delete(selectedGroup.id);

      const remaining = groups.filter(g => g.id !== selectedGroup.id);
      setGroups(remaining);
      setSelectedGroup(remaining[0] || null);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    }
  };

  const handleAddExpense = async () => {
    if (selectedGroup && newExpenseData.description && newExpenseData.amount) {
      try {
        // Validation for custom split
        if (newExpenseData.splitType === 'custom') {
          const totalAmount = parseFloat(newExpenseData.amount);
          const customTotal = Object.values(newExpenseData.customAmounts)
            .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
          
          // Check if amounts add up (allow 0.01 difference for rounding)
          if (Math.abs(customTotal - totalAmount) >= 0.01) {
            alert(`Custom split amounts ($${customTotal.toFixed(2)}) must equal the total expense ($${totalAmount.toFixed(2)})`);
            return;
          }
          
          // Check if at least one member has an amount
          const hasAmounts = Object.values(newExpenseData.customAmounts).some(val => parseFloat(val) > 0);
          if (!hasAmounts) {
            alert('Please enter amounts for at least one member');
            return;
          }
        }
        
        // For custom split, use members with non-zero amounts; for equal split, use all members
        let memberIdsToSplit: number[];
        let splitAmount: number;
        let splitBreakdown: Record<string, number> = {};
        
        if (newExpenseData.splitType === 'custom') {
          // Only include members with amounts > 0
          memberIdsToSplit = Object.entries(newExpenseData.customAmounts)
            .filter(([_, amount]) => parseFloat(amount) > 0)
            .map(([memberId, _]) => parseInt(memberId));
          splitAmount = parseFloat(newExpenseData.amount) / (memberIdsToSplit.length || 1);
          splitBreakdown = Object.fromEntries(
            Object.entries(newExpenseData.customAmounts)
              .filter(([_, amount]) => parseFloat(amount) > 0)
              .map(([memberId, amount]) => [memberId, parseFloat(amount)])
          );
        } else {
          memberIdsToSplit = selectedGroup.members?.map(m => parseInt(m.id.toString())) || [];
          splitAmount = parseFloat(newExpenseData.amount) / (memberIdsToSplit.length || 1);
          splitBreakdown = Object.fromEntries(
            memberIdsToSplit.map(id => [id.toString(), parseFloat(splitAmount.toFixed(2))])
          );
        }
        
        const expensePayload = {
          description: newExpenseData.description,
          amount: parseFloat(newExpenseData.amount),
          category: newExpenseData.category,
          date: newExpenseData.date,
          paid_by: parseInt(newExpenseData.paidBy),
          split_type: newExpenseData.splitType,
          group: parseInt(selectedGroup.id.toString()),
          split_amount: splitAmount,
          split_members: memberIdsToSplit,
          split_breakdown: splitBreakdown
        };

        console.log(editingExpense ? 'Updating expense:' : 'Adding expense to group:', expensePayload);

        // Call the API to add or update the expense
        const savedExpense = editingExpense
          ? await groupAPI.updateExpense(editingExpense.id, expensePayload)
          : await groupAPI.addExpense(expensePayload);
        const normalizedExpense: GroupExpense = {
          id: savedExpense.id?.toString() || Date.now().toString(),
          description: savedExpense.description || newExpenseData.description,
          amount: parseFloat(savedExpense.amount || newExpenseData.amount),
          category: savedExpense.category || newExpenseData.category,
          date: savedExpense.date || newExpenseData.date,
          paidBy: selectedGroup.members.find(m => m.id.toString() === (savedExpense.paid_by?.toString() || newExpenseData.paidBy))?.name || '',
          paidById: savedExpense.paid_by || parseInt(newExpenseData.paidBy),
          splitType: (savedExpense.split_type as any) || newExpenseData.splitType,
          splitAmount: parseFloat(savedExpense.split_amount || splitAmount.toString()),
          splitMembers: savedExpense.split_members || memberIdsToSplit,
          splitBreakdown: savedExpense.split_breakdown || splitBreakdown
        };

        // If editing, replace; otherwise append
        let updatedExpenses: GroupExpense[];
        if (editingExpense) {
          updatedExpenses = (selectedGroup.expenses || []).map(exp =>
            exp.id === editingExpense.id ? normalizedExpense : exp
          );
        } else {
          updatedExpenses = [...(selectedGroup.expenses || []), normalizedExpense];
        }

        const updatedGroup = {
          ...selectedGroup,
          expenses: updatedExpenses,
          totalExpense: editingExpense
            ? (selectedGroup.totalExpense || 0) - (editingExpense.amount || 0) + parseFloat(newExpenseData.amount)
            : (selectedGroup.totalExpense || 0) + parseFloat(newExpenseData.amount)
        };

        setSelectedGroup(updatedGroup);
        setGroups(groups.map(g => g.id === selectedGroup.id ? updatedGroup : g));

        setShowAddExpenseModal(false);
        resetExpenseForm(selectedGroup);
        setEditingExpense(null);

        // Refresh groups to update balances from backend calculations
        await reloadGroups(selectedGroup.id.toString());

        alert(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!');
      } catch (error) {
        console.error('Error adding expense:', error);
        alert('Failed to add expense');
      }
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'neutral';
  };

  const startEditExpense = (expense: GroupExpense) => {
    if (!selectedGroup) return;

    setEditingExpense(expense);

    const splitMembers = expense.splitMembers || expense.members?.map(m => parseInt(m)) || [];
    const customAmounts: Record<string, string> = {};

    // Pre-fill custom amounts from stored breakdown if present
    if (expense.splitBreakdown) {
      Object.entries(expense.splitBreakdown).forEach(([memberId, amount]) => {
        customAmounts[memberId] = amount.toString();
      });
    } else if (expense.splitType === 'custom' && expense.splitAmount) {
      // fallback to equal amounts for custom if breakdown missing
      splitMembers.forEach(memberId => {
        customAmounts[memberId.toString()] = expense.splitAmount?.toString() || '';
      });
    }

    setNewExpenseData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date.split('T')[0] || expense.date,
      paidBy: expense.paidById?.toString() || '',
      splitType: expense.splitType,
      selectedMembers: splitMembers.map(id => id.toString()),
      customAmounts
    });

    setShowAddExpenseModal(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!selectedGroup) return;
    const confirmDelete = window.confirm('Delete this expense?');
    if (!confirmDelete) return;

    try {
      await groupAPI.deleteExpense(expenseId);

      const updatedExpenses = (selectedGroup.expenses || []).filter(exp => exp.id !== expenseId);
      const deleted = selectedGroup.expenses?.find(exp => exp.id === expenseId);
      const updatedGroup = {
        ...selectedGroup,
        expenses: updatedExpenses,
        totalExpense: (selectedGroup.totalExpense || 0) - (deleted?.amount || 0)
      };

      setSelectedGroup(updatedGroup);
      setGroups(groups.map(g => g.id === selectedGroup.id ? updatedGroup : g));

      await reloadGroups(selectedGroup.id.toString());
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  if (loading) {
    return <div className="group-expenses-container"><p>Loading groups...</p></div>;
  }

  return (
    <div className="group-expenses-container">
      <div className="group-header">
        <h1>👥 Group Expenses</h1>
        <p>Manage shared expenses and track who owes whom</p>
      </div>

      {/* Tabs */}
      <div className="tab-buttons">
        <button 
          className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          📊 Groups
        </button>
        <button 
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          ➕ Create Group
        </button>
      </div>

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="groups-section">
          {/* Groups List */}
          <div className="groups-sidebar">
            <h2>Your Groups</h2>
            <div className="groups-list">
              {groups.length > 0 ? (
                groups.map(group => (
                  <div
                    key={group.id}
                    className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="group-item-header">
                      <h3>{group.name}</h3>
                      <span className="member-count">{group.members?.length || 0}</span>
                    </div>
                    <p className="group-desc">{group.description}</p>
                    <p className="group-total">Total: ₹{(group.totalExpense || 0).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No groups yet. Create one to get started!</p>
                </div>
              )}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowCreateGroupModal(true)}>
              ➕ New Group
            </button>
          </div>

          {/* Group Details */}
          {selectedGroup && (
            <div className="group-details">
              <div className="group-header-section">
                <div>
                  <h2>{selectedGroup.name}</h2>
                  <p>{selectedGroup.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" onClick={openEditGroupModal}>
                    ✏️ Edit Group
                  </button>
                  <button className="btn btn-secondary" style={{ backgroundColor: '#f8d7da', color: '#721c24' }} onClick={handleDeleteGroup}>
                    🗑 Delete Group
                  </button>
                  <button className="btn btn-primary" onClick={openAddExpenseModal}>
                    ➕ Add Expense
                  </button>
                </div>
              </div>

              {/* Members & Balances */}
              <div className="members-section">
                <h3>👥 Members & Balances</h3>
                <div className="members-grid">
                  {selectedGroup.members && selectedGroup.members.map(member => (
                    <div key={member.id} className={`member-card ${getBalanceColor(member.balance)}`}>
                      <div className="member-avatar">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <h4>{member.name}</h4>
                      <p className="member-email">{member.email}</p>
                      <div className={`balance ${getBalanceColor(member.balance)}`}>
                        {member.balance > 0 ? '💰 Gets back' : member.balance < 0 ? '💸 Owes' : '✓ Settled'}
                      </div>
                      <p className="balance-amount">₹{Math.abs(member.balance).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expenses */}
              <div className="expenses-section">
                <h3>📝 Expenses</h3>
                {selectedGroup.expenses && selectedGroup.expenses.length > 0 ? (
                  <div className="expenses-list">
                    {selectedGroup.expenses.map(expense => (
                      <div key={expense.id} className="expense-item">
                        <div className="expense-info">
                          <h4>{expense.description}</h4>
                          <p className="expense-meta">
                            <span className="category">{expense.category}</span>
                            <span className="date">{new Date(expense.date).toLocaleDateString()}</span>
                            <span className="paid-by">Paid by: {expense.paidBy}</span>
                          </p>
                        </div>
                        <div className="expense-amount">
                          <p>₹{expense.amount.toFixed(2)}</p>
                          <small>{expense.splitType === 'equal' ? 'Equal split' : 'Custom split'}</small>
                          <div className="expense-actions">
                            <button type="button" onClick={() => startEditExpense(expense)} className="link-btn">Edit</button>
                            <button type="button" onClick={() => handleDeleteExpense(expense.id)} className="link-btn danger">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No expenses yet in this group</p>
                  </div>
                )}
              </div>

              {/* Settlement Summary */}
              <div className="settlement-section">
                <h3>🤝 Settlement Summary</h3>
                <div className="settlement-info">
                  <p>Based on the current balances, here are the recommended settlements:</p>
                  <div className="settlement-suggestions">
                    {selectedGroup.members && selectedGroup.members.filter(m => m.balance < 0).map(owes => (
                      <div key={owes.id} className="settlement-item">
                        <span>{owes.name}</span>
                        <span className="arrow">→</span>
                        <span>
                          {selectedGroup.members.find(m => m.balance > 0)?.name || 'Member'}
                        </span>
                        <span className="amount">₹{Math.abs(owes.balance).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Group Tab */}
      {activeTab === 'create' && (
        <div className="create-group-form-container">
          <div className="create-group-form">
            <h2>Create New Group</h2>
            
            <div className="form-group">
              <label>Group Name *</label>
              <input
                type="text"
                placeholder="e.g., Vacation Trip"
                value={newGroupData.name}
                onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Describe what this group is for..."
                value={newGroupData.description}
                onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Add Members *</label>
              {newGroupData.members.map((member, idx) => (
                <div key={idx} className="member-input">
                  <input
                    type="text"
                    placeholder="Member name"
                    value={member}
                    onChange={(e) => {
                      const newMembers = [...newGroupData.members];
                      newMembers[idx] = e.target.value;
                      setNewGroupData({ ...newGroupData, members: newMembers });
                    }}
                  />
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newMembers = newGroupData.members.filter((_, i) => i !== idx);
                        setNewGroupData({ ...newGroupData, members: newMembers });
                      }}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setNewGroupData({ ...newGroupData, members: [...newGroupData.members, ''] })}
              >
                ➕ Add Another Member
              </button>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setActiveTab('groups')}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddGroup}>
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && selectedGroup && (
        <div className="modal-overlay" onClick={closeExpenseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Expense to {selectedGroup.name}</h2>
              <button className="close-btn" onClick={closeExpenseModal}>✕</button>
            </div>

            <form className="expense-form">
              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  placeholder="e.g., Dinner"
                  value={newExpenseData.description}
                  onChange={(e) => setNewExpenseData({ ...newExpenseData, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={newExpenseData.amount}
                    onChange={(e) => setNewExpenseData({ ...newExpenseData, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newExpenseData.category}
                    onChange={(e) => setNewExpenseData({ ...newExpenseData, category: e.target.value })}
                  >
                    <option value="Food">Food</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Transport">Transport</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Paid By</label>
                  <select
                    value={newExpenseData.paidBy}
                    onChange={(e) => setNewExpenseData({ ...newExpenseData, paidBy: e.target.value })}
                  >
                    <option value="">Select member</option>
                    {selectedGroup.members && selectedGroup.members.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={newExpenseData.date}
                    onChange={(e) => setNewExpenseData({ ...newExpenseData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Split Type</label>
                <select
                  value={newExpenseData.splitType}
                  onChange={(e) => setNewExpenseData({ ...newExpenseData, splitType: e.target.value as any })}
                >
                  <option value="equal">Equal Split</option>
                  <option value="custom">Custom Split</option>
                </select>
              </div>

              {/* Custom Split - Show member selection */}
              {newExpenseData.splitType === 'custom' && (
                <div className="form-group">
                  <label>Custom Split Amounts</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                    {selectedGroup.members && selectedGroup.members.map(member => (
                      <div key={member.id} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ flex: '1', fontWeight: '500' }}>{member.name}:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={newExpenseData.customAmounts[member.id.toString()] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow positive numbers
                            if (value === '' || parseFloat(value) >= 0) {
                              setNewExpenseData({
                                ...newExpenseData,
                                customAmounts: {
                                  ...newExpenseData.customAmounts,
                                  [member.id.toString()]: value
                                }
                              });
                            }
                          }}
                          style={{ 
                            width: '120px', 
                            padding: '8px', 
                            border: '1px solid #ccc', 
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const totalAmount = parseFloat(newExpenseData.amount) || 0;
                    const customTotal = Object.values(newExpenseData.customAmounts)
                      .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                    const isValid = totalAmount > 0 && Math.abs(customTotal - totalAmount) < 0.01;
                    
                    return (
                      <small style={{ 
                        color: isValid ? 'green' : 'red', 
                        marginTop: '8px', 
                        display: 'block',
                        fontWeight: '500'
                      }}>
                        {totalAmount === 0 
                          ? 'Enter total amount above first'
                          : isValid 
                            ? `✓ Total matches: ₹${customTotal.toFixed(2)} = ₹${totalAmount.toFixed(2)}`
                            : `✗ Total: ₹${customTotal.toFixed(2)} (must equal ₹${totalAmount.toFixed(2)})`
                        }
                      </small>
                    );
                  })()}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeExpenseModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleAddExpense}>
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroupModal && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowEditGroupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Group</h2>
              <button className="close-btn" onClick={() => setShowEditGroupModal(false)}>✕</button>
            </div>

            <form className="expense-form">
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Vacation Trip"
                  value={editGroupData.name}
                  onChange={(e) => setEditGroupData({ ...editGroupData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe what this group is for..."
                  value={editGroupData.description}
                  onChange={(e) => setEditGroupData({ ...editGroupData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Members (add new)</label>
                {editGroupData.members.map((member, idx) => (
                  <div key={idx} className="member-input">
                    <input
                      type="text"
                      placeholder="Member name"
                      value={member.name}
                      onChange={(e) => {
                        const newMembers = [...editGroupData.members];
                        newMembers[idx] = { ...newMembers[idx], name: e.target.value };
                        setEditGroupData({ ...editGroupData, members: newMembers });
                      }}
                    />
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const newMembers = editGroupData.members.filter((_, i) => i !== idx);
                          setEditGroupData({ ...editGroupData, members: newMembers });
                        }}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditGroupData({ ...editGroupData, members: [...editGroupData.members, { id: undefined, name: '' }] });
                  }}
                >
                  ➕ Add Member
                </button>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditGroupModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleUpdateGroup}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="modal-overlay" onClick={() => setShowCreateGroupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Group</h2>
              <button className="close-btn" onClick={() => setShowCreateGroupModal(false)}>✕</button>
            </div>

            <form className="expense-form">
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Vacation Trip"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe what this group is for..."
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Add Members *</label>
                {newGroupData.members.map((member, idx) => (
                  <div key={idx} className="member-input">
                    <input
                      type="text"
                      placeholder="Member name"
                      value={member}
                      onChange={(e) => {
                        const newMembers = [...newGroupData.members];
                        newMembers[idx] = e.target.value;
                        setNewGroupData({ ...newGroupData, members: newMembers });
                      }}
                    />
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newMembers = newGroupData.members.filter((_, i) => i !== idx);
                          setNewGroupData({ ...newGroupData, members: newMembers });
                        }}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateGroupModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleAddGroup}>
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
