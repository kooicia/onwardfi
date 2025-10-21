import React, { useState } from 'react';
import { Account, NetWorthEntry } from '../types';
import { convertCurrency, convertCurrencySync, formatCurrency, getExchangeRate, convertCurrencyWithEntry } from '../utils/currencyConverter';
import EmptyState from './EmptyState';

interface DailyEntryProps {
  accounts: Account[];
  entries: NetWorthEntry[];
  onEntriesChange: (entries: NetWorthEntry[]) => void;
  preferredCurrency: string;
  onEditAccounts?: () => void;
}

export default function DailyEntry({ accounts, entries, onEntriesChange, preferredCurrency, onEditAccounts }: DailyEntryProps) {
  const [accountValues, setAccountValues] = useState<{ [accountId: string]: number }>({});
  const [inputValues, setInputValues] = useState<{ [accountId: string]: string }>({});
  const [editingEntry, setEditingEntry] = useState<NetWorthEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [convertedValues, setConvertedValues] = useState<{ [accountId: string]: string }>({});

  // Shortcut to go to Settings > Accounts
  const handleGoToAccounts = () => {
    if (onEditAccounts) {
      onEditAccounts();
    } else {
      window.location.hash = '#settings-accounts';
    }
  };

  // Get existing entry for selected date
  const existingEntry = entries.find(entry => entry.date === selectedDate);

  // Initialize form with existing data or empty values
  React.useEffect(() => {
    if (existingEntry) {
      // Create a mapping that includes both existing and missing accounts
      const initialValues: { [accountId: string]: number } = {};
      const initialInputValues: { [accountId: string]: string } = {};
      accounts.forEach(account => {
        const value = existingEntry.accountValues[account.id] || 0;
        initialValues[account.id] = value;
        initialInputValues[account.id] = value.toString();
      });
      
      setAccountValues(initialValues);
      setInputValues(initialInputValues);
      setEditingEntry(existingEntry);
    } else {
      const initialValues: { [accountId: string]: number } = {};
      const initialInputValues: { [accountId: string]: string } = {};
      accounts.forEach(account => {
        initialValues[account.id] = 0;
        initialInputValues[account.id] = '';
      });
      setAccountValues(initialValues);
      setInputValues(initialInputValues);
      setEditingEntry(null);
    }
  }, [selectedDate, existingEntry, accounts]);

  React.useEffect(() => {
    accounts.forEach(account => {
      const value = accountValues[account.id] || 0;
      console.log(`[DEBUG] Triggering conversion for account ${account.name} (${account.currency}) with value=${value}, preferredCurrency=${preferredCurrency}, date=${selectedDate}`);
      if (account.currency !== preferredCurrency && value) {
        convertCurrencyWithEntry(value, account.currency, preferredCurrency, selectedDate)
          .then(converted => {
            console.log(`[DEBUG] Converted value for ${account.name}: ${value} ${account.currency} -> ${converted} ${preferredCurrency}`);
            setConvertedValues(prev => ({
              ...prev,
              [account.id]: formatCurrency(converted, preferredCurrency)
            }));
          })
          .catch(error => {
            console.error(`[DEBUG] Conversion failed for ${account.name}:`, error);
          });
      } else {
        setConvertedValues(prev => ({
          ...prev,
          [account.id]: formatCurrency(value, preferredCurrency)
        }));
      }
    });
  }, [accounts, accountValues, preferredCurrency, selectedDate]);

  const handleAccountValueChange = (accountId: string, value: string) => {
    // Update the input display value
    setInputValues(prev => ({
      ...prev,
      [accountId]: value
    }));
  };

  const handleAccountValueBlur = (accountId: string, value: string) => {
    let numValue: number;
    
    // Check if the input contains mathematical operators
    if (/[+\-*/().]/.test(value)) {
      try {
        // Safely evaluate the mathematical expression
        // Only allow basic math operations and numbers
        const sanitizedExpression = value.replace(/[^0-9\+\-\*\/\(\)\.]/g, '');
        numValue = Function(`"use strict"; return (${sanitizedExpression})`)();
        
        if (typeof numValue !== 'number' || isNaN(numValue) || !isFinite(numValue)) {
          // If calculation fails, keep the current value
          return;
        }
        
        // Update the input to show the calculated result
        setInputValues(prev => ({
          ...prev,
          [accountId]: numValue.toString()
        }));
      } catch (error) {
        // If calculation fails, keep the current value
        return;
      }
    } else {
      // Regular number parsing
      numValue = parseFloat(value) || 0;
    }
    
    setAccountValues(prev => ({
      ...prev,
      [accountId]: numValue
    }));
  };

  const calculateTotals = () => {
    let totalAssets = 0;
    let totalLiabilities = 0;

    accounts.forEach(account => {
      const value = accountValues[account.id] || 0;
      const convertedValue = convertCurrencySync(value, account.currency, preferredCurrency);
      
      if (account.type === 'asset') {
        totalAssets += convertedValue;
      } else {
        totalLiabilities += convertedValue;
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities
    };
  };

  const handleSave = async () => {
    // Fetch exchange rates for all currency pairs needed for this entry
    const exchangeRates: { [currencyPair: string]: number } = {};
    const uniqueCurrencies = Array.from(new Set(accounts.map(acc => acc.currency)));
    
    // Only fetch rates if we have multiple currencies
    if (uniqueCurrencies.length > 1) {
      try {
        // Fetch rates for each currency pair needed for conversion to preferred currency
        for (const currency of uniqueCurrencies) {
          if (currency !== preferredCurrency) {
            const rate = await getExchangeRate(currency, preferredCurrency, selectedDate);
            exchangeRates[`${currency}-${preferredCurrency}`] = rate;
            console.log(`[DEBUG] Fetched rate for ${currency}-${preferredCurrency} on ${selectedDate}:`, rate);
          }
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Continue with save even if rate fetching fails
      }
    }
    console.log('[DEBUG] All exchangeRates for entry:', exchangeRates);

    // Calculate totals using real-time rates
    let totalAssets = 0;
    let totalLiabilities = 0;

    for (const account of accounts) {
      const value = accountValues[account.id] || 0;
      if (account.currency === preferredCurrency) {
        if (account.type === 'asset') {
          totalAssets += value;
        } else {
          totalLiabilities += value;
        }
      } else {
        const rate = exchangeRates[`${account.currency}-${preferredCurrency}`];
        const convertedValue = rate ? value * rate : value; // Fallback to original value if rate not available
        console.log(`[DEBUG] Account ${account.name} (${account.currency}): value=${value}, rate=${rate}, convertedValue=${convertedValue}`);
        if (account.type === 'asset') {
          totalAssets += convertedValue;
        } else {
          totalLiabilities += convertedValue;
        }
      }
    }

    const netWorth = totalAssets - totalLiabilities;

    const newEntry: NetWorthEntry = {
      id: editingEntry?.id || Date.now().toString(),
      date: selectedDate,
      accountValues: { ...accountValues },
      totalAssets,
      totalLiabilities,
      netWorth,
      exchangeRates: Object.keys(exchangeRates).length > 0 ? exchangeRates : undefined
    };

    let updatedEntries;
    if (editingEntry) {
      // Update existing entry
      updatedEntries = entries.map(entry => 
        entry.id === editingEntry.id ? newEntry : entry
      );
    } else {
      // Add new entry
      updatedEntries = [...entries, newEntry];
    }

    onEntriesChange(updatedEntries);
  };

  const handleDelete = () => {
    if (!editingEntry) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete the entry for ${new Date(editingEntry.date).toLocaleDateString()}?\n\nThis action cannot be undone.`
    );
    if (confirmed) {
      const updatedEntries = entries.filter(entry => entry.id !== editingEntry.id);
      onEntriesChange(updatedEntries);
      setEditingEntry(null);
    }
  };

  const getAccountsByType = (type: 'asset' | 'liability') => {
    return accounts.filter(account => account.type === type);
  };

  const getAccountsByCategory = (type: 'asset' | 'liability') => {
    const typeAccounts = getAccountsByType(type);
    const categories: { [key: string]: Account[] } = {};
    
    typeAccounts.forEach(account => {
      const category = account.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(account);
    });
    
    return categories;
  };

  const getPreviousValue = (accountId: string) => {
    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const previousEntry = sortedEntries
      .filter(entry => entry.date < selectedDate)
      .pop();
    
    return previousEntry?.accountValues[accountId] || 0;
  };

  const copyFromPrevious = (accountId: string) => {
    const previousValue = getPreviousValue(accountId);
    setAccountValues(prev => ({
      ...prev,
      [accountId]: previousValue
    }));
    setInputValues(prev => ({
      ...prev,
      [accountId]: previousValue.toString()
    }));
  };

  const { totalAssets, totalLiabilities, netWorth } = calculateTotals();

  const renderAccountCard = (account: Account) => {
    const hasPreviousValue = getPreviousValue(account.id) > 0;
    
    return (
      <div key={account.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm truncate">{account.name}</div>
              <div className="text-xs text-gray-500">{account.currency}</div>
            </div>
            {hasPreviousValue && (
              <button
                onClick={() => copyFromPrevious(account.id)}
                className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                title={`Copy from previous entry (${formatCurrency(getPreviousValue(account.id), account.currency)})`}
              >
                Copy
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <input
            type="text"
            value={inputValues[account.id] || ''}
            onChange={(e) => handleAccountValueChange(account.id, e.target.value)}
            onBlur={(e) => handleAccountValueBlur(account.id, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0.00 or 80*1000"
            inputMode="text"
          />
          {accountValues[account.id] ? (
            <div className="text-xs text-gray-600">
              <div className="truncate">{formatCurrency(accountValues[account.id], account.currency)}</div>
              <div className="text-gray-400 truncate">
                = {convertedValues[account.id] || '...'}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 h-6"></div>
          )}
        </div>
      </div>
    );
  };

  const renderAccountSection = (type: 'asset' | 'liability', title: string) => {
    const categories = getAccountsByCategory(type);
    const allAccounts = getAccountsByType(type);
    
    if (allAccounts.length === 0) {
      return (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
          <p className="text-gray-500 italic">No {type} accounts defined. Add accounts in the Accounts tab first.</p>
        </div>
      );
    }

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
        {Object.entries(categories).map(([category, categoryAccounts]) => {
          const hasPreviousValues = categoryAccounts.some(account => getPreviousValue(account.id) > 0);
          
          return (
            <div key={category} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-gray-700">{category}</h4>
                <div className="flex gap-2">
                  {hasPreviousValues && (
                    <button
                      onClick={() => {
                        categoryAccounts.forEach(account => {
                          const previousValue = getPreviousValue(account.id);
                          if (previousValue > 0) {
                            copyFromPrevious(account.id);
                          }
                        });
                      }}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      title={`Copy all ${category} values from previous entry`}
                    >
                      Copy {category}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      categoryAccounts.forEach(account => {
                        setAccountValues(prev => ({
                          ...prev,
                          [account.id]: 0
                        }));
                        setInputValues(prev => ({
                          ...prev,
                          [account.id]: ''
                        }));
                      });
                    }}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                    title={`Clear all ${category} values`}
                  >
                    Clear {category}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categoryAccounts.map(renderAccountCard)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded shadow p-4 sm:p-6 mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold">Daily Net Worth Entry</h2>
          <button
            onClick={handleGoToAccounts}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border border-blue-200"
          >
            Edit/Configure Accounts
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2">
            <button
              onClick={() => {
                const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
                const previousEntry = sortedEntries
                  .filter(entry => entry.date < selectedDate)
                  .pop();
                if (previousEntry) {
                  setSelectedDate(previousEntry.date);
                }
              }}
              disabled={entries.filter(entry => entry.date < selectedDate).length === 0}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px]"
              title="Previous Entry"
            >
              ←
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 min-w-[50px]"
              title="Today"
            >
              Today
            </button>
            <button
              onClick={() => {
                const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
                const nextEntry = sortedEntries
                  .filter(entry => entry.date > selectedDate)
                  .shift();
                if (nextEntry) {
                  setSelectedDate(nextEntry.date);
                }
              }}
              disabled={entries.filter(entry => entry.date > selectedDate).length === 0}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px]"
              title="Next Entry"
            >
              →
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
            />
            {editingEntry && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm whitespace-nowrap"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>


      {accounts.length === 0 ? (
        <EmptyState
          variant="accounts"
          title="No Accounts to Track"
          description="You need to create some accounts first before you can track your daily net worth. Add your bank accounts, investments, loans, and other financial accounts to get started."
          action={{
            label: "Add Accounts",
            onClick: () => {
              window.location.hash = '#accounts';
            },
            variant: "primary"
          }}
        />
      ) : (
        <>
          {renderAccountSection('asset', 'Assets')}
          {renderAccountSection('liability', 'Liabilities')}

          <div className="border-t pt-4 sm:pt-6 mt-4 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Assets</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(totalAssets, preferredCurrency)}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Liabilities</div>
                <div className="text-2xl font-bold text-red-700">
                  {formatCurrency(totalLiabilities, preferredCurrency)}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${netWorth >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <div className="text-sm text-gray-600">Net Worth</div>
                <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatCurrency(netWorth, preferredCurrency)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {editingEntry ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </>
      )}
    </div>
  );
} 