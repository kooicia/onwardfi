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
  initialTab?: 'setup' | 'importexport' | 'googlesheets' | 'danger';
  onRestartOnboarding?: () => void;
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
  initialTab,
  onRestartOnboarding
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'setup' | 'importexport' | 'googlesheets' | 'danger'>(initialTab || 'setup');
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
          className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'setup' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-700'}`}
          onClick={() => setActiveTab('setup')}
        >
          Setup
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
      {activeTab === 'setup' && (
        <>
          {/* General Settings Section */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">{t('generalSettings')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('preferredCurrency')}</label>
                <div className="max-w-xs mb-1">
                  <CurrencySelector
                    selectedCurrency={preferredCurrency}
                    onCurrencyChange={onCurrencyChange}
                  />
                </div>
                <p className="text-xs text-gray-600">{t('currencyDescription')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('language')}</label>
                <div className="max-w-xs">
                  <LanguageSelector />
                </div>
              </div>
            </div>
          </div>

          {/* Onboarding Section */}
          {onRestartOnboarding && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Getting Started</h3>
              <p className="text-sm text-green-700 mb-4">
                Restart the setup wizard to customize your account preferences, add accounts, or learn about features.
              </p>
              <button
                onClick={onRestartOnboarding}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Restart Setup Wizard
              </button>
            </div>
          )}

          {/* Categories & Accounts Section */}
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-800 mb-1">Categories & Accounts</h3>
                <p className="text-sm text-purple-700">
                  Set up your categories and accounts in one place. Each category contains related accounts.
                </p>
              </div>
              <button
                onClick={resetToDefaults}
                className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 hover:border-orange-400 hover:text-orange-600 whitespace-nowrap"
              >
                {t('resetToDefaults')}
              </button>
            </div>
          </div>
          
          <CategoriesAndAccounts
            accounts={accounts}
            onAccountsChange={onAccountsChange}
            assetCategories={assetCategories}
            liabilityCategories={liabilityCategories}
            onCategoriesChange={onCategoriesChange}
            entries={entries}
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