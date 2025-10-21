import React, { useState, useRef } from 'react';
import { Account, NetWorthEntry } from '../types';

interface DataImportExportProps {
  accounts: Account[];
  entries: NetWorthEntry[];
  onImportData: (accounts: Account[], entries: NetWorthEntry[]) => void;
  preferredCurrency: string;
}

interface ExportData {
  version: string;
  exportDate: string;
  preferredCurrency: string;
  accounts: Account[];
  entries: NetWorthEntry[];
}

export default function DataImportExport({ accounts, entries, onImportData, preferredCurrency }: DataImportExportProps) {
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSampleData = (): ExportData => {
    // Start with user's existing accounts
    const userAccounts = accounts.map(account => ({
      ...account,
      id: `sample-${account.id}` // Use sample prefix to avoid conflicts
    }));

    // Add some predefined examples if user doesn't have many accounts
    const predefinedAccounts: Account[] = [];
    
    // Only add predefined accounts if user has less than 5 accounts
    if (accounts.length < 5) {
      const categories = ['cash', 'stocks', 'crypto', 'properties', 'other-assets', 'mortgage', 'loans', 'credit-card-debt', 'other-liabilities'];
      const sampleNames = [
        'Emergency Fund', 'Stock Portfolio', 'Bitcoin', 'Primary Residence', 'Precious Metals',
        'Mortgage', 'Car Loan', 'Credit Card', 'Medical Debt'
      ];
      
      categories.forEach((category, index) => {
        if (!userAccounts.some(acc => acc.category === category)) {
          predefinedAccounts.push({
            id: `sample-pred-${index}`,
            name: sampleNames[index] || `Sample ${category}`,
            type: category === 'cash' || category === 'stocks' || category === 'crypto' || category === 'properties' || category === 'other-assets' ? 'asset' : 'liability',
            category: category,
            currency: preferredCurrency
          });
        }
      });
    }

    const sampleAccounts = [...userAccounts, ...predefinedAccounts];

    // Generate sample entries with realistic values for each account
    const generateSampleValues = (accountId: string, baseValue: number, dateIndex: number): number => {
      // Add some realistic variation based on account type and date
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const trend = dateIndex * 0.02; // Small upward trend over time
      return Math.round(baseValue * (1 + variation + trend));
    };

    const sampleEntries: NetWorthEntry[] = [
      {
        id: 'entry-1',
        date: '2024-01-01',
        accountValues: sampleAccounts.reduce((acc, account, index) => {
          // Generate realistic base values based on account type
          let baseValue = 10000; // Default base value
          
          if (account.type === 'asset') {
            switch (account.category) {
              case 'cash': baseValue = 5000 + (index * 2000); break;
              case 'stocks': baseValue = 25000 + (index * 15000); break;
              case 'crypto': baseValue = 3000 + (index * 2000); break;
              case 'properties': baseValue = 200000 + (index * 50000); break;
              case 'other-assets': baseValue = 5000 + (index * 3000); break;
            }
          } else {
            switch (account.category) {
              case 'mortgage': baseValue = 250000; break;
              case 'loans': baseValue = 15000 + (index * 5000); break;
              case 'credit-card-debt': baseValue = 2000 + (index * 1000); break;
              case 'other-liabilities': baseValue = 3000 + (index * 2000); break;
            }
          }
          
          acc[account.id] = generateSampleValues(account.id, baseValue, 0);
          return acc;
        }, {} as { [accountId: string]: number }),
        totalAssets: 0, // Will be calculated
        totalLiabilities: 0, // Will be calculated
        netWorth: 0 // Will be calculated
      },
      {
        id: 'entry-2',
        date: '2024-01-15',
        accountValues: sampleAccounts.reduce((acc, account, index) => {
          let baseValue = 10000;
          
          if (account.type === 'asset') {
            switch (account.category) {
              case 'cash': baseValue = 5000 + (index * 2000); break;
              case 'stocks': baseValue = 25000 + (index * 15000); break;
              case 'crypto': baseValue = 3000 + (index * 2000); break;
              case 'properties': baseValue = 200000 + (index * 50000); break;
              case 'other-assets': baseValue = 5000 + (index * 3000); break;
            }
          } else {
            switch (account.category) {
              case 'mortgage': baseValue = 250000; break;
              case 'loans': baseValue = 15000 + (index * 5000); break;
              case 'credit-card-debt': baseValue = 2000 + (index * 1000); break;
              case 'other-liabilities': baseValue = 3000 + (index * 2000); break;
            }
          }
          
          acc[account.id] = generateSampleValues(account.id, baseValue, 1);
          return acc;
        }, {} as { [accountId: string]: number }),
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0
      },
      {
        id: 'entry-3',
        date: '2024-02-01',
        accountValues: sampleAccounts.reduce((acc, account, index) => {
          let baseValue = 10000;
          
          if (account.type === 'asset') {
            switch (account.category) {
              case 'cash': baseValue = 5000 + (index * 2000); break;
              case 'stocks': baseValue = 25000 + (index * 15000); break;
              case 'crypto': baseValue = 3000 + (index * 2000); break;
              case 'properties': baseValue = 200000 + (index * 50000); break;
              case 'other-assets': baseValue = 5000 + (index * 3000); break;
            }
          } else {
            switch (account.category) {
              case 'mortgage': baseValue = 250000; break;
              case 'loans': baseValue = 15000 + (index * 5000); break;
              case 'credit-card-debt': baseValue = 2000 + (index * 1000); break;
              case 'other-liabilities': baseValue = 3000 + (index * 2000); break;
            }
          }
          
          acc[account.id] = generateSampleValues(account.id, baseValue, 2);
          return acc;
        }, {} as { [accountId: string]: number }),
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0
      }
    ];

    // Calculate totals for each entry
    sampleEntries.forEach(entry => {
      entry.totalAssets = Object.entries(entry.accountValues).reduce((sum, [accountId, value]) => {
        const account = sampleAccounts.find(acc => acc.id === accountId);
        return sum + (account?.type === 'asset' ? value : 0);
      }, 0);
      
      entry.totalLiabilities = Object.entries(entry.accountValues).reduce((sum, [accountId, value]) => {
        const account = sampleAccounts.find(acc => acc.id === accountId);
        return sum + (account?.type === 'liability' ? value : 0);
      }, 0);
      
      entry.netWorth = entry.totalAssets - entry.totalLiabilities;
    });

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      preferredCurrency: 'USD',
      accounts: sampleAccounts,
      entries: sampleEntries
    };
  };

  const generateSampleCSV = (): string => {
    // Start with user's existing accounts
    const userAccountRows = accounts.map(account => {
      const baseValue = account.type === 'asset' ? 10000 : 5000;
      const variation1 = Math.round(baseValue * (0.95 + Math.random() * 0.1)); // ±5% variation
      const variation2 = Math.round(baseValue * (0.95 + Math.random() * 0.1));
      const variation3 = Math.round(baseValue * (0.95 + Math.random() * 0.1));
      
      return `${account.name},${account.type},${account.category},${account.currency},${variation1},${variation2},${variation3}`;
    });

    // Add some predefined examples if user doesn't have many accounts
    const predefinedRows: string[] = [];
    
    if (accounts.length < 5) {
      const sampleData = [
        'Emergency Fund,asset,cash,' + preferredCurrency + ',10000,10000,10000',
        'Stock Portfolio,asset,stocks,' + preferredCurrency + ',50000,52000,54000',
        'Bitcoin,asset,crypto,' + preferredCurrency + ',8000,8500,9000',
        'Primary Residence,asset,properties,' + preferredCurrency + ',300000,300000,300000',
        'Mortgage,liability,mortgage,' + preferredCurrency + ',280000,279000,278000',
        'Credit Card,liability,credit-card-debt,' + preferredCurrency + ',2000,1800,2200'
      ];
      
      // Only add predefined rows for categories the user doesn't have
      const userCategories = new Set(accounts.map(acc => acc.category));
      const categoryMap: { [key: string]: string } = {
        'cash': 'Emergency Fund,asset,cash,' + preferredCurrency + ',10000,10000,10000',
        'stocks': 'Stock Portfolio,asset,stocks,' + preferredCurrency + ',50000,52000,54000',
        'crypto': 'Bitcoin,asset,crypto,' + preferredCurrency + ',8000,8500,9000',
        'properties': 'Primary Residence,asset,properties,' + preferredCurrency + ',300000,300000,300000',
        'mortgage': 'Mortgage,liability,mortgage,' + preferredCurrency + ',280000,279000,278000',
        'credit-card-debt': 'Credit Card,liability,credit-card-debt,' + preferredCurrency + ',2000,1800,2200'
      };
      
      Object.entries(categoryMap).forEach(([category, row]) => {
        if (!userCategories.has(category)) {
          predefinedRows.push(row);
        }
      });
    }

    const allRows = [...userAccountRows, ...predefinedRows];
    const csvContent = `account_name,type,category,currency,2024-01-01,2024-01-15,2024-02-01\n${allRows.join('\n')}`;
    
    return csvContent;
  };

  const parseCSV = (csvContent: string): { accounts: Account[], entries: NetWorthEntry[] } => {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Validate headers
    const requiredHeaders = ['account_name', 'type', 'category', 'currency'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Find date columns (columns after the required headers)
    const dateColumns = headers.slice(4); // Skip account_name, type, category, currency
    if (dateColumns.length === 0) {
      throw new Error('No date columns found. Please include at least one date column.');
    }

    const data = lines.slice(1);
    const accounts: Account[] = [];
    const entryMap = new Map<string, { [accountId: string]: number }>();

    data.forEach((line, rowIndex) => {
      const values = line.split(',').map(v => v.trim());
      const [accountName, accountType, accountCategory, currency, ...dateValues] = values;
      
      // Validate account type
      if (accountType !== 'asset' && accountType !== 'liability') {
        throw new Error(`Invalid account type at line ${rowIndex + 2}: ${accountType}. Must be 'asset' or 'liability'`);
      }

      // Create account
      const accountId = `${accountName.toLowerCase().replace(/\s+/g, '-')}-${accountType}`;
      const account: Account = {
        id: accountId,
        name: accountName,
        type: accountType as 'asset' | 'liability',
        category: accountCategory,
        currency: currency
      };
      accounts.push(account);

      // Process date values
      dateValues.forEach((valueStr, colIndex) => {
        const date = dateColumns[colIndex];
        if (!date) return; // Skip if no date column

        const value = parseFloat(valueStr);
        if (isNaN(value)) {
          throw new Error(`Invalid value at line ${rowIndex + 2}, column ${colIndex + 5}: ${valueStr}`);
        }

        // Add to entry
        if (!entryMap.has(date)) {
          entryMap.set(date, {});
        }
        entryMap.get(date)![accountId] = value;
      });
    });

    const entries: NetWorthEntry[] = Array.from(entryMap.entries()).map(([date, accountValues]) => {
      const totalAssets = Object.entries(accountValues).reduce((sum, [accountId, value]) => {
        const account = accounts.find(acc => acc.id === accountId);
        return sum + (account?.type === 'asset' ? value : 0);
      }, 0);
      
      const totalLiabilities = Object.entries(accountValues).reduce((sum, [accountId, value]) => {
        const account = accounts.find(acc => acc.id === accountId);
        return sum + (account?.type === 'liability' ? value : 0);
      }, 0);

      return {
        id: `entry-${date}`,
        date,
        accountValues,
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities
      };
    });

    return { accounts, entries };
  };

  const handleExport = () => {
    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      preferredCurrency,
      accounts,
      entries
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `net-worth-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Add this function to generate CSV from current data
  const handleExportCSV = () => {
    if (!accounts.length || !entries.length) return;
    // Collect all unique dates from entries
    const allDates = Array.from(new Set(entries.map(e => e.date))).sort();
    // Header: account_name,type,category,currency,<date1>,<date2>,...
    const header = ['account_name','type','category','currency',...allDates];
    // Build rows for each account
    const rows = accounts.map(account => {
      const row = [account.name, account.type, account.category, account.currency];
      allDates.forEach(date => {
        // Find entry for this date
        const entry = entries.find(e => e.date === date);
        // Get value for this account in this entry
        row.push(entry && entry.accountValues[account.id] !== undefined ? String(entry.accountValues[account.id]) : '');
      });
      return row.join(',');
    });
    const csvContent = header.join(',') + '\n' + rows.join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `net-worth-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSample = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const sampleData = generateSampleData();
      const dataStr = JSON.stringify(sampleData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sample-net-worth-data.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const csvContent = generateSampleCSV();
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sample-net-worth-data.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('importing');
    setImportMessage('Reading file...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let newAccounts: Account[];
        let newEntries: NetWorthEntry[];

        // Detect file format and parse accordingly
        if (file.name.toLowerCase().endsWith('.csv')) {
          // Parse CSV
          const { accounts: parsedAccounts, entries: parsedEntries } = parseCSV(content);
          
          // Map accounts by name to existing accounts or create new ones
          const accountNameMap: { [key: string]: string } = {};
          newAccounts = parsedAccounts.map(account => {
            // Try to find existing account with same name, type, and category
            const existingAccount = accounts.find(existing => 
              existing.name.toLowerCase() === account.name.toLowerCase() && 
              existing.type === account.type &&
              existing.category === account.category
            );
            
            if (existingAccount) {
              // Use existing account ID
              const key = `${account.name}-${account.type}-${account.category}`;
              accountNameMap[key] = existingAccount.id;
              return existingAccount;
            } else {
              // Create new account with new ID
              const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
              const key = `${account.name}-${account.type}-${account.category}`;
              accountNameMap[key] = newId;
              return {
                ...account,
                id: newId
              };
            }
          });
          
          // Update entry account IDs to use the mapped account IDs
          newEntries = parsedEntries.map(entry => ({
            ...entry,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            accountValues: Object.keys(entry.accountValues).reduce((acc, oldAccountId) => {
              // Find the account name that corresponds to this old ID
              const account = parsedAccounts.find(acc => acc.id === oldAccountId);
              if (account) {
                const key = `${account.name}-${account.type}-${account.category}`;
                if (accountNameMap[key]) {
                  acc[accountNameMap[key]] = entry.accountValues[oldAccountId];
                }
              }
              return acc;
            }, {} as { [accountId: string]: number })
          }));
        } else {
          // Parse JSON
          const jsonData: ExportData = JSON.parse(content);

          // Validate the imported data
          if (!jsonData.version || !jsonData.accounts || !jsonData.entries) {
            throw new Error('Invalid data format. Please use a valid export file.');
          }

          // Validate accounts structure
          if (!Array.isArray(jsonData.accounts) || !jsonData.accounts.every(acc => 
            acc.id && acc.name && acc.type && acc.category && acc.currency
          )) {
            throw new Error('Invalid accounts data structure.');
          }

          // Validate entries structure
          if (!Array.isArray(jsonData.entries) || !jsonData.entries.every(entry => 
            entry.id && entry.date && entry.accountValues && 
            typeof entry.totalAssets === 'number' && 
            typeof entry.totalLiabilities === 'number' && 
            typeof entry.netWorth === 'number'
          )) {
            throw new Error('Invalid entries data structure.');
          }

          // Generate new IDs for imported data to avoid conflicts
          newAccounts = jsonData.accounts.map(account => ({
            ...account,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
          }));

          newEntries = jsonData.entries.map(entry => ({
            ...entry,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
          }));

          // Update account IDs in entries
          const accountIdMap: { [oldId: string]: string } = {};
          jsonData.accounts.forEach((oldAccount, index) => {
            accountIdMap[oldAccount.id] = newAccounts[index].id;
          });

          newEntries = newEntries.map(entry => ({
            ...entry,
            accountValues: Object.keys(entry.accountValues).reduce((acc, oldAccountId) => {
              const newAccountId = accountIdMap[oldAccountId];
              if (newAccountId) {
                acc[newAccountId] = entry.accountValues[oldAccountId];
              }
              return acc;
            }, {} as { [accountId: string]: number })
          }));
        }

        onImportData(newAccounts, newEntries);
        setImportStatus('success');
        setImportMessage(`Successfully imported ${newAccounts.length} accounts and ${newEntries.length} entries.`);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        setImportStatus('error');
        setImportMessage(error instanceof Error ? error.message : 'Failed to import data.');
      }
    };

    reader.onerror = () => {
      setImportStatus('error');
      setImportMessage('Failed to read the file.');
    };

    reader.readAsText(file);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const getStatusColor = () => {
    switch (importStatus) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'importing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const sampleCSV = generateSampleCSV();

  return (
    <div className="bg-white rounded shadow p-4 sm:p-6 mt-4">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Data Import & Export</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Import Section */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Import Data</h3>
          <p className="text-sm text-gray-600 mb-4">
            Import accounts and entries from JSON or CSV files.
          </p>
          
          <div className="text-sm text-gray-700 mb-4">
            <div className="font-medium">Note:</div>
            <div>• Accounts with matching names will be mapped to existing accounts</div>
            <div>• New accounts will be created for unmatched names</div>
            <div>• Entries for existing dates will be replaced</div>
            <div>• New entries will be added for new dates</div>
            <div>• Make sure to backup current data first</div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={importStatus === 'importing'}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {importStatus === 'importing' ? 'Importing...' : 'Import Data (JSON/CSV)'}
          </button>

          {/* Sample File Section */}
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Sample Files:</span>
              <div className="space-x-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                <button
                  onClick={() => handleDownloadSample('json')}
                  className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleDownloadSample('csv')}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  CSV
                </button>
              </div>
            </div>
            
            {showPreview && (
              <div className="mt-3 space-y-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">JSON format:</div>
                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-32">
{JSON.stringify(generateSampleData(), null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">CSV format:</div>
                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-32">
{sampleCSV}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Section */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Export Data</h3>
          <p className="text-sm text-gray-600 mb-4">
            Export all your accounts and entries to a JSON file for backup or transfer.
          </p>
          <div className="space-y-2 text-sm text-gray-700">
            <div>• {accounts.length} accounts</div>
            <div>• {entries.length} entries</div>
            <div>• Preferred currency: {preferredCurrency}</div>
          </div>
          <button
            onClick={handleExport}
            className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Export Data
          </button>
          <button
            onClick={handleExportCSV}
            className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Export as CSV
          </button>
          {/* CSV Preview */}
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-700">CSV Preview:</span>
              <button
                onClick={() => setShowExportPreview(v => !v)}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors ml-2"
              >
                {showExportPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
            {showExportPreview && (
              <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-32">
                {(() => {
                  if (!accounts.length || !entries.length) return 'No data to preview.';
                  // Collect all unique dates from entries
                  const allDates = Array.from(new Set(entries.map(e => e.date))).sort();
                  const header = ['account_name','type','category','currency',...allDates];
                  const rows = accounts.map(account => {
                    const row = [account.name, account.type, account.category, account.currency];
                    allDates.forEach(date => {
                      const entry = entries.find(e => e.date === date);
                      row.push(entry && entry.accountValues[account.id] !== undefined ? String(entry.accountValues[account.id]) : '');
                    });
                    return row;
                  });
                  const previewRows = rows.slice(0, 5); // Show only first 5 rows
                  return [header, ...previewRows].map(r => r.join(',')).join('\n') + (rows.length > 5 ? `\n... (${rows.length - 5} more rows)` : '');
                })()}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Status Message */}
      {importStatus !== 'idle' && (
        <div className={`mt-4 p-3 rounded ${importStatus === 'success' ? 'bg-green-50 border border-green-200' : 
          importStatus === 'error' ? 'bg-red-50 border border-red-200' : 
          'bg-blue-50 border border-blue-200'}`}>
          <div className={`text-sm font-medium ${getStatusColor()}`}>
            {importStatus === 'importing' && 'Importing data...'}
            {importStatus === 'success' && 'Import successful!'}
            {importStatus === 'error' && 'Import failed'}
          </div>
          {importMessage && (
            <div className={`text-sm mt-1 ${getStatusColor()}`}>
              {importMessage}
            </div>
          )}
        </div>
      )}

      {/* Data Preview */}
      <div className="mt-6 border-t pt-6">
        <h3 className="text-lg font-semibold mb-3">Current Data Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Total Accounts</div>
            <div className="text-xl font-bold text-gray-800">{accounts.length}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Total Entries</div>
            <div className="text-xl font-bold text-gray-800">{entries.length}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Display Currency</div>
            <div className="text-xl font-bold text-gray-800">{preferredCurrency}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 