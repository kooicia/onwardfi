import React, { useState } from 'react';
import { Account, AccountCategory, CURRENCIES } from '../types';

interface AccountManagementProps {
  accounts: Account[];
  onAccountsChange: (accounts: Account[]) => void;
  assetCategories: AccountCategory[];
  liabilityCategories: AccountCategory[];
}

export default function AccountManagement({ accounts, onAccountsChange, assetCategories, liabilityCategories }: AccountManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    currency: 'USD'
  });

  const handleAddAccount = () => {
    if (!formData.name || !formData.category) return;

    const category = [...assetCategories, ...liabilityCategories].find(cat => cat.value === formData.category);
    if (!category) return;

    const newAccount: Account = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      currency: formData.currency,
      type: category.type
    };

    onAccountsChange([...accounts, newAccount]);
    setFormData({ name: '', category: '', currency: 'USD' });
    setShowAddForm(false);
  };

  const handleEditAccount = () => {
    if (!editingAccount || !formData.name || !formData.category) return;

    const updatedAccounts = accounts.map(acc => 
      acc.id === editingAccount.id 
        ? { ...acc, name: formData.name, category: formData.category, currency: formData.currency }
        : acc
    );

    onAccountsChange(updatedAccounts);
    setFormData({ name: '', category: '', currency: 'USD' });
    setEditingAccount(null);
  };

  const handleDeleteAccount = (accountId: string) => {
    onAccountsChange(accounts.filter(acc => acc.id !== accountId));
  };

  const handleDeleteAllPredefinedAccounts = () => {
    // Delete all accounts that have predefined names
    const predefinedNames = [
      'Emergency Fund', 'Stock Portfolio', 'Bitcoin', 'Primary Residence', 'Precious Metals',
      'Mortgage', 'Car Loan', 'Credit Card', 'Medical Debt', 'Student Loan', 'Personal Loan',
      'Investment Account', 'Savings Account', 'Checking Account', 'Retirement Account',
      'Sample', 'sample' // Also catch sample accounts
    ];
    
    // Find accounts that match predefined names
    const accountsToDelete = accounts.filter(acc => 
      predefinedNames.some(name => 
        acc.name.toLowerCase().includes(name.toLowerCase()) ||
        acc.name.toLowerCase().startsWith('sample-') ||
        acc.name.toLowerCase().startsWith('sample ')
      )
    );
    
    console.log('Accounts to delete:', accountsToDelete.map(acc => acc.name));
    console.log('Total accounts:', accounts.length);
    console.log('Accounts to delete count:', accountsToDelete.length);
    
    if (accountsToDelete.length === 0) {
      alert('No predefined accounts found to delete.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${accountsToDelete.length} predefined accounts?\n\nAccounts to be deleted:\n${accountsToDelete.map(acc => `• ${acc.name}`).join('\n')}\n\nThis action cannot be undone.`)) {
      const filteredAccounts = accounts.filter(acc => 
        !accountsToDelete.some(toDelete => toDelete.id === acc.id)
      );
      
      onAccountsChange(filteredAccounts);
      alert(`Successfully deleted ${accountsToDelete.length} predefined accounts.`);
    }
  };

  const handleDeleteAllAccountsInCategory = (categoryValue: string) => {
    const categoryAccounts = accounts.filter(acc => acc.category === categoryValue);
    const categoryName = [...assetCategories, ...liabilityCategories]
      .find(cat => cat.value === categoryValue)?.label || categoryValue;
    
    if (categoryAccounts.length === 0) {
      alert(`No accounts found in category: ${categoryName}`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete all ${categoryAccounts.length} accounts in the "${categoryName}" category? This action cannot be undone.`)) {
      const filteredAccounts = accounts.filter(acc => acc.category !== categoryValue);
      onAccountsChange(filteredAccounts);
      alert(`Deleted ${categoryAccounts.length} accounts from ${categoryName} category.`);
    }
  };

  const startEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      category: account.category,
      currency: account.currency
    });
  };

  const cancelEdit = () => {
    setEditingAccount(null);
    setFormData({ name: '', category: '', currency: 'USD' });
    setShowAddForm(false);
  };

  const getAccountsByCategory = (categoryValue: string) => {
    return accounts.filter(acc => acc.category === categoryValue);
  };

  const renderCategorySection = (categories: AccountCategory[], title: string) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      {categories.map(category => {
        const categoryAccounts = getAccountsByCategory(category.value);
        return (
          <div key={category.value} className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-700">{category.label}</h4>
              {categoryAccounts.length > 0 && (
                <button
                  onClick={() => handleDeleteAllAccountsInCategory(category.value)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  title={`Delete all accounts in ${category.label} category`}
                >
                  Delete All ({categoryAccounts.length})
                </button>
              )}
            </div>
            {categoryAccounts.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No accounts in this category</p>
            ) : (
              <div className="space-y-2">
                {categoryAccounts.map(account => (
                  <div key={account.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div>
                      <span className="font-medium">{account.name}</span>
                      <span className="text-gray-500 ml-2">({account.currency})</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(account)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderForm = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {editingAccount ? 'Edit Account' : 'Add New Account'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Bank Account 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category</option>
            <optgroup label="Assets">
              {assetCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </optgroup>
            <optgroup label="Liabilities">
              {liabilityCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCIES.map(curr => (
              <option key={curr.code} value={curr.code}>{curr.name} ({curr.code})</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={editingAccount ? handleEditAccount : handleAddAccount}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {editingAccount ? 'Update Account' : 'Add Account'}
        </button>
        <button
          onClick={cancelEdit}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded shadow p-6 mt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Account Management</h2>
        {!showAddForm && !editingAccount && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Account
          </button>
        )}
      </div>

      {/* Bulk Actions Section */}
      {!showAddForm && !editingAccount && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Bulk Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDeleteAllPredefinedAccounts}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
              title="Delete all accounts with predefined names like 'Emergency Fund', 'Stock Portfolio', etc."
            >
              Delete All Predefined Accounts
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ALL ${accounts.length} accounts? This action cannot be undone.`)) {
                  onAccountsChange([]);
                  alert(`Successfully deleted all ${accounts.length} accounts.`);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              title="Delete all accounts"
            >
              Delete All Accounts ({accounts.length})
            </button>
            <div className="text-sm text-yellow-700">
              <strong>Note:</strong> These actions cannot be undone. Make sure to backup your data first.
            </div>
          </div>
        </div>
      )}

      {(showAddForm || editingAccount) && renderForm()}

      {renderCategorySection(assetCategories, 'Assets')}
      {renderCategorySection(liabilityCategories, 'Liabilities')}
    </div>
  );
} 