import React, { useState, useEffect } from "react";
import AccountManagement from "./components/AccountManagement";
import DailyEntry from "./components/DailyEntry";
import HistoryAndCharts from "./components/HistoryAndCharts";
import DataManagement from "./components/DataManagement";
import DataImportExport from "./components/DataImportExport";
import CurrencySelector from "./components/CurrencySelector";
import Settings from "./components/Settings";
import Auth from "./components/Auth";
import FIRECalculator from "./components/FIRECalculator";
import EmptyState from "./components/EmptyState";
import { Account, NetWorthEntry, AccountCategory, ASSET_CATEGORIES, LIABILITY_CATEGORIES } from "./types";
import "./App.css";


// import { auth } from "./firebase";
// import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";

function App() {
  // const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [page, setPage] = useState("history");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<NetWorthEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');
  const [assetCategories, setAssetCategories] = useState<AccountCategory[]>(ASSET_CATEGORIES);
  const [liabilityCategories, setLiabilityCategories] = useState<AccountCategory[]>(LIABILITY_CATEGORIES);

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
    }
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

  const handleUpdateEntryValue = (entryId: string, accountId: string, newValue: number) => {
    const updatedEntries = entries.map(entry => {
      if (entry.id === entryId) {
        const updatedAccountValues = { ...entry.accountValues };
        updatedAccountValues[accountId] = newValue;
        
        // Recalculate totals
        let totalAssets = 0;
        let totalLiabilities = 0;
        
        Object.entries(updatedAccountValues).forEach(([accId, value]) => {
          const account = accounts.find(acc => acc.id === accId);
          if (account) {
            if (account.type === 'asset') {
              totalAssets += value;
            } else {
              totalLiabilities += value;
            }
          }
        });
        
        return {
          ...entry,
          accountValues: updatedAccountValues,
          totalAssets,
          totalLiabilities,
          netWorth: totalAssets - totalLiabilities
        };
      }
      return entry;
    });
    
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
          <h1 className="text-xl sm:text-2xl font-bold text-center mb-6 text-blue-700">
            FIRE Net Worth Tracker
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
      <header className="bg-white shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div className="font-bold text-xl sm:text-2xl text-blue-700">FIRE Net Worth Tracker</div>
          <div className="flex items-center gap-4">
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
      <nav className="flex flex-wrap gap-2 bg-blue-50 px-4 py-2 overflow-x-auto">
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "history" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("history")}
        >
          Dashboard
        </button>
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "entry" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("entry")}
        >
          Daily Entry
        </button>
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "accounts" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("accounts")}
        >
          Accounts
        </button>
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "data" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("data")}
        >
          Data Management
        </button>
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "importexport" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("importexport")}
        >
          Import/Export
        </button>
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "settings" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("settings")}
        >
          Settings
        </button>
        <button 
          className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md whitespace-nowrap ${
            page === "firecalculator" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          }`} 
          onClick={() => setPage("firecalculator")}
        >
          FIRE Calculator
        </button>
      </nav>
      <main className="p-2 sm:p-4 max-w-6xl mx-auto">
        {/* Welcome state for new users */}
        {accounts.length > 0 && entries.length === 0 && page === "history" && (
          <div className="bg-white rounded shadow p-6 mt-4">
            <EmptyState
              variant="welcome"
              title="Welcome to Your FIRE Journey!"
              description="We've set up some common accounts to help you get started. Add your first daily entry to begin tracking your path to financial independence."
              action={{
                label: "Add Your First Daily Entry",
                onClick: () => setPage("entry"),
                variant: "primary"
              }}
              secondaryAction={{
                label: "Learn About FIRE",
                onClick: () => setPage("firecalculator"),
                variant: "outline"
              }}
              showSteps={true}
              steps={[
                "We've created common accounts like Emergency Fund, Checking Account, and Credit Card",
                "Add your first daily entry with current account balances",
                "Monitor your progress with charts and trends",
                "Use the FIRE calculator to set your financial independence goals"
              ]}
            />
          </div>
        )}

        {page === "entry" && (
          <DailyEntry 
            accounts={accounts}
            entries={entries}
            onEntriesChange={setEntries}
            preferredCurrency={preferredCurrency}
          />
        )}
        {page === "accounts" && (
          <AccountManagement 
            accounts={accounts} 
            onAccountsChange={setAccounts}
            assetCategories={assetCategories}
            liabilityCategories={liabilityCategories}
          />
        )}
        {page === "history" && (
          <HistoryAndCharts 
            entries={entries}
            accounts={accounts}
            preferredCurrency={preferredCurrency}
            onUpdateEntryValue={handleUpdateEntryValue}
          />
        )}
        {page === "data" && (
          <DataManagement
            entries={entries}
            onClearEntries={handleClearEntries}
            onClearAllData={handleClearAllData}
          />
        )}
        {page === "importexport" && (
          <DataImportExport
            accounts={accounts}
            entries={entries}
            onImportData={handleImportData}
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
          />
        )}
        {page === "firecalculator" && (
          <FIRECalculator
            preferredCurrency={preferredCurrency}
          />
        )}
      </main>
    </div>
  );
}

export default App;
