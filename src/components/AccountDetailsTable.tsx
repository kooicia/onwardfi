import React, { useState } from 'react';
import { Table, Input, Button, Space, Typography, Checkbox } from 'antd';
import { NetWorthEntry, Account } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currencyConverter';

interface AccountDetailsTableProps {
  entries: NetWorthEntry[];
  accounts: Account[];
  preferredCurrency: string;
  onUpdateEntryValue: (entryId: string, accountId: string, newValue: number) => void;
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

  const handleCellClick = (entryId: string, accountId: string, column: 'original' | 'usd', currentValue: number) => {
    setEditingCell({ entryId, accountId, column });
    // Format the value to show 2 decimal places when entering edit mode
    setEditValue(currentValue.toFixed(2));
  };

  const handleEditSave = () => {
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

  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Check if all accounts have the same currency as preferred currency
  const allAccountsSameCurrency = accounts.length > 0 && accounts.every(account => account.currency === preferredCurrency);
  
  // If all accounts have the same currency as preferred, force showOriginalCurrency to false
  const effectiveShowOriginalCurrency = allAccountsSameCurrency ? false : showOriginalCurrency;

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
          return sum + convertCurrency(value, currencyCode, 'USD');
        }, 0);
        
        const totalLiabilitiesUsd = liabilityAccounts.reduce((sum, accId) => {
          const value = entry.accountValues[accId] || 0;
          const account = accounts.find(acc => acc.id === accId);
          const currencyCode = account?.currency || 'USD';
          return sum + convertCurrency(value, currencyCode, 'USD');
        }, 0);
        
        const netWorthUsd = totalAssetsUsd - totalLiabilitiesUsd;
        const netWorthPreferred = convertCurrency(netWorthUsd, 'USD', preferredCurrency);
        
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
            return sum + convertCurrency(value, currencyCode, preferredCurrency);
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
            const preferredValue = convertCurrency(value, account.currency, preferredCurrency);
            
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
            return sum + convertCurrency(value, currencyCode, preferredCurrency);
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
            const preferredValue = convertCurrency(value, account.currency, preferredCurrency);
            
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
        title: 'Account',
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
        title: 'Currency',
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

    sortedEntries.forEach(entry => {
      const dateStr = new Date(entry.date).toLocaleDateString();
      
      if (effectiveShowOriginalCurrency) {
        columns.push(
          {
            title: (
              <div className="text-center">
                <div className="font-medium">{dateStr}</div>
                <div className="text-xs text-gray-400">Original</div>
              </div>
            ),
            dataIndex: `${entry.id}-original`,
            key: `${entry.id}-original`,
            width: 120,
            align: 'right' as const,
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
                <div className="font-medium">{dateStr}</div>
                <div className="text-xs text-gray-400">{preferredCurrency}</div>
              </div>
            ),
            dataIndex: `${entry.id}-preferred`,
            key: `${entry.id}-preferred`,
            width: 120,
            align: 'right' as const,
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
                  const preferredValue = convertCurrency(value, account.currency, preferredCurrency);
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
          title: dateStr,
          dataIndex: `${entry.id}-preferred`,
          key: `${entry.id}-preferred`,
          width: 120,
          align: 'right' as const,
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
                const preferredValue = convertCurrency(value, account.currency, preferredCurrency);
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
        <Typography.Title level={3} className="!mb-0">Account Details by Date</Typography.Title>
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
      
      <div className="modern-ant-table">
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
            // Freeze only the Net Worth row
            if (record.key === 'net-worth') {
              return `${baseClass} sticky top-0 z-10 bg-white border-b-2`;
            }
            return baseClass;
          }}
        />
      </div>
    </div>
  );
} 