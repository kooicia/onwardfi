import React, { useState, useRef, useEffect } from 'react';
import { Table, Input, Button, Space, Typography, Checkbox } from 'antd';
import { NetWorthEntry, Account } from '../types';
import { formatCurrency, convertCurrencySync, convertCurrencyWithEntry } from '../utils/currencyConverter';

interface AccountDetailsTableProps {
  entries: NetWorthEntry[];
  accounts: Account[];
  preferredCurrency: string;
  onUpdateEntryValue: (entryId: string, accountId: string, newValue: number) => Promise<void>;
}

export default function AccountDetailsTable({ 
  entries, 
  accounts, 
  preferredCurrency, 
  onUpdateEntryValue 
}: AccountDetailsTableProps) {
  const [showOriginalCurrency, setShowOriginalCurrency] = useState(true);
  const [editingCell, setEditingCell] = useState<{ entryId: string; accountId: string; column: 'original' | 'usd' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const tableRef = useRef<HTMLDivElement>(null);

  // State to store async converted values
  const [convertedValues, setConvertedValues] = useState<{ [key: string]: string }>({});

  // Helper to trigger async conversion for a cell
  const triggerConversion = async (amount: number, from: string, to: string, date: string, cellKey: string, exchangeRates?: { [currencyPair: string]: number }) => {
    const converted = await convertCurrencyWithEntry(amount, from, to, date, exchangeRates);
    setConvertedValues(prev => ({ ...prev, [cellKey]: formatCurrency(converted, to) }));
  };

  // Helper function to format date as yyyy/mm/dd
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const handleCellClick = (entryId: string, accountId: string, column: 'original' | 'usd', currentValue: number) => {
    setEditingCell({ entryId, accountId, column });
    // Format the value to show 2 decimal places when entering edit mode
    setEditValue(currentValue.toFixed(2));
  };

  const handleEditSave = async () => {
    if (editingCell && editValue !== '') {
      let newValue: number;
      // Check if the input contains mathematical operators
      if (/[+\-*/().]/.test(editValue)) {
        try {
          // Safely evaluate the mathematical expression
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
      await onUpdateEntryValue(editingCell.entryId, editingCell.accountId, newValue);
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

  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Check if all accounts have the same currency as preferred currency
  const allAccountsSameCurrency = accounts.length > 0 && accounts.every(account => account.currency === preferredCurrency);
  
  // If all accounts have the same currency as preferred, force showOriginalCurrency to false
  const effectiveShowOriginalCurrency = allAccountsSameCurrency ? false : showOriginalCurrency;

  // Scroll to the rightmost position (most recent dates) when component loads
  useEffect(() => {
    if (tableRef.current) {
      const scrollContainer = tableRef.current.querySelector('.ant-table-body');
      if (scrollContainer) {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth;
      }
    }
  }, [entries, effectiveShowOriginalCurrency]);

  // Generate data source for the table
  const generateDataSource = () => {
    // Get all unique accounts from all entries
    const allAccountIds = new Set<string>();
    sortedEntries.forEach(entry => {
      Object.keys(entry.accountValues).forEach(accountId => {
        allAccountIds.add(accountId);
      });
    });

    // Create account info map
    const accountInfoMap: { [accountId: string]: { name: string; type: string; category: string } } = {};
    
    Array.from(allAccountIds).forEach(accountId => {
      const account = accounts.find(acc => acc.id === accountId);
      if (account) {
        accountInfoMap[accountId] = {
          name: account.name,
          type: account.type,
          category: account.category
        };
      } else {
        console.warn(`Account ID ${accountId} found in entries but not in accounts prop!`);
        accountInfoMap[accountId] = {
          name: accountId,
          type: 'asset',
          category: 'other'
        };
      }
    });
    
    // Sort accounts
    const sortedAccountIds = Array.from(allAccountIds).sort((a, b) => {
      const accountA = accountInfoMap[a];
      const accountB = accountInfoMap[b];
      
      if (accountA.type !== accountB.type) {
        return accountA.type === 'asset' ? -1 : 1;
      }
      
      if (accountA.category !== accountB.category) {
        return accountA.category.localeCompare(accountB.category);
      }
      
      return accountA.name.localeCompare(accountB.name);
    });

    const assetAccounts = sortedAccountIds.filter(id => accountInfoMap[id].type === 'asset');
    const liabilityAccounts = sortedAccountIds.filter(id => accountInfoMap[id].type === 'liability');

    const dataSource: any[] = [];

    // Add Net Worth row
    if (assetAccounts.length > 0 || liabilityAccounts.length > 0) {
      const netWorthRow: any = {
        key: 'net-worth',
        account: 'Net Worth',
        type: 'networth',
        className: 'networth-row'
      };
      
      sortedEntries.forEach(entry => {
        const totalAssetsUsd = assetAccounts.reduce((sum, accId) => {
          const value = entry.accountValues[accId] || 0;
          const account = accounts.find(acc => acc.id === accId);
          const currencyCode = account?.currency || 'USD';
          
          // Use stored exchange rate if available, otherwise use current rate
          const rate = entry.exchangeRates?.[`${currencyCode}-${preferredCurrency}`];
          if (typeof rate === 'number' && isFinite(rate) && rate > 0) {
            return sum + (value * rate);
          } else {
            return sum + convertCurrencySync(value, currencyCode, preferredCurrency);
          }
        }, 0);
        
        const totalLiabilitiesUsd = liabilityAccounts.reduce((sum, accId) => {
          const value = entry.accountValues[accId] || 0;
          const account = accounts.find(acc => acc.id === accId);
          const currencyCode = account?.currency || 'USD';
          
          // Use stored exchange rate if available, otherwise use current rate
          const rate = entry.exchangeRates?.[`${currencyCode}-${preferredCurrency}`];
          if (typeof rate === 'number' && isFinite(rate) && rate > 0) {
            return sum + (value * rate);
          } else {
            return sum + convertCurrencySync(value, currencyCode, preferredCurrency);
          }
        }, 0);
        
        const netWorthUsd = totalAssetsUsd - totalLiabilitiesUsd;
        
        // Convert to preferred currency using stored rate if available
        let netWorthPreferred: number;
        const rate = entry.exchangeRates?.[`USD-${preferredCurrency}`];
        if (typeof rate === 'number' && isFinite(rate) && rate > 0) {
          netWorthPreferred = netWorthUsd * rate;
        } else {
          netWorthPreferred = convertCurrencySync(netWorthUsd, 'USD', preferredCurrency);
        }
        
        netWorthRow[`${entry.id}-original`] = netWorthUsd === 0 ? '-' : netWorthUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        netWorthRow[`${entry.id}-preferred`] = netWorthPreferred === 0 ? '-' : formatCurrency(netWorthPreferred, preferredCurrency);
      });
      
      dataSource.push(netWorthRow);
    }



    // Add Asset categories and individual accounts
    const assetCategories = Array.from(new Set(assetAccounts.map(id => accountInfoMap[id].category))).sort();
    assetCategories.forEach(category => {
      const categoryAccounts = assetAccounts.filter(id => accountInfoMap[id].category === category);
      if (categoryAccounts.length > 0) {
        // Category total row
        const categoryRow: any = {
          key: `asset-category-${category}`,
          account: category,
          type: 'asset-category-sum',
          className: 'asset-category-sum'
        };
        
        sortedEntries.forEach(entry => {
          const categoryTotal = categoryAccounts.reduce((sum, accId) => {
            const value = entry.accountValues[accId] || 0;
            const account = accounts.find(acc => acc.id === accId);
            const currencyCode = account?.currency || 'USD';
            
            // Use stored exchange rate if available, otherwise use current rate
            const rate = entry.exchangeRates?.[`${currencyCode}-${preferredCurrency}`];
            if (typeof rate === 'number' && isFinite(rate) && rate > 0) {
              return sum + (value * rate);
            } else {
              return sum + convertCurrencySync(value, currencyCode, preferredCurrency);
            }
          }, 0);
          
          categoryRow[`${entry.id}-original`] = '-';
          categoryRow[`${entry.id}-preferred`] = categoryTotal === 0 ? '-' : formatCurrency(categoryTotal, preferredCurrency);
        });
        
        dataSource.push(categoryRow);

        // Individual account rows
        categoryAccounts.forEach(accountId => {
          const account = accounts.find(acc => acc.id === accountId);
          if (!account) return;

          const accountRow: any = {
            key: accountId,
            account: account.name,
            type: 'asset-row',
            className: 'asset-row'
          };
          
          sortedEntries.forEach(entry => {
            const value = entry.accountValues[accountId] || 0;
            // Instead of calculating preferredValue synchronously, do:
            //   const cellKey = `${entry.id}-${accountId}`;
            //   if (!convertedValues[cellKey]) triggerConversion(value, account.currency, preferredCurrency, entry.date, cellKey, entry.exchangeRates);
            //   accountRow[`${entry.id}-preferred`] = convertedValues[cellKey] || '...';
            let preferredValue: number;
            const rate = entry.exchangeRates?.[`${account.currency}-${preferredCurrency}`];
            if (typeof rate === 'number' && isFinite(rate) && rate > 0) {
              preferredValue = value * rate;
            } else {
              preferredValue = convertCurrencySync(value, account.currency, preferredCurrency);
            }
            
            accountRow[`${entry.id}-original`] = value === 0 ? '-' : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            accountRow[`${entry.id}-preferred`] = preferredValue === 0 ? '-' : formatCurrency(preferredValue, preferredCurrency);
          });
          
          dataSource.push(accountRow);
        });
      }
    });



    // Add Liability categories and individual accounts
    const liabilityCategories = Array.from(new Set(liabilityAccounts.map(id => accountInfoMap[id].category))).sort();
    liabilityCategories.forEach(category => {
      const categoryAccounts = liabilityAccounts.filter(id => accountInfoMap[id].category === category);
      if (categoryAccounts.length > 0) {
        // Category total row
        const categoryRow: any = {
          key: `liability-category-${category}`,
          account: category,
          type: 'liability-category-sum',
          className: 'liability-category-sum'
        };
        
        sortedEntries.forEach(entry => {
          const categoryTotal = categoryAccounts.reduce((sum, accId) => {
            const value = entry.accountValues[accId] || 0;
            const account = accounts.find(acc => acc.id === accId);
            const currencyCode = account?.currency || 'USD';
            
            // Use stored exchange rate if available, otherwise use current rate
            const rate = entry.exchangeRates?.[`${currencyCode}-${preferredCurrency}`];
            if (typeof rate === 'number' && isFinite(rate) && rate > 0) {
              return sum + (value * rate);
            } else {
              return sum + convertCurrencySync(value, currencyCode, preferredCurrency);
            }
          }, 0);
          
          categoryRow[`${entry.id}-original`] = '-';
          categoryRow[`${entry.id}-preferred`] = categoryTotal === 0 ? '-' : formatCurrency(categoryTotal, preferredCurrency);
        });
        
        dataSource.push(categoryRow);

        // Individual account rows
        categoryAccounts.forEach(accountId => {
          const account = accounts.find(acc => acc.id === accountId);
          if (!account) return;

          const accountRow: any = {
            key: accountId,
            account: account.name,
            type: 'liability-row',
            className: 'liability-row'
        };
          
          sortedEntries.forEach(entry => {
            const value = entry.accountValues[accountId] || 0;
            // Instead of calculating preferredValue synchronously, do:
            //   const cellKey = `${entry.id}-${accountId}`;
            //   if (!convertedValues[cellKey]) triggerConversion(value, account.currency, preferredCurrency, entry.date, cellKey, entry.exchangeRates);
            //   accountRow[`${entry.id}-preferred`] = convertedValues[cellKey] || '...';
            let preferredValue: number;
            const rate = entry.exchangeRates?.[`${account.currency}-${preferredCurrency}`];
            if (typeof rate === 'number' && isFinite(rate) && rate > 0) {
              preferredValue = value * rate;
            } else {
              preferredValue = convertCurrencySync(value, account.currency, preferredCurrency);
            }
            
            accountRow[`${entry.id}-original`] = value === 0 ? '-' : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            accountRow[`${entry.id}-preferred`] = preferredValue === 0 ? '-' : formatCurrency(preferredValue, preferredCurrency);
          });
          
          dataSource.push(accountRow);
        });
      }
    });

    return dataSource;
  };

  // Generate columns for the table
  const generateColumns = () => {
    const columns: any[] = [
      {
        title: <span className="text-sm font-medium">Account</span>,
        dataIndex: 'account',
        key: 'account',
        width: 200,
        fixed: 'left',
        render: (text: string, record: any) => {
          const isCategory = record.type.includes('category-sum');
          const isNetWorth = record.type === 'networth';
          
          let className = 'font-medium';
          if (isNetWorth) {
            className = 'font-bold';
          } else if (isCategory) {
            className = 'font-semibold';
          }
          
          return (
            <span className={className}>
              {isCategory ? `  ${text}` : text}
            </span>
          );
        }
      }
    ];

    if (effectiveShowOriginalCurrency) {
      columns.push({
        title: <span className="text-sm font-medium">Currency</span>,
        dataIndex: 'currency',
        key: 'currency',
        width: 80,
        fixed: 'left',
        render: (text: string, record: any) => {
          // For individual account rows, show the account's original currency
          if (record.type === 'asset-row' || record.type === 'liability-row') {
            const account = accounts.find(acc => acc.id === record.key);
            if (account) {
              return (
                <span className="font-mono text-xs text-gray-600">{account.currency}</span>
              );
            }
          }
          // For summary rows (net worth, totals, categories), show a dash
          return <span className="font-mono text-xs text-gray-400">-</span>;
        }
      });
    }

    sortedEntries.forEach((entry, index) => {
      const dateStr = formatDate(entry.date);
      const isLastEntry = index === sortedEntries.length - 1;
      
      if (effectiveShowOriginalCurrency) {
        columns.push(
          {
            title: (
              <div className="text-center">
                <div className="text-sm font-medium">{dateStr}</div>
                <div className="text-xs text-gray-400">Original</div>
              </div>
            ),
            dataIndex: `${entry.id}-original`,
            key: `${entry.id}-original`,
            width: 120,
            align: 'right' as const,
            fixed: isLastEntry ? 'right' : undefined,
            className: isLastEntry ? 'latest-data-accent' : undefined,
            render: (text: string, record: any) => {
              // Only allow editing for individual account rows, not totals
              if (record.type === 'asset-row' || record.type === 'liability-row') {
                const accountId = record.key;
                const isEditing = editingCell && editingCell.entryId === entry.id && editingCell.accountId === accountId && editingCell.column === 'original';
                
                if (isEditing) {
                  return (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleEditSave}
                      onKeyPress={handleKeyPress}
                      autoFocus
                      size="small"
                      style={{ textAlign: 'right' }}
                    />
                  );
                }
                
                const account = accounts.find(acc => acc.id === accountId);
                if (account) {
                  const value = entry.accountValues[accountId] || 0;
                  return (
                    <span 
                      className="font-mono text-sm cursor-pointer hover:bg-blue-50 px-1 rounded text-gray-700"
                      onClick={() => handleCellClick(entry.id, accountId, 'original', value)}
                    >
                      {text}
                    </span>
                  );
                }
              }
              
              return <span className="font-mono text-sm text-gray-700">{text}</span>;
            }
          },
          {
            title: (
              <div className="text-center">
                <div className="text-sm font-medium">{dateStr}</div>
                <div className="text-xs text-gray-400">{preferredCurrency}</div>
              </div>
            ),
            dataIndex: `${entry.id}-preferred`,
            key: `${entry.id}-preferred`,
            width: 120,
            align: 'right' as const,
            fixed: isLastEntry ? 'right' : undefined, // <-- Now also fixed for the latest date
            render: (text: string, record: any) => {
              // Only allow editing for individual account rows, not totals
              if (record.type === 'asset-row' || record.type === 'liability-row') {
                const accountId = record.key;
                const isEditing = editingCell && editingCell.entryId === entry.id && editingCell.accountId === accountId && editingCell.column === 'usd';
                
                if (isEditing) {
                  return (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleEditSave}
                      onKeyPress={handleKeyPress}
                      autoFocus
                      size="small"
                      style={{ textAlign: 'right' }}
                    />
                  );
                }
                
                const account = accounts.find(acc => acc.id === accountId);
                if (account) {
                  const value = entry.accountValues[accountId] || 0;
                  
                  // Use stored exchange rate if available, otherwise use current rate
                  let preferredValue: number;
                  const rate = entry.exchangeRates?.[`${account.currency}-${preferredCurrency}`];
                  if (typeof rate === 'number' && isFinite(rate) && rate > 0) {
                    preferredValue = value * rate;
                  } else {
                    preferredValue = convertCurrencySync(value, account.currency, preferredCurrency);
                  }
                  
                  return (
                    <span 
                      className="font-mono text-sm cursor-pointer hover:bg-blue-50 px-1 rounded"
                      onClick={() => handleCellClick(entry.id, accountId, 'usd', preferredValue)}
                    >
                      {text}
                    </span>
                  );
                }
              }
              
              return <span className="font-mono text-sm">{text}</span>;
            }
          }
        );
      } else {
        columns.push({
          title: <span className="text-sm font-medium">{dateStr}</span>,
          dataIndex: `${entry.id}-preferred`,
          key: `${entry.id}-preferred`,
          width: 120,
          align: 'right' as const,
          fixed: isLastEntry ? 'right' : undefined,
          className: isLastEntry ? 'latest-data-accent' : undefined,
          render: (text: string, record: any) => {
            // Only allow editing for individual account rows, not totals
            if (record.type === 'asset-row' || record.type === 'liability-row') {
              const accountId = record.key;
              const isEditing = editingCell && editingCell.entryId === entry.id && editingCell.accountId === accountId && editingCell.column === 'usd';
              
              if (isEditing) {
                return (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleEditSave}
                    onKeyPress={handleKeyPress}
                    autoFocus
                    size="small"
                    style={{ textAlign: 'right' }}
                  />
                );
              }
              
              const account = accounts.find(acc => acc.id === accountId);
              if (account) {
                const value = entry.accountValues[accountId] || 0;
                
                // Use stored exchange rate if available, otherwise use current rate
                let preferredValue: number;
                const rate = entry.exchangeRates?.[`${account.currency}-${preferredCurrency}`];
                if (typeof rate === 'number' && isFinite(rate) && rate > 0) {
                  preferredValue = value * rate;
                } else {
                  preferredValue = convertCurrencySync(value, account.currency, preferredCurrency);
                }
                
                return (
                  <span 
                    className="font-mono text-sm cursor-pointer hover:bg-blue-50 px-1 rounded"
                    onClick={() => handleCellClick(entry.id, accountId, 'usd', preferredValue)}
                  >
                    {text}
                  </span>
                );
              }
            }
            
            return <span className="font-mono text-sm">{text}</span>;
          }
        });
      }
    });

    return columns;
  };

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-0">ACCOUNT DETAILS BY DATE</h3>
        <Space>
          {!allAccountsSameCurrency && (
            <Checkbox
              checked={effectiveShowOriginalCurrency}
              onChange={(e) => setShowOriginalCurrency(e.target.checked)}
            >
              Show original + {preferredCurrency}
            </Checkbox>
          )}
        </Space>
      </div>
      
      <div className="modern-ant-table" ref={tableRef}>
        <style>{`
          .latest-data-accent {
            border-left: 3px solid #1890ff !important;
          }
          .sum-row .latest-data-accent,
          .latest-data-accent.sum-row,
          .ant-table-row.sum-row .latest-data-accent {
            border-left: 3px solid #1890ff !important;
          }
        `}</style>
        <Table
          dataSource={generateDataSource()}
          columns={generateColumns()}
          pagination={false}
          scroll={{ x: 'max-content', y: 600 }}
          size="small"
          bordered
          className="modern-ant-table"
          rowClassName={(record, index) => {
            const baseClass = record.className || '';
            // Add 'sum-row' for net worth and category sum rows
            const isSumRow = record.type === 'networth' || record.type?.includes('category-sum');
            const sumRowClass = isSumRow ? 'sum-row' : '';
            // Freeze only the Net Worth row
            if (record.key === 'net-worth') {
              return `${baseClass} sticky top-0 z-10 bg-white border-b-2 ${sumRowClass}`;
            }
            return `${baseClass} ${sumRowClass}`;
          }}
        />
      </div>
    </div>
  );
} 