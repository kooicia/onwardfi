import React, { useState } from 'react';
import { AccountCategory, ASSET_CATEGORIES, LIABILITY_CATEGORIES } from '../types';
import CurrencySelector from './CurrencySelector';
import AccountManagement from './AccountManagement';
import { Account, NetWorthEntry } from '../types';
import DataImportExport from './DataImportExport';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';

interface SettingsProps {
  assetCategories: AccountCategory[];
  liabilityCategories: AccountCategory[];
  onCategoriesChange: (assetCategories: AccountCategory[], liabilityCategories: AccountCategory[]) => void;
  preferredCurrency: string;
  onCurrencyChange: (currency: string) => void;
  onResetToNewUser?: () => void;
  accounts: Account[];
  onAccountsChange: (accounts: Account[]) => void;
  entries: NetWorthEntry[];
  onImportData: (accounts: Account[], entries: NetWorthEntry[]) => void;
  initialTab?: 'general' | 'categories' | 'accounts' | 'importexport' | 'danger';
}

export default function Settings({ 
  assetCategories, 
  liabilityCategories, 
  onCategoriesChange,
  preferredCurrency,
  onCurrencyChange,
  onResetToNewUser,
  accounts,
  onAccountsChange,
  entries,
  onImportData,
  initialTab
}: SettingsProps) {
  const [editingCategoryValue, setEditingCategoryValue] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'asset' | 'liability' | null>(null);
  const [formData, setFormData] = useState({
    value: '',
    label: ''
  });
  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'accounts' | 'importexport' | 'danger'>(initialTab || 'general');
  const { t } = useTranslation();
  // Remove the useEffect that syncs initialTab and activeTab
  // Only set activeTab from initialTab on mount

  const handleAddCategory = (type: 'asset' | 'liability') => {
    if (!formData.value || !formData.label) return;

    // Check if category value already exists
    const allCategories = [...assetCategories, ...liabilityCategories];
    if (allCategories.some(cat => cat.value === formData.value)) {
      alert('A category with this value already exists. Please use a different value.');
      return;
    }

    const newCategory: AccountCategory = {
      value: formData.value.toLowerCase().replace(/\s+/g, '-'),
      label: formData.label,
      type
    };

    if (type === 'asset') {
      onCategoriesChange([...assetCategories, newCategory], liabilityCategories);
    } else {
      onCategoriesChange(assetCategories, [...liabilityCategories, newCategory]);
    }

    setFormData({ value: '', label: '' });
    setEditingCategoryValue(null);
    setEditingType(null);
  };

  const handleEditCategory = (categoryValue: string) => {
    if (!formData.value || !formData.label) return;

    // Find the category being edited
    const editingCategory = [...assetCategories, ...liabilityCategories].find(cat => cat.value === categoryValue);
    if (!editingCategory) return;

    // Check if the new value conflicts with existing categories (excluding the current one)
    const allCategories = [...assetCategories, ...liabilityCategories];
    const conflictingCategory = allCategories.find(cat => 
      cat.value === formData.value.toLowerCase().replace(/\s+/g, '-') && 
      cat.value !== editingCategory.value
    );

    if (conflictingCategory) {
      alert('A category with this value already exists. Please use a different value.');
      return;
    }

    const updatedCategory: AccountCategory = {
      value: formData.value.toLowerCase().replace(/\s+/g, '-'),
      label: formData.label,
      type: editingCategory.type
    };

    if (editingCategory.type === 'asset') {
      const updatedAssetCategories = assetCategories.map(cat => 
        cat.value === editingCategory.value ? updatedCategory : cat
      );
      onCategoriesChange(updatedAssetCategories, liabilityCategories);
    } else {
      const updatedLiabilityCategories = liabilityCategories.map(cat => 
        cat.value === editingCategory.value ? updatedCategory : cat
      );
      onCategoriesChange(assetCategories, updatedLiabilityCategories);
    }

    setFormData({ value: '', label: '' });
    setEditingCategoryValue(null);
    setEditingType(null);
  };

  const handleDeleteCategory = (category: AccountCategory) => {
    const categoryName = category.label;
    const categoryType = category.type === 'asset' ? 'Asset' : 'Liability';
    
    if (window.confirm(`Are you sure you want to delete the "${categoryName}" ${categoryType.toLowerCase()} category?\n\nThis will affect all accounts using this category.`)) {
      if (category.type === 'asset') {
        const updatedCategories = assetCategories.filter(cat => cat.value !== category.value);
        onCategoriesChange(updatedCategories, liabilityCategories);
      } else {
        const updatedCategories = liabilityCategories.filter(cat => cat.value !== category.value);
        onCategoriesChange(assetCategories, updatedCategories);
      }
    }
  };

  const startEdit = (category: AccountCategory) => {
    setEditingCategoryValue(category.value);
    setFormData({
      value: category.value,
      label: category.label
    });
  };

  const cancelEdit = () => {
    setEditingCategoryValue(null);
    setEditingType(null);
    setFormData({ value: '', label: '' });
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all categories to their default values?\n\nThis will remove all custom categories you have created.')) {
      onCategoriesChange(ASSET_CATEGORIES, LIABILITY_CATEGORIES);
    }
  };

  const renderCategoryRow = (category: AccountCategory) => {
    const isEditing = editingCategoryValue === category.value;
    
    if (isEditing) {
      return (
        <div key={category.value} className="bg-blue-50 p-3 rounded border border-blue-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t('categoryValue')}</label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., real-estate"
                disabled={true} // Don't allow editing the value once created
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('internalIdentifier')}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t('displayName')}</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Real Estate"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('nameShownToUsers')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEditCategory(category.value)}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              {t('save')}
            </button>
            <button
              onClick={cancelEdit}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={category.value} className="flex items-center justify-between bg-white p-3 rounded border">
        <div>
          <span className="font-medium">{category.label}</span>
          <span className="text-gray-500 ml-2 text-sm">({category.value})</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => startEdit(category)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('edit')}
          </button>
          <button
            onClick={() => handleDeleteCategory(category)}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    );
  };

  const renderAddForm = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">{t('addNewCategory')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('categoryValue')}</label>
          <input
            type="text"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., real-estate"
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('internalIdentifier')}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('displayName')}</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Real Estate"
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('nameShownToUsers')}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('type')}</label>
          <select
            value={editingType || ''}
            onChange={(e) => setEditingType(e.target.value as 'asset' | 'liability')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('selectType')}</option>
            <option value="asset">{t('asset')}</option>
            <option value="liability">{t('liability')}</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => editingType && handleAddCategory(editingType)}
          disabled={!formData.value || !formData.label || !editingType}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('addCategory')}
        </button>
        <button
          onClick={cancelEdit}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );

  const renderCategorySection = (categories: AccountCategory[], title: string, type: 'asset' | 'liability') => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {!editingCategoryValue && !editingType && (
          <button
            onClick={() => {
              setEditingType(type);
              setFormData({ value: '', label: '' });
            }}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            {type === 'asset' ? t('addAssetCategory') : t('addLiabilityCategory')}
          </button>
        )}
      </div>
      {categories.length === 0 ? (
        <p className="text-gray-500 italic">{t('noCategoriesDefined')}</p>
      ) : (
        <div className="space-y-2">
          {categories.map(category => renderCategoryRow(category))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded shadow p-4 sm:p-6 mt-4">
      {/* Tab Bar */}
      <div className="flex border-b mb-6 gap-2">
        <button
          className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-700'}`}
          onClick={() => setActiveTab('general')}
        >
          {t('generalSettings')}
        </button>
        <button
          className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors ${activeTab === 'categories' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-700'}`}
          onClick={() => setActiveTab('categories')}
        >
          {t('accountCategories')}
        </button>
        <button
          className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors ${activeTab === 'accounts' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-700'}`}
          onClick={() => setActiveTab('accounts')}
        >
          {t('accounts')}
        </button>
        <button
          className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors ${activeTab === 'importexport' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-700'}`}
          onClick={() => setActiveTab('importexport')}
        >
          {t('importExport')}
        </button>
        {onResetToNewUser && (
          <button
            className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors ${activeTab === 'danger' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500 hover:text-red-700'}`}
            onClick={() => setActiveTab('danger')}
          >
            {t('dangerZone')}
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">{t('generalSettings')}</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('preferredCurrency')}</label>
            <div className="max-w-xs mb-1">
              <CurrencySelector
                selectedCurrency={preferredCurrency}
                onCurrencyChange={onCurrencyChange}
              />
            </div>
            <p className="text-xs text-gray-600 mb-3">{t('currencyDescription')}</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('language')}</label>
            <div className="max-w-xs">
              <LanguageSelector />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">{t('accountCategories')}</h3>
            <p className="text-sm text-blue-700 mb-2">
              {t('importantNotes')}
            </p>
            {!editingCategoryValue && !editingType && (
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 mb-4"
              >
                {t('resetToDefaults')}
              </button>
            )}
          </div>
          {editingType && renderAddForm()}
          {renderCategorySection(assetCategories, t('assetCategories'), 'asset')}
          {renderCategorySection(liabilityCategories, t('liabilityCategories'), 'liability')}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">{t('importantNotes')}</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• {t('internalIdentifier')}</li>
              <li>• {t('nameShownToUsers')}</li>
              <li>• {t('resetCategoriesConfirm')}</li>
            </ul>
          </div>
        </>
      )}

      {activeTab === 'accounts' && (
        <AccountManagement
          accounts={accounts}
          onAccountsChange={onAccountsChange}
          assetCategories={assetCategories}
          liabilityCategories={liabilityCategories}
        />
      )}

      {activeTab === 'importexport' && (
        <DataImportExport
          accounts={accounts}
          entries={entries}
          onImportData={onImportData}
          preferredCurrency={preferredCurrency}
        />
      )}

      {activeTab === 'danger' && onResetToNewUser && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-700 mb-3">
            This action will clear all your data and reset you to a new user with predefined accounts. 
            This cannot be undone.
          </p>
          <button
            onClick={() => {
              if (window.confirm('This will clear all your data and reset you to a new user with predefined accounts. This action cannot be undone. Continue?')) {
                onResetToNewUser();
              }
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reset to New User
          </button>
        </div>
      )}
    </div>
  );
} 