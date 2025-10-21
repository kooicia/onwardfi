import React, { useState } from 'react';
import { Account, AccountCategory, CURRENCIES } from '../types';
import { useTranslation } from 'react-i18next';

interface CategoriesAndAccountsProps {
  accounts: Account[];
  onAccountsChange: (accounts: Account[]) => void;
  assetCategories: AccountCategory[];
  liabilityCategories: AccountCategory[];
  onCategoriesChange: (assetCategories: AccountCategory[], liabilityCategories: AccountCategory[]) => void;
}

export default function CategoriesAndAccounts({
  accounts,
  onAccountsChange,
  assetCategories,
  liabilityCategories,
  onCategoriesChange,
}: CategoriesAndAccountsProps) {
  const { t } = useTranslation();
  
  // State for editing
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [addingAccountToCategory, setAddingAccountToCategory] = useState<string | null>(null);
  const [addingCategoryType, setAddingCategoryType] = useState<'asset' | 'liability' | null>(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({ value: '', label: '' });
  const [accountForm, setAccountForm] = useState({ name: '', currency: 'USD' });

  // Get accounts for a specific category
  const getAccountsForCategory = (categoryValue: string, type: 'asset' | 'liability') => {
    return accounts.filter(acc => acc.category === categoryValue && acc.type === type);
  };

  // Category handlers
  const handleAddCategory = (type: 'asset' | 'liability') => {
    if (!categoryForm.value || !categoryForm.label) return;

    const newCategory: AccountCategory = {
      value: categoryForm.value.toLowerCase().replace(/\s+/g, '-'),
      label: categoryForm.label,
      type,
    };

    if (type === 'asset') {
      onCategoriesChange([...assetCategories, newCategory], liabilityCategories);
    } else {
      onCategoriesChange(assetCategories, [...liabilityCategories, newCategory]);
    }

    setCategoryForm({ value: '', label: '' });
    setAddingCategoryType(null);
  };

  const handleEditCategory = (oldValue: string, type: 'asset' | 'liability') => {
    if (!categoryForm.label) return;

    const categories = type === 'asset' ? assetCategories : liabilityCategories;
    const updatedCategories = categories.map(cat =>
      cat.value === oldValue ? { ...cat, label: categoryForm.label } : cat
    );

    if (type === 'asset') {
      onCategoriesChange(updatedCategories, liabilityCategories);
    } else {
      onCategoriesChange(assetCategories, updatedCategories);
    }

    setCategoryForm({ value: '', label: '' });
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryValue: string, type: 'asset' | 'liability') => {
    const categoryAccounts = getAccountsForCategory(categoryValue, type);
    
    if (categoryAccounts.length > 0) {
      alert(`Cannot delete category. Please delete or move the ${categoryAccounts.length} account(s) in this category first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete this category?`)) {
      if (type === 'asset') {
        onCategoriesChange(
          assetCategories.filter(cat => cat.value !== categoryValue),
          liabilityCategories
        );
      } else {
        onCategoriesChange(
          assetCategories,
          liabilityCategories.filter(cat => cat.value !== categoryValue)
        );
      }
    }
  };

  // Account handlers
  const handleAddAccount = (categoryValue: string, type: 'asset' | 'liability') => {
    if (!accountForm.name || !accountForm.currency) return;

    const newAccount: Account = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: accountForm.name,
      type,
      category: categoryValue,
      currency: accountForm.currency,
    };

    onAccountsChange([...accounts, newAccount]);
    setAccountForm({ name: '', currency: 'USD' });
    setAddingAccountToCategory(null);
  };

  const handleEditAccount = (accountId: string) => {
    if (!accountForm.name) return;

    const updatedAccounts = accounts.map(acc =>
      acc.id === accountId
        ? { ...acc, name: accountForm.name, currency: accountForm.currency }
        : acc
    );

    onAccountsChange(updatedAccounts);
    setAccountForm({ name: '', currency: 'USD' });
    setEditingAccount(null);
  };

  const handleDeleteAccount = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (window.confirm(`Are you sure you want to delete "${account?.name}"?`)) {
      onAccountsChange(accounts.filter(acc => acc.id !== accountId));
    }
  };

  const startEditCategory = (category: AccountCategory) => {
    setEditingCategory(category.value);
    setCategoryForm({ value: category.value, label: category.label });
  };

  const startEditAccount = (account: Account) => {
    setEditingAccount(account.id);
    setAccountForm({ name: account.name, currency: account.currency });
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditingAccount(null);
    setAddingAccountToCategory(null);
    setAddingCategoryType(null);
    setCategoryForm({ value: '', label: '' });
    setAccountForm({ name: '', currency: 'USD' });
  };

  // Render category section with its accounts
  const renderCategorySection = (category: AccountCategory) => {
    const categoryAccounts = getAccountsForCategory(category.value, category.type);
    const isEditingThisCategory = editingCategory === category.value;
    const isAddingAccount = addingAccountToCategory === category.value;

    return (
      <div key={category.value} className="border rounded-lg p-4 bg-white mb-4">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-3">
          {isEditingThisCategory ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={categoryForm.label}
                onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Category name"
                autoFocus
              />
              <button
                onClick={() => handleEditCategory(category.value, category.type)}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                {t('save')}
              </button>
              <button
                onClick={cancelEdit}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              >
                {t('cancel')}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">{category.label}</h3>
                <span className="text-sm text-gray-500">({categoryAccounts.length} accounts)</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEditCategory(category)}
                  className="px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.value, category.type)}
                  className="px-2 py-1 text-xs border border-gray-300 text-gray-500 rounded hover:bg-gray-50 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {/* Accounts List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-4">
          {categoryAccounts.map((account) => {
            const isEditingThisAccount = editingAccount === account.id;

            return (
              <div
                key={account.id}
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                {isEditingThisAccount ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Account name"
                    />
                    <select
                      value={accountForm.currency}
                      onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CURRENCIES.map(currency => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAccount(account.id)}
                        className="flex-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2">
                      <div className="font-semibold text-gray-800 mb-1">{account.name}</div>
                      <div className="inline-block text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border border-gray-300">
                        {account.currency}
                      </div>
                    </div>
                    <div className="flex gap-1 text-xs pt-2 border-t border-gray-200">
                      <button
                        onClick={() => startEditAccount(account)}
                        className="flex-1 px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="flex-1 px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          
          {/* Add Account Tile */}
          {isAddingAccount ? (
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 min-h-[120px]">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="e.g., Savings"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={accountForm.currency}
                    onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleAddAccount(category.value, category.type)}
                    disabled={!accountForm.name}
                    className="flex-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    Add
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingAccountToCategory(category.value)}
              className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center min-h-[120px] group"
            >
              <div className="text-3xl text-gray-300 group-hover:text-green-500 transition-colors mb-1">+</div>
              <div className="text-sm text-gray-500 group-hover:text-green-600 font-medium">Add Account</div>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render add category form
  const renderAddCategoryForm = (type: 'asset' | 'liability') => {
    if (addingCategoryType !== type) return null;

    return (
      <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
        <h4 className="text-md font-semibold mb-3">Add New {type === 'asset' ? 'Asset' : 'Liability'} Category</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
            <input
              type="text"
              value={categoryForm.value}
              onChange={(e) => setCategoryForm({ ...categoryForm, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., real-estate"
            />
            <p className="text-xs text-gray-500 mt-1">Lowercase, use dashes</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={categoryForm.label}
              onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Real Estate"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleAddCategory(type)}
            disabled={!categoryForm.value || !categoryForm.label}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Category
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
  };

  return (
    <div className="space-y-6">
      {/* Assets Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">💰 Asset Categories</h2>
          {!addingCategoryType && (
            <button
              onClick={() => setAddingCategoryType('asset')}
              className="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600"
            >
              + Add Category
            </button>
          )}
        </div>

        {renderAddCategoryForm('asset')}

        {assetCategories.length > 0 ? (
          <div>{assetCategories.map(renderCategorySection)}</div>
        ) : (
          <p className="text-gray-500 italic">No asset categories defined</p>
        )}
      </div>

      {/* Liabilities Section */}
      <div className="pt-6 border-t-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">💳 Liability Categories</h2>
          {!addingCategoryType && (
            <button
              onClick={() => setAddingCategoryType('liability')}
              className="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50 hover:border-red-400 hover:text-red-600"
            >
              + Add Category
            </button>
          )}
        </div>

        {renderAddCategoryForm('liability')}

        {liabilityCategories.length > 0 ? (
          <div>{liabilityCategories.map(renderCategorySection)}</div>
        ) : (
          <p className="text-gray-500 italic">No liability categories defined</p>
        )}
      </div>
    </div>
  );
}

