import React, { ReactElement, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { NetWorthEntry, Account } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currencyConverter';
import EmptyState from './EmptyState';

interface HistoryAndChartsProps {
  entries: NetWorthEntry[];
  accounts: Account[];
  preferredCurrency: string;
  onUpdateEntryValue: (entryId: string, accountId: string, newValue: number) => void;
  onCreateFirstEntry?: () => void;
}

export default function HistoryAndCharts({ entries, accounts, preferredCurrency, onUpdateEntryValue, onCreateFirstEntry }: HistoryAndChartsProps) {
  const [showOriginalCurrency, setShowOriginalCurrency] = useState(true);
  const [editingCell, setEditingCell] = useState<{ entryId: string; accountId: string; column: 'original' | 'usd' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Helper to recalculate assets, liabilities, and net worth for an entry
  function recalcTotals(entry: NetWorthEntry) {
    let assets = 0;
    let liabilities = 0;
    accounts.forEach(acc => {
      const value = entry.accountValues[acc.id] || 0;
      if (acc.type === 'asset') {
        assets += convertCurrency(value, acc.currency, preferredCurrency);
      } else if (acc.type === 'liability') {
        liabilities += convertCurrency(value, acc.currency, preferredCurrency);
      }
    });
    return {
      assets,
      liabilities,
      netWorth: assets - liabilities
    };
  }

  // Sort entries by date for proper chart display
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format data for chart (recalculate for preferred currency)
  const chartData = sortedEntries.map(entry => {
    const { assets, liabilities, netWorth } = recalcTotals(entry);
    return {
      date: new Date(entry.date).toLocaleDateString(),
      assets,
      liabilities,
      netWorth
    };
  });

  const formatCurrencyForDisplay = (value: number) => {
    return formatCurrency(value, preferredCurrency);
  };

  const handleCellClick = (entryId: string, accountId: string, column: 'original' | 'usd', currentValue: number) => {
    setEditingCell({ entryId, accountId, column });
    setEditValue(currentValue.toString());
  };

  const handleEditSave = () => {
    if (editingCell && editValue !== '') {
      let newValue: number;
      
      // Check if the input contains mathematical operators
      if (/[+\-*/().]/.test(editValue)) {
        try {
          // Safely evaluate the mathematical expression
          // Only allow basic math operations and numbers
          const sanitizedExpression = editValue.replace(/[^0-9\+\-\*\/\(\)\.]/g, '');
          newValue = new Function('return ' + sanitizedExpression)();
          
          if (typeof newValue !== 'number' || isNaN(newValue) || !isFinite(newValue)) {
            alert('Invalid mathematical expression. Please enter a valid calculation.');
            return;
          }
        } catch (error) {
          alert('Invalid mathematical expression. Please enter a valid calculation.');
          return;
        }
      } else {
        // Regular number parsing
        newValue = parseFloat(editValue);
        if (isNaN(newValue)) {
          alert('Please enter a valid number.');
          return;
        }
      }
      
      onUpdateEntryValue(editingCell.entryId, editingCell.accountId, newValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrencyForDisplay(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded shadow p-6 mt-4">
        <h2 className="text-xl font-bold mb-6">Dashboard</h2>
        <EmptyState
          variant="entries"
          title="No Net Worth Data Yet"
          description="Start tracking your financial journey by creating your first daily entry. Monitor your assets, liabilities, and net worth over time to see your progress toward financial independence."
          action={{
            label: "Create First Entry",
            onClick: onCreateFirstEntry || (() => {}),
            variant: "primary"
          }}
          showSteps={true}
          steps={[
            "Make sure you have accounts set up first",
            "Enter current values for all your accounts",
            "Save your first daily entry",
            "Come back regularly to track changes over time"
          ]}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow p-4 sm:p-6 mt-4">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Total Entries</div>
          <div className="text-2xl font-bold text-blue-700">{entries.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Latest Assets</div>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrencyForDisplay(sortedEntries.length ? recalcTotals(sortedEntries[sortedEntries.length - 1]).assets : 0)}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Latest Liabilities</div>
          <div className="text-2xl font-bold text-red-700">
            {formatCurrencyForDisplay(sortedEntries.length ? recalcTotals(sortedEntries[sortedEntries.length - 1]).liabilities : 0)}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Latest Net Worth</div>
          <div className="text-2xl font-bold text-purple-700">
            {formatCurrencyForDisplay(sortedEntries.length ? recalcTotals(sortedEntries[sortedEntries.length - 1]).netWorth : 0)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Net Worth Trends</h3>
        <div className="h-64 sm:h-80" style={{ marginLeft: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={(value) => {
                  // Round to nearest thousand for cleaner Y-axis labels
                  const rounded = Math.round(value / 1000) * 1000;
                  // Format without decimals for Y-axis
                  return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: preferredCurrency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(rounded);
                }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="assets" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Assets"
              />
              <Line 
                type="monotone" 
                dataKey="liabilities" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                name="Liabilities"
              />
              <Line 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                name="Net Worth"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Account Details Table */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h3 className="text-base sm:text-lg font-semibold">Account Details by Date</h3>
          <div className="flex items-center space-x-2">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showOriginalCurrency}
                onChange={(e) => setShowOriginalCurrency(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Show original + {preferredCurrency}
            </label>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-gray-200 rounded-lg" style={{ 
          scrollbarWidth: 'thin', 
          scrollbarColor: '#cbd5e0 #f7fafc',
          scrollbarGutter: 'stable'
        }}>
          <table className="min-w-full bg-white" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm text-gray-500 border-b border-r bg-gray-50" style={{ minWidth: '128px' }}>
                  Account
                </th>
                {showOriginalCurrency && (
                  <th className="px-4 py-3 text-sm text-gray-500 border-b border-r bg-gray-50" style={{ minWidth: '48px' }}>
                    Currency
                  </th>
                )}
                {sortedEntries.map((entry) => (
                  <th 
                    key={entry.id} 
                    className="px-4 py-3 text-sm text-gray-500 border-b text-center" 
                    style={{ minWidth: showOriginalCurrency ? '200px' : '100px' }}
                    colSpan={showOriginalCurrency ? 2 : 1}
                  >
                    {new Date(entry.date).toLocaleDateString()}
                  </th>
                ))}
              </tr>
              {showOriginalCurrency && (
                <tr>
                  <th className="px-4 py-2 text-xs text-gray-400 border-b border-r bg-gray-50" style={{ minWidth: '128px' }}>
                  </th>
                  <th className="px-4 py-2 text-xs text-gray-400 border-b border-r bg-gray-50" style={{ minWidth: '48px' }}>
                  </th>
                  {sortedEntries.map((entry) => (
                    <React.Fragment key={`${entry.id}-subheader`}>
                      <th className="px-4 py-2 text-xs text-gray-400 border-b text-center" style={{ minWidth: '100px' }}>
                        Original
                      </th>
                      <th className="px-4 py-2 text-xs text-gray-400 border-b text-center" style={{ minWidth: '100px' }}>
                        USD
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(() => {
                // Get all unique accounts from all entries
                const allAccountIds = new Set<string>();
                sortedEntries.forEach(entry => {
                  Object.keys(entry.accountValues).forEach(accountId => {
                    allAccountIds.add(accountId);
                  });
                });

                // Create account info map from the accounts prop
                const accountInfoMap: { [accountId: string]: { name: string; type: string; category: string } } = {};
                
                // Map account IDs to account information
                Array.from(allAccountIds).forEach(accountId => {
                  const account = accounts.find(acc => acc.id === accountId);
                  if (account) {
                    accountInfoMap[accountId] = {
                      name: account.name,
                      type: account.type,
                      category: account.category
                    };
                  } else {
                    // Fallback for accounts not found (shouldn't happen in normal usage)
                    console.warn(`Account ID ${accountId} found in entries but not in accounts prop!`);
                    accountInfoMap[accountId] = {
                      name: accountId,
                      type: 'asset',
                      category: 'other'
                    };
                  }
                });
                
                // Sort accounts by type (assets first, then liabilities), then by category, then alphabetically
                const sortedAccountIds = Array.from(allAccountIds).sort((a, b) => {
                  const accountA = accountInfoMap[a];
                  const accountB = accountInfoMap[b];
                  
                  // Sort by type first (assets before liabilities)
                  if (accountA.type !== accountB.type) {
                    return accountA.type === 'asset' ? -1 : 1;
                  }
                  
                  // Then sort by category
                  if (accountA.category !== accountB.category) {
                    return accountA.category.localeCompare(accountB.category);
                  }
                  
                  // Then sort by name
                  return accountA.name.localeCompare(accountB.name);
                });

                // Group accounts by type and category for totals
                const accountGroups: { [key: string]: string[] } = {};
                sortedAccountIds.forEach(accountId => {
                  const accountInfo = accountInfoMap[accountId];
                  const groupKey = `${accountInfo.type}-${accountInfo.category}`;
                  if (!accountGroups[groupKey]) {
                    accountGroups[groupKey] = [];
                  }
                  accountGroups[groupKey].push(accountId);
                });

                // Generate rows in the requested order: Net Worth, Total Assets, Asset Categories, Total Liabilities, Liability Categories
                const rows: ReactElement[] = [];
                
                const assetAccounts = sortedAccountIds.filter(id => accountInfoMap[id].type === 'asset');
                const liabilityAccounts = sortedAccountIds.filter(id => accountInfoMap[id].type === 'liability');

                // No sticky positioning needed

                // Helper function to create a row
                const createRow = (
                  label: string,
                  accountIds: string[],
                  bgColor: string,
                  textColor: string,
                  borderColor: string,
                  isTotal: boolean = false,
                  isNetWorth: boolean = false
                ) => {
                  const tds: React.ReactElement[] = [];
                  
                  // Determine hover class based on background color
                  let hoverClass = ''; // default
                  if (bgColor === 'bg-green-25') {
                    hoverClass = 'asset-category-row';
                  } else if (bgColor === 'bg-red-25') {
                    hoverClass = 'liability-category-row';
                  }

                  // No sticky positioning needed
                  const stickyProps = {};

                  // Account column
                  tds.push(
                    <td
                      key={`${label}-label`}
                                          className={`px-4 py-3 text-sm ${textColor} border-b border-r ${bgColor} ${isTotal ? 'font-bold' : 'font-semibold'} ${borderColor}`}
                    >
                      {label}
                    </td>
                  );
                  if (showOriginalCurrency) {
                    tds.push(
                      <td
                        key={`${label}-currency`}
                        className={`px-4 py-3 text-sm text-center border-b border-r ${bgColor} ${borderColor}`}
                      >
                        <span className="font-mono text-xs text-gray-400">{preferredCurrency}</span>
                      </td>
                    );
                  }
                  sortedEntries.forEach(entry => {
                    let totalValue = 0;
                    let totalPreferredValue = 0;
                    
                    if (isNetWorth) {
                      // For net worth, convert each account to USD first, then sum
                      const totalAssetsUsd = assetAccounts.reduce((sum, accId) => {
                        const value = entry.accountValues[accId] || 0;
                        const account = accounts.find(acc => acc.id === accId);
                        const currencyCode = account?.currency || 'USD';
                        return sum + convertCurrency(value, currencyCode, 'USD');
                      }, 0);
                      
                      const totalLiabilitiesUsd = liabilityAccounts.reduce((sum, accId) => {
                        const value = entry.accountValues[accId] || 0;
                        const account = accounts.find(acc => acc.id === accId);
                        const currencyCode = account?.currency || 'USD';
                        return sum + convertCurrency(value, currencyCode, 'USD');
                      }, 0);
                      
                      const netWorthUsd = totalAssetsUsd - totalLiabilitiesUsd;
                      totalPreferredValue = convertCurrency(netWorthUsd, 'USD', preferredCurrency);
                      totalValue = netWorthUsd; // Keep USD for display in original column when showing original currency
                    } else {
                      // For other totals, convert each account to preferred currency
                      totalPreferredValue = accountIds.reduce((sum, accId) => {
                        const value = entry.accountValues[accId] || 0;
                        const account = accounts.find(acc => acc.id === accId);
                        const currencyCode = account?.currency || 'USD'; // Default to USD if no currency set
                        return sum + convertCurrency(value, currencyCode, preferredCurrency);
                      }, 0);
                      
                      // For original column, convert to USD for consistency
                      totalValue = accountIds.reduce((sum, accId) => {
                        const value = entry.accountValues[accId] || 0;
                        const account = accounts.find(acc => acc.id === accId);
                        const currencyCode = account?.currency || 'USD';
                        return sum + convertCurrency(value, currencyCode, 'USD');
                      }, 0);
                    }
                    
                    if (showOriginalCurrency) {
                      // For all totals (Net Worth, Total Assets, Total Liabilities, category totals), show "-" in original column
                      const originalValue = (isTotal || label !== 'Net Worth') ? '-' : (totalValue === 0 ? '-' : totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                      const originalColor = (isTotal || label !== 'Net Worth') ? 'text-gray-400' : 'text-gray-600';
                      tds.push(
                        <td
                          key={`${label}-original-${entry.id}`}
                          className={`px-4 py-3 text-sm text-right border-b ${borderColor}`}
                        >
                          <span className={`font-bold ${originalColor}`}>{originalValue}</span>
                        </td>
                      );
                      tds.push(
                        <td
                          key={`${label}-preferred-${entry.id}`}
                          className={`px-4 py-3 text-sm text-right border-b ${borderColor}`}
                        >
                          <span className={`font-bold ${isNetWorth ? (totalPreferredValue >= 0 ? 'text-green-700' : 'text-red-700') : (accountIds.length > 0 && accountInfoMap[accountIds[0]]?.type === 'asset' ? 'text-green-700' : 'text-red-700')}`}>{totalPreferredValue === 0 ? '-' : formatCurrency(totalPreferredValue, preferredCurrency)}</span>
                        </td>
                      );
                    } else {
                      tds.push(
                        <td
                          key={`${label}-preferred-${entry.id}`}
                          className={`px-4 py-3 text-sm text-right border-b ${borderColor}`}
                        >
                          <span className={`font-bold ${isNetWorth ? (totalPreferredValue >= 0 ? 'text-green-700' : 'text-red-700') : (accountIds.length > 0 && accountInfoMap[accountIds[0]]?.type === 'asset' ? 'text-green-700' : 'text-red-700')}`}>{totalPreferredValue === 0 ? '-' : formatCurrency(totalPreferredValue, preferredCurrency)}</span>
                        </td>
                      );
                    }
                  });
                  
                  return (
                    <tr key={label} className={hoverClass} {...stickyProps}>
                      {tds}
                    </tr>
                  );
                };

                // Add Net Worth row first
                rows.push(createRow('Net Worth', [...assetAccounts, ...liabilityAccounts], 'bg-blue-50', 'text-blue-900', 'border-blue-100', true, true));

                // Add Asset category totals
                const assetCategories = Array.from(new Set(assetAccounts.map(id => accountInfoMap[id].category))).sort();
                assetCategories.forEach(category => {
                  const categoryAccounts = assetAccounts.filter(id => accountInfoMap[id].category === category);
                  if (categoryAccounts.length > 0) {
                    rows.push(createRow(category, categoryAccounts, 'bg-green-25', 'text-green-800', 'border-green-100', true, false));
                    
                    // Add individual accounts in this category
                    categoryAccounts.forEach(accountId => {
                      const createAccountRow = (accountId: string) => {
                        const account = accounts.find(acc => acc.id === accountId);
                        if (!account) return null;
                        
                        const tds: React.ReactElement[] = [];
                        // Account column
                        tds.push(
                          <td
                            key={`${accountId}-label`}
                            className="px-4 py-2 text-sm text-gray-700 border-b border-r"
                            style={{ minWidth: '128px' }}
                          >
                            <span className="ml-4 whitespace-nowrap overflow-hidden text-ellipsis">{account.name}</span>
                          </td>
                        );
                        // Currency column
                        if (showOriginalCurrency) {
                          tds.push(
                            <td
                              key={`${accountId}-currency`}
                              className="px-4 py-2 text-sm text-center border-b border-r"
                              style={{ minWidth: '48px' }}
                            >
                              <span className="font-mono text-xs text-gray-400">{account.currency}</span>
                            </td>
                          );
                        }
                        
                        sortedEntries.forEach(entry => {
                          const value = entry.accountValues[accountId] || 0;
                          const preferredValue = convertCurrency(value, account.currency, preferredCurrency);
                          const usdValue = convertCurrency(value, account.currency, 'USD');
                          
                          if (showOriginalCurrency) {
                            // Original column (show in account's currency)
                            const isEditing = editingCell && editingCell.entryId === entry.id && editingCell.accountId === accountId && editingCell.column === 'original';
                            tds.push(
                              <td
                                key={`${accountId}-original-${entry.id}`}
                                className="px-4 py-2 text-sm text-right border-b cursor-pointer asset-cell"
                                onClick={() => handleCellClick(entry.id, accountId, 'original', value)}
                              >
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleEditSave}
                                    onKeyPress={handleKeyPress}
                                    className="w-full text-right border-none outline-none bg-transparent"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="font-mono text-gray-600">{value === 0 ? '-' : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                )}
                              </td>
                            );
                            // Preferred column
                            const isEditingPreferred = editingCell && editingCell.entryId === entry.id && editingCell.accountId === accountId && editingCell.column === 'usd';
                            tds.push(
                              <td
                                key={`${accountId}-preferred-${entry.id}`}
                                className="px-4 py-2 text-sm text-right border-b cursor-pointer asset-cell"
                                onClick={() => handleCellClick(entry.id, accountId, 'usd', preferredValue)}
                              >
                                {isEditingPreferred ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleEditSave}
                                    onKeyPress={handleKeyPress}
                                    className="w-full text-right border-none outline-none bg-transparent"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="font-mono text-green-600">{preferredValue === 0 ? '-' : formatCurrency(preferredValue, preferredCurrency)}</span>
                                )}
                              </td>
                            );
                          } else {
                            // Single column mode
                            const isEditing = editingCell && editingCell.entryId === entry.id && editingCell.accountId === accountId && editingCell.column === 'usd';
                            tds.push(
                              <td
                                key={`${accountId}-preferred-${entry.id}`}
                                className="px-4 py-2 text-sm text-right border-b cursor-pointer asset-cell"
                                onClick={() => handleCellClick(entry.id, accountId, 'usd', preferredValue)}
                              >
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleEditSave}
                                    onKeyPress={handleKeyPress}
                                    className="w-full text-right border-none outline-none bg-transparent"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="font-mono text-green-600">{preferredValue === 0 ? '-' : formatCurrency(preferredValue, preferredCurrency)}</span>
                                )}
                              </td>
                            );
                          }
                        });
                        
                        return (
                          <tr key={accountId} className="asset-row">
                            {tds}
                          </tr>
                        );
                      };
                      
                      const accountRow = createAccountRow(accountId);
                      if (accountRow) {
                        rows.push(accountRow);
                      }
                    });
                  }
                });

                // Add Liability category totals
                const liabilityCategories = Array.from(new Set(liabilityAccounts.map(id => accountInfoMap[id].category))).sort();
                liabilityCategories.forEach(category => {
                  const categoryAccounts = liabilityAccounts.filter(id => accountInfoMap[id].category === category);
                  if (categoryAccounts.length > 0) {
                    rows.push(createRow(category, categoryAccounts, 'bg-red-25', 'text-red-800', 'border-red-100', true, false));
                    
                    // Add individual accounts in this category
                    categoryAccounts.forEach(accountId => {
                      const createAccountRow = (accountId: string) => {
                        const account = accounts.find(acc => acc.id === accountId);
                        if (!account) return null;
                        
                        const tds: React.ReactElement[] = [];
                        // Account column
                        tds.push(
                          <td
                            key={`${accountId}-label`}
                            className="px-4 py-2 text-sm text-gray-700 border-b border-r"
                            style={{ minWidth: '128px' }}
                          >
                            <span className="ml-4 whitespace-nowrap overflow-hidden text-ellipsis">{account.name}</span>
                          </td>
                        );
                        // Currency column
                        if (showOriginalCurrency) {
                          tds.push(
                            <td
                              key={`${accountId}-currency`}
                              className="px-4 py-2 text-sm text-center border-b border-r"
                              style={{ minWidth: '48px' }}
                            >
                              <span className="font-mono text-xs text-gray-400">{account.currency}</span>
                            </td>
                          );
                        }
                        
                        sortedEntries.forEach(entry => {
                          const value = entry.accountValues[accountId] || 0;
                          const preferredValue = convertCurrency(value, account.currency, preferredCurrency);
                          const usdValue = convertCurrency(value, account.currency, 'USD');
                          
                          if (showOriginalCurrency) {
                            // Original column (show in account's currency)
                            const isEditing = editingCell && editingCell.entryId === entry.id && editingCell.accountId === accountId && editingCell.column === 'original';
                            tds.push(
                              <td
                                key={`${accountId}-original-${entry.id}`}
                                className="px-4 py-2 text-sm text-right border-b cursor-pointer liability-cell"
                                onClick={() => handleCellClick(entry.id, accountId, 'original', value)}
                              >
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleEditSave}
                                    onKeyPress={handleKeyPress}
                                    className="w-full text-right border-none outline-none bg-transparent"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="font-mono text-gray-600">{value === 0 ? '-' : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                )}
                              </td>
                            );
                            // Preferred column
                            const isEditingPreferred = editingCell && editingCell.entryId === entry.id && editingCell.accountId === accountId && editingCell.column === 'usd';
                            tds.push(
                              <td
                                key={`${accountId}-preferred-${entry.id}`}
                                className="px-4 py-2 text-sm text-right border-b cursor-pointer liability-cell"
                                onClick={() => handleCellClick(entry.id, accountId, 'usd', preferredValue)}
                              >
                                {isEditingPreferred ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleEditSave}
                                    onKeyPress={handleKeyPress}
                                    className="w-full text-right border-none outline-none bg-transparent"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="font-mono text-red-600">{preferredValue === 0 ? '-' : formatCurrency(preferredValue, preferredCurrency)}</span>
                                )}
                              </td>
                            );
                          } else {
                            // Single column mode
                            const isEditing = editingCell && editingCell.entryId === entry.id && editingCell.accountId === accountId && editingCell.column === 'usd';
                            tds.push(
                              <td
                                key={`${accountId}-preferred-${entry.id}`}
                                className="px-4 py-2 text-sm text-right border-b cursor-pointer liability-cell"
                                onClick={() => handleCellClick(entry.id, accountId, 'usd', preferredValue)}
                              >
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleEditSave}
                                    onKeyPress={handleKeyPress}
                                    className="w-full text-right border-none outline-none bg-transparent"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="font-mono text-red-600">{preferredValue === 0 ? '-' : formatCurrency(preferredValue, preferredCurrency)}</span>
                                )}
                              </td>
                            );
                          }
                        });
                        
                        return (
                          <tr key={accountId} className="liability-row">
                            {tds}
                          </tr>
                        );
                      };
                      
                      const accountRow = createAccountRow(accountId);
                      if (accountRow) {
                        rows.push(accountRow);
                      }
                    });
                  }
                });

                return rows;
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Historical Entries</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Total Assets
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Total Liabilities
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Net Worth
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedEntries.map((entry) => {
                const { assets, liabilities, netWorth } = recalcTotals(entry);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 font-medium border-b">
                      {formatCurrencyForDisplay(assets)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600 font-medium border-b">
                      {formatCurrencyForDisplay(liabilities)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium border-b ${
                      netWorth >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {formatCurrencyForDisplay(netWorth)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 