import React, { useState } from 'react';
import { AccountCategory, ASSET_CATEGORIES, LIABILITY_CATEGORIES, GoogleSheetsConnection } from '../types';
import CurrencySelector from './CurrencySelector';
import CategoriesAndAccounts from './CategoriesAndAccounts';
import { Account, NetWorthEntry } from '../types';
import DataImportExport from './DataImportExport';
import GoogleSheetsSync from './GoogleSheetsSync';
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
  googleSheetsConnection: GoogleSheetsConnection;
  onGoogleSheetsConnectionChange: (connection: GoogleSheetsConnection) => void;
  initialTab?: 'general' | 'setup' | 'importexport' | 'googlesheets' | 'danger';
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
  googleSheetsConnection,
  onGoogleSheetsConnectionChange,
  initialTab
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'setup' | 'importexport' | 'googlesheets' | 'danger'>(initialTab || 'general');
  const { t } = useTranslation();

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all categories to their default values?\n\nThis will remove all custom categories you have created.')) {
      onCategoriesChange(ASSET_CATEGORIES, LIABILITY_CATEGORIES);
    }
  };

  return (
    <div className="bg-white rounded shadow p-4 sm:p-6 mt-4">
      {/* Tab Bar */}
      <div className="flex border-b mb-6 gap-2 overflow-x-auto">
        <button
          className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'general' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-700'}`}
          onClick={() => setActiveTab('general')}
        >
          {t('generalSettings')}
        </button>
        <button
          className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'setup' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-700'}`}
          onClick={() => setActiveTab('setup')}
        >
          Categories & Accounts
        </button>
        <button
          className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'importexport' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-700'}`}
          onClick={() => setActiveTab('importexport')}
        >
          {t('importExport')}
        </button>
        <button
          className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'googlesheets' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-700'}`}
          onClick={() => setActiveTab('googlesheets')}
        >
          Google Sheets
        </button>
        {onResetToNewUser && (
          <button
            className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'danger' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500 hover:text-red-700'}`}
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

      {activeTab === 'setup' && (
        <>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Categories & Accounts Setup</h3>
            <p className="text-sm text-blue-700 mb-2">
              Set up your categories and accounts in one place. Each category contains related accounts.
            </p>
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              {t('resetToDefaults')}
            </button>
          </div>
          
          <CategoriesAndAccounts
            accounts={accounts}
            onAccountsChange={onAccountsChange}
            assetCategories={assetCategories}
            liabilityCategories={liabilityCategories}
            onCategoriesChange={onCategoriesChange}
          />
        </>
      )}

      {activeTab === 'importexport' && (
        <DataImportExport
          accounts={accounts}
          entries={entries}
          onImportData={onImportData}
          preferredCurrency={preferredCurrency}
        />
      )}

      {activeTab === 'googlesheets' && (
        <GoogleSheetsSync
          accounts={accounts}
          entries={entries}
          preferredCurrency={preferredCurrency}
          googleSheetsConnection={googleSheetsConnection}
          onConnectionChange={onGoogleSheetsConnectionChange}
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