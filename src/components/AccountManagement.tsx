import React, { useState, useEffect, useRef } from 'react';
import { Account, AccountCategory, CURRENCIES } from '../types';
import EmptyState from './EmptyState';

interface AccountManagementProps {
  accounts: Account[];
  onAccountsChange: (accounts: Account[]) => void;
  assetCategories: AccountCategory[];
  liabilityCategories: AccountCategory[];
}

export default function AccountManagement({ accounts, onAccountsChange, assetCategories, liabilityCategories }: AccountManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    currency: 'USD'
  });

  // Handle click outside to close the More menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

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

  const handleEditAccount = (accountId: string) => {
    if (!formData.name || !formData.category) return;

    const updatedAccounts = accounts.map(acc => 
      acc.id === accountId 
        ? { ...acc, name: formData.name, category: formData.category, currency: formData.currency }
        : acc
    );

    onAccountsChange(updatedAccounts);
    setFormData({ name: '', category: '', currency: 'USD' });
    setEditingAccountId(null);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      onAccountsChange(accounts.filter(acc => acc.id !== accountId));
    }
  };

  const handleDeleteAllPredefinedAccounts = () => {
    // Delete all accounts that have predefined IDs (start with 'predef-')
    const accountsToDelete = accounts.filter(acc => acc.id.startsWith('predef-'));
    
    console.log('Accounts to delete:', accountsToDelete.map(acc => acc.name));
    console.log('Total accounts:', accounts.length);
    console.log('Accounts to delete count:', accountsToDelete.length);
    
    if (accountsToDelete.length === 0) {
      alert('No predefined accounts found to delete.');
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${accountsToDelete.length} predefined accounts?\n\nAccounts to be deleted:\n${accountsToDelete.map(acc => `• ${acc.name}`).join('\n')}\n\nThis action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      const filteredAccounts = accounts.filter(acc => 
        !accountsToDelete.some(toDelete => toDelete.id === acc.id)
      );
      
      onAccountsChange(filteredAccounts);
      alert(`Successfully deleted ${accountsToDelete.length} predefined accounts.`);
    }
  };

  const handleDeleteAllAccounts = () => {
    const confirmMessage = `Are you sure you want to delete ALL ${accounts.length} accounts?\n\nThis will permanently remove all your accounts and cannot be undone.\n\nPlease make sure you have backed up your data before proceeding.`;
    
    if (window.confirm(confirmMessage)) {
      onAccountsChange([]);
      alert(`Successfully deleted all ${accounts.length} accounts.`);
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
    setEditingAccountId(account.id);
    setFormData({
      name: account.name,
      category: account.category,
      currency: account.currency
    });
  };

  const cancelEdit = () => {
    setEditingAccountId(null);
    setFormData({ name: '', category: '', currency: 'USD' });
    setShowAddForm(false);
  };

  const getAccountsByCategory = (categoryValue: string) => {
    return accounts.filter(acc => acc.category === categoryValue);
  };

  const hasPredefinedAccounts = () => {
    return accounts.some(acc => acc.id.startsWith('predef-'));
  };

  const renderAccountRow = (account: Account) => {
    const isEditing = editingAccountId === account.id;
    
    if (isEditing) {
      return (
        <div key={account.id} className="bg-blue-50 p-3 rounded border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Account Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Account name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>{curr.name} ({curr.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEditAccount(account.id)}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    const isPredefined = account.id.startsWith('predef-');
    
    return (
      <div key={account.id} className={`flex items-center justify-between p-3 rounded border ${isPredefined ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <span className="font-medium">{account.name}</span>
          {isPredefined && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              Predefined
            </span>
          )}
          <span className="text-gray-500">({account.currency})</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => startEdit(account)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            title={isPredefined ? "Edit predefined account" : "Edit account"}
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteAccount(account.id)}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            title={isPredefined ? "Delete predefined account" : "Delete account"}
          >
            Delete
          </button>
        </div>
      </div>
    );
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
                {categoryAccounts.map(account => renderAccountRow(account))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderAddForm = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Add New Account</h3>
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
          onClick={handleAddAccount}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Account
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
        {!showAddForm && !editingAccountId && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Account
            </button>
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
              >
                More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleDeleteAllPredefinedAccounts();
                        setShowMoreMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete All Predefined Accounts
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteAllAccounts();
                        setShowMoreMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete All Accounts ({accounts.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddForm && renderAddForm()}

      {accounts.length === 0 ? (
        <EmptyState
          variant="accounts"
          title="No Accounts Yet"
          description="Start building your financial picture by adding your accounts. Track your assets like bank accounts, investments, and properties, as well as liabilities like loans and credit cards."
          action={{
            label: "Add Your First Account",
            onClick: () => setShowAddForm(true),
            variant: "primary"
          }}
          showSteps={true}
          steps={[
            "Add your bank accounts and cash holdings",
            "Include investment accounts and retirement funds",
            "Add real estate and other valuable assets",
            "Don't forget to include loans, mortgages, and credit card debt"
          ]}
        />
      ) : hasPredefinedAccounts() && accounts.filter(acc => !acc.id.startsWith('predef-')).length === 0 ? (
        <EmptyState
          variant="accounts"
          title="Predefined Accounts Ready"
          description="We've set up some common accounts to help you get started. These accounts are marked with a 'Predefined' badge and can be edited or deleted as needed."
          action={{
            label: "Add Custom Account",
            onClick: () => setShowAddForm(true),
            variant: "primary"
          }}
          secondaryAction={{
            label: "Start Daily Entry",
            onClick: () => window.location.href = '#entry',
            variant: "outline"
          }}
          showSteps={true}
          steps={[
            "Review the predefined accounts below (marked with blue badges)",
            "Click 'Edit' to rename or modify any predefined account",
            "Add your own custom accounts for a complete financial picture",
            "Start tracking your daily net worth with the Daily Entry tab"
          ]}
        />
      ) : (
        <>
          {renderCategorySection(assetCategories, 'Assets')}
          {renderCategorySection(liabilityCategories, 'Liabilities')}
        </>
      )}
    </div>
  );
} 