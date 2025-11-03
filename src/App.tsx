import React, { useState, useEffect, useCallback } from "react";
import HistoryAndCharts from "./components/HistoryAndCharts";
import DataManagement from "./components/DataManagement";
import Settings from "./components/Settings";
import Auth from "./components/Auth";
import FIRECalculator from "./components/FIRECalculator";
import DailyEntry from "./components/DailyEntry";
import PortfolioAllocation from "./components/PortfolioAllocation";
import OnboardingWizard from "./components/OnboardingWizard";
import { Account, NetWorthEntry, AccountCategory, ASSET_CATEGORIES, LIABILITY_CATEGORIES, GoogleSheetsConnection } from "./types";
import "./App.css";
import LanguageSelector from "./components/LanguageSelector";
import { useTranslation } from "react-i18next";
import { syncToGoogleSheets } from "./utils/googleSheetsSync";


// import { auth } from "./firebase";
// import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";

function App() {
  // const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [page, setPage] = useState("history"); // 'history' is Dashboard
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<NetWorthEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');
  const [assetCategories, setAssetCategories] = useState<AccountCategory[]>(ASSET_CATEGORIES);
  const [liabilityCategories, setLiabilityCategories] = useState<AccountCategory[]>(LIABILITY_CATEGORIES);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'setup' | 'importexport' | 'googlesheets' | 'danger'>('setup');
  const [googleSheetsConnection, setGoogleSheetsConnection] = useState<GoogleSheetsConnection>({
    isConnected: false,
    autoSync: false,
  });
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [useSingleCurrency, setUseSingleCurrency] = useState<boolean>(true);
  const { t } = useTranslation();

  // Function to create predefined accounts for new users
  const createPredefinedAccounts = (): Account[] => {
    return [
      {
        id: 'predef-cash-1',
        name: 'Emergency Fund',
        type: 'asset',
        category: 'cash',
        currency: 'USD'
      },
      {
        id: 'predef-cash-2',
        name: 'Checking Account',
        type: 'asset',
        category: 'cash',
        currency: 'USD'
      },
      {
        id: 'predef-stocks-1',
        name: 'Stock Portfolio',
        type: 'asset',
        category: 'stocks',
        currency: 'USD'
      },
      {
        id: 'predef-stocks-2',
        name: 'Retirement Account (401k/IRA)',
        type: 'asset',
        category: 'stocks',
        currency: 'USD'
      },
      {
        id: 'predef-mortgage-1',
        name: 'Primary Residence Mortgage',
        type: 'liability',
        category: 'mortgage',
        currency: 'USD'
      },
      {
        id: 'predef-credit-1',
        name: 'Credit Card',
        type: 'liability',
        category: 'credit-card-debt',
        currency: 'USD'
      }
    ];
  };

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`fireAccounts_${currentUserId}`, JSON.stringify(accounts));
    }
  }, [accounts, currentUserId]);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`fireEntries_${currentUserId}`, JSON.stringify(entries));
    }
  }, [entries, currentUserId]);

  // Save preferred currency to localStorage whenever it changes
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`firePreferredCurrency_${currentUserId}`, preferredCurrency);
    }
  }, [preferredCurrency, currentUserId]);

  // Save custom categories to localStorage whenever they change
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`fireAssetCategories_${currentUserId}`, JSON.stringify(assetCategories));
      localStorage.setItem(`fireLiabilityCategories_${currentUserId}`, JSON.stringify(liabilityCategories));
    }
  }, [assetCategories, liabilityCategories, currentUserId]);

  // Save Google Sheets connection to localStorage whenever it changes
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`fireGoogleSheetsConnection_${currentUserId}`, JSON.stringify(googleSheetsConnection));
    }
  }, [googleSheetsConnection, currentUserId]);

  // Save useSingleCurrency to localStorage whenever it changes
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(`fireUseSingleCurrency_${currentUserId}`, useSingleCurrency.toString());
    }
  }, [useSingleCurrency, currentUserId]);

  // Check for existing login on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('fireUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setIsLoggedIn(true);
      setUserEmail(userData.email);
      setCurrentUserId(userData.id);
      
      // Load user-specific data
      const savedAccounts = localStorage.getItem(`fireAccounts_${userData.id}`);
      const savedEntries = localStorage.getItem(`fireEntries_${userData.id}`);
      const savedCurrency = localStorage.getItem(`firePreferredCurrency_${userData.id}`);
      const savedAssetCategories = localStorage.getItem(`fireAssetCategories_${userData.id}`);
      const savedLiabilityCategories = localStorage.getItem(`fireLiabilityCategories_${userData.id}`);
      const savedGoogleSheetsConnection = localStorage.getItem(`fireGoogleSheetsConnection_${userData.id}`);
      const savedSingleCurrency = localStorage.getItem(`fireUseSingleCurrency_${userData.id}`);
      const onboardingCompleted = localStorage.getItem(`onboardingCompleted_${userData.id}`);
      
      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts));
      }
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries));
      }
      if (savedCurrency) {
        setPreferredCurrency(savedCurrency);
      }
      if (savedAssetCategories) {
        setAssetCategories(JSON.parse(savedAssetCategories));
      }
      if (savedLiabilityCategories) {
        setLiabilityCategories(JSON.parse(savedLiabilityCategories));
      }
      if (savedGoogleSheetsConnection) {
        setGoogleSheetsConnection(JSON.parse(savedGoogleSheetsConnection));
      }
      if (savedSingleCurrency !== null) {
        setUseSingleCurrency(savedSingleCurrency === 'true');
      }
      
      // Check if onboarding should be triggered (new user or empty accounts)
      const parsedAccounts = savedAccounts ? JSON.parse(savedAccounts) : [];
      const parsedEntries = savedEntries ? JSON.parse(savedEntries) : [];
      const isNewUser = !savedAccounts && !savedEntries;
      const hasEmptyAccounts = parsedAccounts.length === 0;
      
      if ((isNewUser || hasEmptyAccounts) && !onboardingCompleted) {
        // Auto-launch onboarding for new users
        setIsOnboardingActive(true);
      }
    }
  }, []);

  // Handle hash-based navigation for Settings subtabs
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#settings-setup' || window.location.hash === '#settings-accounts') {
        setPage('settings');
        setSettingsInitialTab('setup');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    // Check on mount
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any email/password combination
      // In a real app, this would validate against Firebase Auth
      
      // Check if user already exists
      const existingUsers = localStorage.getItem('fireUsers');
      let users = existingUsers ? JSON.parse(existingUsers) : {};
      
      let userId: string;
      if (users[email]) {
        // User exists, use existing ID
        userId = users[email];
      } else {
        // New user, create new ID
        userId = Date.now().toString();
        users[email] = userId;
        localStorage.setItem('fireUsers', JSON.stringify(users));
      }
      
      const userData = { email, id: userId };
      localStorage.setItem('fireUser', JSON.stringify(userData));
      setIsLoggedIn(true);
      setUserEmail(email);
      setCurrentUserId(userId);
      
      // Load user-specific data
      const savedAccounts = localStorage.getItem(`fireAccounts_${userId}`);
      const savedEntries = localStorage.getItem(`fireEntries_${userId}`);
      const savedAssetCategories = localStorage.getItem(`fireAssetCategories_${userId}`);
      const savedLiabilityCategories = localStorage.getItem(`fireLiabilityCategories_${userId}`);
      const savedGoogleSheetsConnection = localStorage.getItem(`fireGoogleSheetsConnection_${userId}`);
      
      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts));
      } else {
        // Create predefined accounts for new users
        const predefinedAccounts = createPredefinedAccounts();
        setAccounts(predefinedAccounts);
        // Save the predefined accounts to localStorage
        localStorage.setItem(`fireAccounts_${userId}`, JSON.stringify(predefinedAccounts));
      }
      
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries));
      } else {
        setEntries([]); // Start with empty entries for new user
      }
      
      // Load or set default preferred currency
      const savedCurrency = localStorage.getItem(`firePreferredCurrency_${userId}`);
      if (savedCurrency) {
        setPreferredCurrency(savedCurrency);
      } else {
        setPreferredCurrency('USD'); // Default to USD for new users
      }

      // Load or set default categories
      if (savedAssetCategories) {
        setAssetCategories(JSON.parse(savedAssetCategories));
      } else {
        setAssetCategories(ASSET_CATEGORIES); // Default categories for new users
      }
      
      if (savedLiabilityCategories) {
        setLiabilityCategories(JSON.parse(savedLiabilityCategories));
      } else {
        setLiabilityCategories(LIABILITY_CATEGORIES); // Default categories for new users
      }

      if (savedGoogleSheetsConnection) {
        setGoogleSheetsConnection(JSON.parse(savedGoogleSheetsConnection));
      } else {
        setGoogleSheetsConnection({ isConnected: false, autoSync: false });
      }

      // Load useSingleCurrency preference
      const savedSingleCurrency = localStorage.getItem(`fireUseSingleCurrency_${userId}`);
      if (savedSingleCurrency !== null) {
        setUseSingleCurrency(savedSingleCurrency === 'true');
      }

      // Check if onboarding should be triggered (new user or empty accounts)
      let parsedAccounts: Account[] = [];
      if (savedAccounts) {
        parsedAccounts = JSON.parse(savedAccounts);
      } else if (!savedAccounts) {
        // New user with predefined accounts
        parsedAccounts = createPredefinedAccounts();
      }
      const parsedEntries = savedEntries ? JSON.parse(savedEntries) : [];
      const onboardingCompleted = localStorage.getItem(`onboardingCompleted_${userId}`);
      const isNewUser = !savedAccounts && !savedEntries;
      const hasEmptyAccounts = parsedAccounts.length === 0;
      
      if ((isNewUser || hasEmptyAccounts) && !onboardingCompleted) {
        // Auto-launch onboarding for new users
        setIsOnboardingActive(true);
      }
    } catch (error) {
      setAuthError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fireUser');
    setIsLoggedIn(false);
    setUserEmail('');
    setCurrentUserId('');
    setAuthError('');
    setAccounts([]);
    setEntries([]);
  };

  const handleClearEntries = (entryIds: string[]) => {
    const updatedEntries = entries.filter(entry => !entryIds.includes(entry.id));
    setEntries(updatedEntries);
  };

  const handleClearAllData = () => {
    // Only clear entries, keep accounts intact
    setEntries([]);
  };

  const handleResetToNewUser = () => {
    // Clear all localStorage data for current user
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('fire')) {
        localStorage.removeItem(key);
      }
    });
    // Reload the page
    window.location.reload();
  };

  // PATCHED: handleUpdateEntryValue now uses historical rates for recalculation
  const handleUpdateEntryValue = async (entryId: string, accountId: string, newValue: number) => {
    const { getExchangeRate, convertCurrencyWithEntry } = await import('./utils/currencyConverter');
    const updatedEntries = await Promise.all(entries.map(async entry => {
      if (entry.id === entryId) {
        const updatedAccountValues = { ...entry.accountValues };
        updatedAccountValues[accountId] = newValue;
        // Clone or initialize exchangeRates
        let updatedExchangeRates = { ...(entry.exchangeRates || {}) };
        const account = accounts.find(acc => acc.id === accountId);
        if (account && account.currency !== preferredCurrency) {
          const pair = `${account.currency}-${preferredCurrency}`;
          // If the rate is missing or invalid, fetch and store it
          if (!updatedExchangeRates[pair] || !isFinite(updatedExchangeRates[pair]) || updatedExchangeRates[pair] <= 0) {
            const rate = await getExchangeRate(account.currency, preferredCurrency, entry.date);
            updatedExchangeRates[pair] = rate;
          }
        }
        // Now recalculate totals using the updated exchangeRates
        let totalAssets = 0;
        let totalLiabilities = 0;
        for (const [accId, value] of Object.entries(updatedAccountValues)) {
          const acc = accounts.find(a => a.id === accId);
          if (acc) {
            const converted = await convertCurrencyWithEntry(
              value,
              acc.currency,
              preferredCurrency,
              entry.date,
              updatedExchangeRates
            );
            if (acc.type === 'asset') {
              totalAssets += converted;
            } else {
              totalLiabilities += converted;
            }
          }
        }
        return {
          ...entry,
          accountValues: updatedAccountValues,
          exchangeRates: Object.keys(updatedExchangeRates).length > 0 ? updatedExchangeRates : undefined,
          totalAssets,
          totalLiabilities,
          netWorth: totalAssets - totalLiabilities
        };
      }
      return entry;
    }));
    console.log('[handleUpdateEntryValue] Updated entries (with historic rates):', updatedEntries);
    setEntries(updatedEntries);
  };

  const handleCategoriesChange = (newAssetCategories: AccountCategory[], newLiabilityCategories: AccountCategory[]) => {
    setAssetCategories(newAssetCategories);
    setLiabilityCategories(newLiabilityCategories);
  };

  const handleImportData = (newAccounts: Account[], newEntries: NetWorthEntry[]) => {
    // Smart import: Map accounts by name and handle entries by date
    const finalAccounts = [...accounts]; // Start with existing accounts
    
    // Create a mapping from imported account IDs to final account IDs
    const accountIdMapping: { [oldId: string]: string } = {};
    
    // Map imported accounts to existing accounts by name, or create new ones
    newAccounts.forEach(importedAccount => {
      const existingAccount = accounts.find(acc => 
        acc.name.toLowerCase() === importedAccount.name.toLowerCase() && 
        acc.type === importedAccount.type &&
        acc.category === importedAccount.category
      );
      
      if (!existingAccount) {
        // Create new account with new ID
        const newAccount = {
          ...importedAccount,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
        finalAccounts.push(newAccount);
        accountIdMapping[importedAccount.id] = newAccount.id;
      } else {
        // Use existing account
        accountIdMapping[importedAccount.id] = existingAccount.id;
      }
    });
    
    // Handle entries: replace existing entries for same date, add new ones
    const updatedEntries = [...entries]; // Start with existing entries
    
    newEntries.forEach(importedEntry => {
      // Map account IDs in the entry to the final account IDs
      const mappedAccountValues: { [accountId: string]: number } = {};
      Object.entries(importedEntry.accountValues).forEach(([oldAccountId, value]) => {
        const newAccountId = accountIdMapping[oldAccountId];
        if (newAccountId) {
          mappedAccountValues[newAccountId] = value;
          console.log(`Mapped account ID ${oldAccountId} -> ${newAccountId} with value ${value}`);
        } else {
          console.warn(`No mapping found for account ID ${oldAccountId}`);
        }
      });
      
      // Check if there's already an entry for this date
      const existingEntryIndex = updatedEntries.findIndex(entry => entry.date === importedEntry.date);

      if (existingEntryIndex !== -1) {
        // Replace existing entry
        updatedEntries[existingEntryIndex] = {
          ...importedEntry,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          accountValues: mappedAccountValues
        };
        console.log(`Replaced entry for date: ${importedEntry.date}`);
      } else {
        // Add new entry
        updatedEntries.push({
          ...importedEntry,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          accountValues: mappedAccountValues
        });
        console.log(`Added new entry for date: ${importedEntry.date}`);
      }
    });
    
    console.log('Final accounts after import:', finalAccounts.map(acc => ({ id: acc.id, name: acc.name })));
    console.log('Final entries after import:', updatedEntries.map(entry => ({ date: entry.date, accountValues: entry.accountValues })));
    
    // Debug: Check if account IDs in entries match account IDs in accounts
    console.log('=== DEBUG: Account ID Matching ===');
    updatedEntries.forEach(entry => {
      console.log(`Entry for ${entry.date}:`);
      Object.entries(entry.accountValues).forEach(([accountId, value]) => {
        const account = finalAccounts.find(acc => acc.id === accountId);
        console.log(`  Account ID ${accountId}: ${value} - Found: ${account ? account.name : 'NOT FOUND'}`);
      });
    });
    
    setAccounts(finalAccounts);
    setEntries(updatedEntries);
  };

  // Auto-sync to Google Sheets when data changes
  useEffect(() => {
    const autoSyncToSheets = async () => {
      if (
        googleSheetsConnection.isConnected &&
        googleSheetsConnection.autoSync &&
        googleSheetsConnection.spreadsheetId &&
        accounts.length > 0 &&
        entries.length > 0
      ) {
        try {
          await syncToGoogleSheets(
            googleSheetsConnection.spreadsheetId,
            accounts,
            entries,
            preferredCurrency
          );
          console.log('Auto-synced to Google Sheets');
          
          // Update last sync date
          setGoogleSheetsConnection(prev => ({
            ...prev,
            lastSyncDate: new Date().toISOString(),
          }));
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    };

    // Debounce the sync to avoid too many API calls
    const timeoutId = setTimeout(() => {
      autoSyncToSheets();
    }, 2000); // Wait 2 seconds after the last change

    return () => clearTimeout(timeoutId);
  }, [accounts, entries, preferredCurrency, googleSheetsConnection.isConnected, googleSheetsConnection.autoSync, googleSheetsConnection.spreadsheetId]);

  // Handler for Google Sheets connection changes
  const handleGoogleSheetsConnectionChange = useCallback((connection: GoogleSheetsConnection) => {
    setGoogleSheetsConnection(connection);
  }, []);

  // Handler for onboarding completion
  const handleOnboardingComplete = useCallback((data: {
    preferredCurrency: string;
    useSingleCurrency: boolean;
    accounts: Account[];
    firstEntry?: NetWorthEntry;
  }) => {
    // Update currency preferences
    if (data.preferredCurrency) {
      setPreferredCurrency(data.preferredCurrency);
    }
    setUseSingleCurrency(data.useSingleCurrency);
    
    // Update accounts (with currency set based on single/multi mode)
    if (data.accounts.length > 0) {
      const updatedAccounts = data.accounts.map(account => ({
        ...account,
        currency: data.useSingleCurrency ? data.preferredCurrency : (account.currency || data.preferredCurrency)
      }));
      setAccounts(updatedAccounts);
    }
    
    // Create first entry if provided
    if (data.firstEntry) {
      setEntries([data.firstEntry]);
    }
    
    // Close onboarding
    setIsOnboardingActive(false);
    
    // Navigate to Dashboard
    setPage('history');
  }, []);

  // Handler for onboarding skip
  const handleOnboardingSkip = useCallback(() => {
    setIsOnboardingActive(false);
    setPage('history');
  }, []);

  // Handler to restart onboarding
  const handleRestartOnboarding = useCallback(() => {
    if (currentUserId) {
      // Clear onboarding completion flag
      localStorage.removeItem(`onboardingCompleted_${currentUserId}`);
      localStorage.removeItem(`onboardingCompletedDate_${currentUserId}`);
      localStorage.removeItem(`onboardingStep_${currentUserId}`);
      // Start onboarding
      setIsOnboardingActive(true);
    }
  }, [currentUserId]);

  // Auto-populate missing exchange rates for all entries on first load or when accounts/currency change
  useEffect(() => {
    async function fillMissingExchangeRates() {
      const { getExchangeRate } = await import('./utils/currencyConverter');
      let changed = false;
      const updatedEntries = await Promise.all(entries.map(async entry => {
        let updatedExchangeRates = { ...(entry.exchangeRates || {}) };
        let needsUpdate = false;
        for (const acc of accounts) {
          if (acc.currency !== preferredCurrency) {
            const pair = `${acc.currency}-${preferredCurrency}`;
            if (!updatedExchangeRates[pair] || !isFinite(updatedExchangeRates[pair]) || updatedExchangeRates[pair] <= 0) {
              const rate = await getExchangeRate(acc.currency, preferredCurrency, entry.date);
              updatedExchangeRates[pair] = rate;
              needsUpdate = true;
            }
          }
        }
        if (needsUpdate) {
          changed = true;
          return {
            ...entry,
            exchangeRates: Object.keys(updatedExchangeRates).length > 0 ? updatedExchangeRates : undefined
          };
        }
        return entry;
      }));
      if (changed) {
        setEntries(updatedEntries);
      }
    }
    if (entries.length > 0 && accounts.length > 0 && preferredCurrency) {
      fillMissingExchangeRates();
    }
  }, [entries, accounts, preferredCurrency]);

  // useEffect(() => {
  //   const unsub = onAuthStateChanged(auth, (u) => {
  //     setUser(u);
  //   });
  //   if (!auth.currentUser) {
  //     signInAnonymously(auth);
  //   }
  //   return () => unsub();
  // }, []);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-lg sm:text-xl font-bold text-center mb-6 text-blue-700">
            {t('appName')}
          </h1>
          <Auth
            onLogin={handleLogin}
            onLogout={handleLogout}
            isLoggedIn={isLoggedIn}
            userEmail={userEmail}
            isLoading={isLoading}
            error={authError}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Onboarding Wizard */}
      {isOnboardingActive && isLoggedIn && (
        <OnboardingWizard
          userId={currentUserId}
          accounts={accounts}
          entries={entries}
          preferredCurrency={preferredCurrency}
          useSingleCurrency={useSingleCurrency}
          assetCategories={assetCategories}
          liabilityCategories={liabilityCategories}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          onUpdateAccounts={setAccounts}
          onUpdateCurrency={setPreferredCurrency}
          onUpdateSingleCurrency={setUseSingleCurrency}
        />
      )}

      <header className="bg-white shadow p-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
          <div className="font-bold text-lg sm:text-xl text-blue-700">{t('appName')}</div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Auth
              onLogin={handleLogin}
              onLogout={handleLogout}
              isLoggedIn={isLoggedIn}
              userEmail={userEmail}
              isLoading={isLoading}
              error={authError}
            />
          </div>
        </div>
      </header>
      <nav className="flex flex-wrap gap-1 bg-blue-50 px-3 py-2 overflow-x-auto">
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "history" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("history")}
        >
          {t('dashboard')}
        </button>
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "entry" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("entry")}
        >
          {t('dailyEntry')}
        </button>
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "portfolio" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("portfolio")}
        >
          Portfolio
        </button>
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "data" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("data")}
        >
          {t('dataManagement')}
        </button>
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "firecalculator" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("firecalculator")}
        >
          {t('fireCalculator')}
        </button>
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "settings" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("settings")}
        >
          {t('settings')}
        </button>
      </nav>
      <main className="p-2 sm:p-4 max-w-6xl mx-auto">
        {page === "entry" && (
          <DailyEntry 
            accounts={accounts}
            entries={entries}
            onEntriesChange={setEntries}
            preferredCurrency={preferredCurrency}
            assetCategories={assetCategories}
            liabilityCategories={liabilityCategories}
            onEditAccounts={() => {
              setPage('settings');
              setSettingsInitialTab('setup');
            }}
          />
        )}
        {page === "history" && (
          <HistoryAndCharts 
            entries={entries}
            accounts={accounts}
            preferredCurrency={preferredCurrency}
            onUpdateEntryValue={handleUpdateEntryValue}
            onCreateFirstEntry={() => setPage('entry')}
            onStartOnboarding={handleRestartOnboarding}
            assetCategories={assetCategories}
            liabilityCategories={liabilityCategories}
          />
        )}
        {page === "data" && (
          <DataManagement
            entries={entries}
            accounts={accounts}
            onClearEntries={handleClearEntries}
            onClearAllData={handleClearAllData}
            onCreateFirstEntry={() => setPage('entry')}
            preferredCurrency={preferredCurrency}
          />
        )}
        {page === "settings" && (
          <Settings
            assetCategories={assetCategories}
            liabilityCategories={liabilityCategories}
            onCategoriesChange={handleCategoriesChange}
            preferredCurrency={preferredCurrency}
            onCurrencyChange={setPreferredCurrency}
            onResetToNewUser={handleResetToNewUser}
            accounts={accounts}
            onAccountsChange={setAccounts}
            entries={entries}
            onImportData={handleImportData}
            googleSheetsConnection={googleSheetsConnection}
            onGoogleSheetsConnectionChange={handleGoogleSheetsConnectionChange}
            initialTab={settingsInitialTab}
            onRestartOnboarding={handleRestartOnboarding}
          />
        )}
        {page === "firecalculator" && (
          <FIRECalculator
            preferredCurrency={preferredCurrency}
          />
        )}
        {page === "portfolio" && (
          <PortfolioAllocation
            accounts={accounts}
            entries={entries}
            preferredCurrency={preferredCurrency}
            assetCategories={assetCategories}
            liabilityCategories={liabilityCategories}
            onImportData={handleImportData}
          />
        )}
      </main>
    </div>
  );
}

export default App;
