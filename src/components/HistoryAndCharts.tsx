import React, { ReactElement, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { NetWorthEntry, Account } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currencyConverter';

interface HistoryAndChartsProps {
  entries: NetWorthEntry[];
  accounts: Account[];
  preferredCurrency: string;
  onUpdateEntryValue: (entryId: string, accountId: string, newValue: number) => void;
}

export default function HistoryAndCharts({ entries, accounts, preferredCurrency, onUpdateEntryValue }: HistoryAndChartsProps) {
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
      if (/[\+\-\*\/\(\)]/.test(editValue)) {
        try {
          // Safely evaluate the mathematical expression
          // Only allow basic math operations and numbers
          const sanitizedExpression = editValue.replace(/[^0-9\+\-\*\/\(\)\.]/g, '');
          newValue = eval(sanitizedExpression);
          
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
        <h2 className="text-xl font-bold mb-2">History & Charts</h2>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No net worth entries found.</p>
          <p className="text-sm text-gray-400">Create some entries in the Daily Entry tab to see your history and charts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow p-6 mt-4">
      <h2 className="text-xl font-bold mb-6">History & Charts</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Net Worth Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={formatCurrencyForDisplay}
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

      {/* Summary Table */}
      <div className="mb-8">
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

      {/* Account Details Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Account Details by Date</h3>
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
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-gray-200 rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 sticky top-0 z-20">
              {showOriginalCurrency ? (
                <>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b sticky left-0 bg-gray-50 z-30 min-w-32">
                      Account
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b sticky left-32 bg-gray-50 z-30 min-w-12">
                      Currency
                    </th>
                    {sortedEntries.map((entry) => (
                      <th key={entry.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b min-w-52" colSpan={2}>
                        <div className="flex flex-col">
                          <span>{new Date(entry.date).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400 font-normal">
                            {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b sticky left-0 bg-gray-50 z-30 min-w-32">
                      
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b sticky left-32 bg-gray-50 z-30 min-w-12">
                    
                  </th>
                    {sortedEntries.map((entry) => (
                      <React.Fragment key={entry.id}>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b min-w-20">
                          Original
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b min-w-20">
                          {preferredCurrency}
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </>
              ) : (
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b sticky left-0 bg-gray-50 z-30 min-w-32">
                    Account
                  </th>
                  {sortedEntries.map((entry) => (
                    <th key={entry.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b min-w-28">
                      <div className="flex flex-col">
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                        <span className="text-xs text-gray-400 font-normal">
                          {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    </th>
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

                // Helper function to create a row
                const createRow = (label: string, accountIds: string[], bgColor: string, textColor: string, borderColor: string, isTotal: boolean = false, isNetWorth: boolean = false, stickyTop?: string) => {
                  const tds: React.ReactElement[] = [];
                  // Account column
                  tds.push(
                    <td
                      key={`${label}-label`}
                      className={`px-4 py-3 text-sm ${textColor} border-b sticky left-0 ${bgColor} z-10 ${isTotal ? 'font-bold' : 'font-semibold'} ${borderColor}`}
                    >
                      {label}
                    </td>
                  );
                  // Currency column
                  if (showOriginalCurrency) {
                    tds.push(
                      <td
                        key={`${label}-currency`}
                        className={`px-4 py-3 text-sm text-center border-b sticky left-32 bg-white z-10 ${borderColor}`}
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
                        const currencyCode = account?.currency || 'USD'; // Default to USD if no currency set
                        return sum + convertCurrency(value, currencyCode, 'USD');
                      }, 0);
                      
                      const totalLiabilitiesUsd = liabilityAccounts.reduce((sum, accId) => {
                        const value = entry.accountValues[accId] || 0;
                        const account = accounts.find(acc => acc.id === accId);
                        const currencyCode = account?.currency || 'USD'; // Default to USD if no currency set
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
                      const originalValue = isTotal ? '-' : (totalValue === 0 ? '-' : totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                      const originalColor = isTotal ? 'text-gray-400' : 'text-gray-600';
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
                    <tr key={label} className={`${bgColor} ${isTotal ? 'font-bold' : 'font-semibold'} ${borderColor}`} style={stickyTop ? { position: 'sticky', top: stickyTop, zIndex: 15, background: bgColor === 'bg-purple-50' ? '#faf5ff' : bgColor === 'bg-gray-50' ? '#f9fafb' : '#fff', borderBottom: borderColor === 'border-purple-400' ? '2px solid #c084fc' : undefined } : {}}>
                      {tds}
                    </tr>
                  );
                };

                // Helper function to create individual account rows
                const createAccountRow = (accountId: string) => {
                  const accountInfo = accountInfoMap[accountId];
                  const tds: ReactElement[] = [
                    <td key="acc-name" className="px-4 py-3 text-sm text-gray-900 border-b sticky left-0 bg-white z-10 font-medium pl-6 max-w-32 truncate" title={accountInfo.name}>{accountInfo.name}</td>
                  ];
                  if (showOriginalCurrency) {
                    const account = accounts.find(acc => acc.id === accountId);
                    const currencyCode = account?.currency || preferredCurrency;
                    tds.push(
                      <td key="acc-currency" className="px-4 py-3 text-sm text-center border-b sticky left-32 bg-white z-10">
                        <span className="font-mono text-xs text-gray-500">{currencyCode}</span>
                      </td>
                    );
                  }
                  sortedEntries.forEach(entry => {
                    const value = entry.accountValues[accountId] || 0;
                    const account = accounts.find(acc => acc.id === accountId);
                    const currencyCode = account?.currency || preferredCurrency;
                    const preferredValue = convertCurrency(value, currencyCode, preferredCurrency);
                    
                    if (showOriginalCurrency) {
                      // Original value cell (clickable)
                      const isEditingOriginal = editingCell?.entryId === entry.id && editingCell?.accountId === accountId && editingCell?.column === 'original';
                      tds.push(
                        <td 
                          key={`acc-original-${entry.id}`} 
                          className="px-4 py-3 text-sm text-right border-b cursor-pointer hover:bg-blue-50"
                          onClick={() => handleCellClick(entry.id, accountId, 'original', value)}
                        >
                          {isEditingOriginal ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleEditSave}
                              onKeyDown={handleKeyPress}
                              className="w-full text-right border border-blue-300 rounded px-2 py-1 text-sm"
                              placeholder="Enter number or calculation (e.g., 80*1000)"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium text-gray-600">
                              {value === 0 ? '-' : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </td>
                      );
                      // Preferred currency value cell (read-only, shows converted value)
                      tds.push(
                        <td key={`acc-preferred-${entry.id}`} className="px-4 py-3 text-sm text-right border-b">
                          <span className={`font-medium ${accountInfo.type === 'asset' ? 'text-green-600' : 'text-red-600'}`}>{value === 0 ? '-' : formatCurrency(preferredValue, preferredCurrency)}</span>
                        </td>
                      );
                    } else {
                      // Single column mode - edit the preferred currency value directly
                      const isEditingPreferred = editingCell?.entryId === entry.id && editingCell?.accountId === accountId && editingCell?.column === 'usd';
                      tds.push(
                        <td 
                          key={`acc-preferred-${entry.id}`} 
                          className="px-4 py-3 text-sm text-right border-b cursor-pointer hover:bg-blue-50"
                          onClick={() => handleCellClick(entry.id, accountId, 'usd', value)}
                        >
                          {isEditingPreferred ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleEditSave}
                              onKeyDown={handleKeyPress}
                              className="w-full text-right border border-blue-300 rounded px-2 py-1 text-sm"
                              placeholder="Enter number or calculation (e.g., 80*1000)"
                              autoFocus
                            />
                          ) : (
                            <span className={`font-medium ${accountInfo.type === 'asset' ? 'text-green-600' : 'text-red-600'}`}>
                              {value === 0 ? '-' : formatCurrency(preferredValue, preferredCurrency)}
                            </span>
                          )}
                        </td>
                      );
                    }
                  });
                  return (
                    <tr key={accountId} className="hover:bg-gray-50">
                      {tds}
                    </tr>
                  );
                };

                                // 1. Net Worth row (at the top)
                if (assetAccounts.length > 0 || liabilityAccounts.length > 0) {
                  const netWorthTop = showOriginalCurrency ? '80px' : '40px';
                  rows.push(createRow('Net Worth', [], 'bg-purple-50', 'text-purple-900', 'border-purple-400', true, true, netWorthTop));
                }

                // 2. Asset categories and their accounts
                let firstAssetCategory = true;
                const assetCategories = new Set(assetAccounts.map(id => accountInfoMap[id].category));
                assetCategories.forEach(category => {
                  const categoryAccounts = assetAccounts.filter(id => accountInfoMap[id].category === category);
                  
                  // Add category total if multiple accounts
                  if (categoryAccounts.length > 1) {
                    rows.push(createRow(`Total ${category.replace('-', ' ')}`, categoryAccounts, 'bg-gray-50', 'text-gray-700', 'border-gray-200', true, false));
                    firstAssetCategory = false;
                  }
                  
                  // Add individual accounts in this category
                  categoryAccounts.forEach(accountId => {
                    rows.push(createAccountRow(accountId));
                  });
                });

                // 3. Liability categories and their accounts
                let firstLiabilityCategory = true;
                const liabilityCategories = new Set(liabilityAccounts.map(id => accountInfoMap[id].category));
                liabilityCategories.forEach(category => {
                  const categoryAccounts = liabilityAccounts.filter(id => accountInfoMap[id].category === category);
                  
                  
                  
                  // Add category total if multiple accounts
                  if (categoryAccounts.length > 1) {
                    rows.push(createRow(`Total ${category.replace('-', ' ')}`, categoryAccounts, 'bg-gray-50', 'text-gray-700', 'border-gray-200', true, false, firstLiabilityCategory ? '160px' : undefined));
                    firstLiabilityCategory = false;
                  }
                  
                  // Add individual accounts in this category
                  categoryAccounts.forEach(accountId => {
                    rows.push(createAccountRow(accountId));
                  });
                });

                return rows;
              })()}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>• Assets are shown in green, liabilities in red</p>
          <p>• Category totals (gray background) show the sum of all accounts in that category ({preferredCurrency} only)</p>
          <p>• Total Assets (blue background) and Total Liabilities (red background) show overall totals</p>
          <p>• Net Worth (purple background) shows Assets minus Liabilities</p>
          <p>• Empty cells (shown as "-") indicate no value recorded for that account on that date</p>
          <p>• Scroll horizontally to see more dates, or vertically to see more accounts</p>
          <p>• <strong>Currency display:</strong> {showOriginalCurrency ? `Currency column shows the currency code for each account, Original column shows values in their native currency, ${preferredCurrency} column shows converted ${preferredCurrency} values` : `All values are shown in ${preferredCurrency} (converted from their native currencies)`}</p>
          <p>• <strong>Edit feature:</strong> Click on any account value cell to edit it directly. Press Enter to save or Escape to cancel. When "Show original currency" is enabled, edit the original currency values; when disabled, edit {preferredCurrency} values directly. You can also enter calculations like "80*1000" or "5000+2500" and they will be automatically calculated.</p>
        </div>
      </div>
    </div>
  );
} 