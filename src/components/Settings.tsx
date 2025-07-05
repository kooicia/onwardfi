import React, { useState } from 'react';
import { AccountCategory, ASSET_CATEGORIES, LIABILITY_CATEGORIES } from '../types';
import CurrencySelector from './CurrencySelector';

interface SettingsProps {
  assetCategories: AccountCategory[];
  liabilityCategories: AccountCategory[];
  onCategoriesChange: (assetCategories: AccountCategory[], liabilityCategories: AccountCategory[]) => void;
  preferredCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

export default function Settings({ 
  assetCategories, 
  liabilityCategories, 
  onCategoriesChange,
  preferredCurrency,
  onCurrencyChange
}: SettingsProps) {
  const [editingCategory, setEditingCategory] = useState<AccountCategory | null>(null);
  const [editingType, setEditingType] = useState<'asset' | 'liability' | null>(null);
  const [formData, setFormData] = useState({
    value: '',
    label: ''
  });

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
    setEditingCategory(null);
    setEditingType(null);
  };

  const handleEditCategory = () => {
    if (!editingCategory || !formData.value || !formData.label) return;

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
    setEditingCategory(null);
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
    setEditingCategory(category);
    setEditingType(category.type);
    setFormData({
      value: category.value,
      label: category.label
    });
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditingType(null);
    setFormData({ value: '', label: '' });
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all categories to their default values?\n\nThis will remove all custom categories you have created.')) {
      onCategoriesChange(ASSET_CATEGORIES, LIABILITY_CATEGORIES);
    }
  };

  const renderCategoryForm = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {editingCategory ? 'Edit Category' : 'Add New Category'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category Value</label>
          <input
            type="text"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., real-estate"
            disabled={!!editingCategory} // Don't allow editing the value once created
          />
          <p className="text-xs text-gray-500 mt-1">
            This is the internal identifier (auto-converted to lowercase with hyphens)
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Real Estate"
          />
          <p className="text-xs text-gray-500 mt-1">
            This is the name shown to users
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={editingType || ''}
            onChange={(e) => setEditingType(e.target.value as 'asset' | 'liability')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!!editingCategory} // Don't allow changing type once created
          >
            <option value="">Select type</option>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={editingCategory ? handleEditCategory : () => editingType && handleAddCategory(editingType)}
          disabled={!formData.value || !formData.label || !editingType}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {editingCategory ? 'Update Category' : 'Add Category'}
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

  const renderCategorySection = (categories: AccountCategory[], title: string, type: 'asset' | 'liability') => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {!editingCategory && (
          <button
            onClick={() => {
              setEditingType(type);
              setFormData({ value: '', label: '' });
            }}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add {type === 'asset' ? 'Asset' : 'Liability'} Category
          </button>
        )}
      </div>
      {categories.length === 0 ? (
        <p className="text-gray-500 italic">No {type} categories defined</p>
      ) : (
        <div className="space-y-2">
          {categories.map(category => (
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
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCategory(category)}
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

  return (
    <div className="bg-white rounded shadow p-6 mt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Settings</h2>
        {!editingCategory && (
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Reset to Defaults
          </button>
        )}
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Account Categories</h3>
        <p className="text-sm text-blue-700 mb-2">
          Configure the categories available for creating accounts. Categories are used to group similar accounts together.
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Currency for Totals</label>
          <div className="max-w-xs">
            <CurrencySelector
              selectedCurrency={preferredCurrency}
              onCurrencyChange={onCurrencyChange}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">This currency will be used to display all totals and net worth. All account values will be converted to this currency for summary calculations.</p>
        </div>
      </div>

      {(editingCategory || editingType) && renderCategoryForm()}

      {renderCategorySection(assetCategories, 'Asset Categories', 'asset')}
      {renderCategorySection(liabilityCategories, 'Liability Categories', 'liability')}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Category values are used internally and should be unique</li>
          <li>• Display names are what users see when creating accounts</li>
          <li>• Deleting a category may affect existing accounts using that category</li>
          <li>• You can reset to default categories at any time</li>
        </ul>
      </div>
    </div>
  );
} 