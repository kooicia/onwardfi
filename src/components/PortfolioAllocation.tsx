import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Account, NetWorthEntry, AccountCategory } from '../types';
import { formatCurrency } from '../utils/currencyConverter';

interface PortfolioAllocationProps {
  accounts: Account[];
  entries: NetWorthEntry[];
  preferredCurrency: string;
  assetCategories: AccountCategory[];
  liabilityCategories: AccountCategory[];
  onImportData?: (accounts: Account[], entries: NetWorthEntry[]) => void;
}

interface AllocationData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  type: 'asset' | 'liability';
  category: string;
}

interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
  color?: string;
  accounts: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

// Category colors matching Dashboard
const CATEGORY_COLORS: { [key: string]: string } = {
  cash: '#f59e42',
  stocks: '#3b82f6',
  crypto: '#8b5cf6',
  properties: '#10b981',
  'other-assets': '#6366f1',
  mortgage: '#ef4444',
  loans: '#fbbf24',
  'credit-card-debt': '#f43f5e',
  'other-liabilities': '#64748b',
};

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
  '#87CEEB', '#DDA0DD', '#F0E68C', '#98FB98', '#F4A460'
];

const PortfolioAllocation: React.FC<PortfolioAllocationProps> = ({
  accounts,
  entries,
  preferredCurrency,
  assetCategories,
  liabilityCategories,
  onImportData
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewType, setViewType] = useState<'by-account' | 'by-category'>('by-category');
  const [portfolioTab, setPortfolioTab] = useState<'assets' | 'liabilities'>('assets');

  // Helper function for consistent currency formatting (matching Dashboard)
  const formatCurrencyForDisplay = (value: number) => {
    return formatCurrency(value, preferredCurrency);
  };

  // Generate sample data for demonstration
  const generateSampleData = () => {
    if (!onImportData) return;
    
    // Always create fresh sample accounts (don't use existing accounts to avoid data issues)
    const sampleAccounts: Account[] = [
      { id: 'sample-1', name: 'Emergency Fund', type: 'asset', category: 'cash', currency: preferredCurrency },
      { id: 'sample-2', name: 'Stock Portfolio', type: 'asset', category: 'stocks', currency: preferredCurrency },
      { id: 'sample-3', name: 'Bitcoin', type: 'asset', category: 'crypto', currency: preferredCurrency },
      { id: 'sample-4', name: 'Primary Residence', type: 'asset', category: 'properties', currency: preferredCurrency },
      { id: 'sample-5', name: 'Mortgage', type: 'liability', category: 'mortgage', currency: preferredCurrency },
      { id: 'sample-6', name: 'Credit Card', type: 'liability', category: 'credit-card-debt', currency: preferredCurrency }
    ];

    // Create sample entries
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const sampleEntries: NetWorthEntry[] = [
      {
        id: 'sample-entry-1',
        date: yesterday,
        accountValues: {
          [sampleAccounts[0].id]: 10000,
          [sampleAccounts[1].id]: 50000,
          [sampleAccounts[2].id]: 5000,
          [sampleAccounts[3].id]: 300000,
          [sampleAccounts[4].id]: 200000,
          [sampleAccounts[5].id]: 2000
        },
        totalAssets: 365000,
        totalLiabilities: 202000,
        netWorth: 163000
      },
      {
        id: 'sample-entry-2',
        date: today,
        accountValues: {
          [sampleAccounts[0].id]: 10500,
          [sampleAccounts[1].id]: 52000,
          [sampleAccounts[2].id]: 4800,
          [sampleAccounts[3].id]: 305000,
          [sampleAccounts[4].id]: 198000,
          [sampleAccounts[5].id]: 1800
        },
        totalAssets: 372300,
        totalLiabilities: 199800,
        netWorth: 172500
      }
    ];

    onImportData(sampleAccounts, sampleEntries);
  };

  // Get the latest entry or selected date entry
  const currentEntry = useMemo(() => {
    if (selectedDate) {
      return entries.find(entry => entry.date === selectedDate);
    }
    return entries.length > 0 ? entries[entries.length - 1] : null;
  }, [entries, selectedDate]);

  // Calculate allocation data (assets only)
  const allocationData = useMemo((): AllocationData[] => {
    if (!currentEntry) return [];

    const data: AllocationData[] = [];
    let totalAssets = 0;

    // Calculate total assets first
    Object.entries(currentEntry.accountValues).forEach(([accountId, value]) => {
      const account = accounts.find(acc => acc.id === accountId);
      if (account && account.type === 'asset' && value > 0) {
        let convertedValue = value;
        if (account.currency !== preferredCurrency && currentEntry.exchangeRates) {
          const pair = `${account.currency}-${preferredCurrency}`;
          const rate = currentEntry.exchangeRates[pair];
          if (rate && isFinite(rate) && rate > 0) {
            convertedValue = value * rate;
          }
        }
        totalAssets += convertedValue;
      }
    });

    // Process only assets with proper currency conversion
    Object.entries(currentEntry.accountValues).forEach(([accountId, value]) => {
      const account = accounts.find(acc => acc.id === accountId);
      
      // Only include assets (exclude liabilities)
      if (account && account.type === 'asset' && value > 0) {
        // Convert to preferred currency using stored exchange rates
        let convertedValue = value;
        if (account.currency !== preferredCurrency && currentEntry.exchangeRates) {
          const pair = `${account.currency}-${preferredCurrency}`;
          const rate = currentEntry.exchangeRates[pair];
          if (rate && isFinite(rate) && rate > 0) {
            convertedValue = value * rate;
          }
        }
        
        const percentage = totalAssets > 0 ? (convertedValue / totalAssets) * 100 : 0;
        const item = {
          name: account.name,
          value: convertedValue,
          percentage,
          color: CATEGORY_COLORS[account.category] || COLORS[data.length % COLORS.length],
          type: account.type,
          category: account.category
        };
        data.push(item);
      }
    });

    return data.sort((a, b) => b.value - a.value);
  }, [currentEntry, accounts, preferredCurrency]);

  // Calculate liability allocation data
  const liabilityAllocationData = useMemo((): AllocationData[] => {
    if (!currentEntry) return [];

    const data: AllocationData[] = [];
    let totalLiabilities = 0;

    // Calculate total liabilities first
    Object.entries(currentEntry.accountValues).forEach(([accountId, value]) => {
      const account = accounts.find(acc => acc.id === accountId);
      if (account && account.type === 'liability' && value > 0) {
        let convertedValue = value;
        if (account.currency !== preferredCurrency && currentEntry.exchangeRates) {
          const pair = `${account.currency}-${preferredCurrency}`;
          const rate = currentEntry.exchangeRates[pair];
          if (rate && isFinite(rate) && rate > 0) {
            convertedValue = value * rate;
          }
        }
        totalLiabilities += convertedValue;
      }
    });

    // Process only liabilities with proper currency conversion
    Object.entries(currentEntry.accountValues).forEach(([accountId, value]) => {
      const account = accounts.find(acc => acc.id === accountId);
      
      // Only include liabilities
      if (account && account.type === 'liability' && value > 0) {
        let convertedValue = value;
        if (account.currency !== preferredCurrency && currentEntry.exchangeRates) {
          const pair = `${account.currency}-${preferredCurrency}`;
          const rate = currentEntry.exchangeRates[pair];
          if (rate && isFinite(rate) && rate > 0) {
            convertedValue = value * rate;
          }
        }
        
        const percentage = totalLiabilities > 0 ? (convertedValue / totalLiabilities) * 100 : 0;
        const item = {
          name: account.name,
          value: convertedValue,
          percentage,
          color: CATEGORY_COLORS[account.category] || COLORS[data.length % COLORS.length],
          type: account.type,
          category: account.category
        };
        data.push(item);
      }
    });

    return data.sort((a, b) => b.value - a.value);
  }, [currentEntry, accounts, preferredCurrency]);

  // Calculate category breakdown (assets only)
  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    if (!currentEntry) return [];

    const categoryMap = new Map<string, CategoryBreakdown>();

    Object.entries(currentEntry.accountValues).forEach(([accountId, value]) => {
      const account = accounts.find(acc => acc.id === accountId);
      
      // Only include assets (exclude liabilities)
      if (account && account.type === 'asset' && value > 0) {
        // Convert to preferred currency using stored exchange rates
        let convertedValue = value;
        if (account.currency !== preferredCurrency && currentEntry.exchangeRates) {
          const pair = `${account.currency}-${preferredCurrency}`;
          const rate = currentEntry.exchangeRates[pair];
          if (rate && isFinite(rate) && rate > 0) {
            convertedValue = value * rate;
          }
        }

        const category = account.category;
        const categoryLabel = assetCategories.find(cat => cat.value === category)?.label || category;

        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category: categoryLabel,
            total: 0,
            percentage: 0,
            accounts: []
          });
        }

        const categoryData = categoryMap.get(category)!;
        categoryData.total += convertedValue;
        categoryData.accounts.push({
          name: account.name,
          value: convertedValue,
          percentage: 0
        });
      }
    });

    const totalValue = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0);

    return Array.from(categoryMap.values())
      .map((cat) => {
        // Find the category value to get the correct color (only from asset categories)
        const categoryValue = assetCategories.find(c => c.label === cat.category)?.value || '';
        
        return {
          ...cat,
          percentage: totalValue > 0 ? (cat.total / totalValue) * 100 : 0,
          color: CATEGORY_COLORS[categoryValue] || COLORS[0],
          accounts: cat.accounts.map(acc => ({
            ...acc,
            percentage: cat.total > 0 ? (acc.value / cat.total) * 100 : 0
          }))
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [currentEntry, accounts, assetCategories, preferredCurrency]);

  // Calculate trend data for accounts using last 12 entries
  const accountTrendData = useMemo(() => {
    if (!entries.length) return new Map<string, number[]>();
    
    const trendMap = new Map<string, number[]>();
    
    // Get last 12 entries, sorted by date
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recentEntries = sortedEntries.slice(-12); // Take last 12 entries
    
    if (recentEntries.length === 0) return trendMap;
    
    // Get all accounts that might have data (not just filtered by portfolioTab)
    // This ensures we capture data for accounts even if they're shown in different tabs
    const allAccountIds = new Set<string>();
    recentEntries.forEach(entry => {
      Object.keys(entry.accountValues).forEach(accountId => {
        allAccountIds.add(accountId);
      });
    });
    
    // Initialize trend map for all accounts that have data
    allAccountIds.forEach(accountId => {
      trendMap.set(accountId, []);
    });
    
    // Calculate account values for each entry
    recentEntries.forEach(entry => {
      allAccountIds.forEach(accountId => {
        const account = accounts.find(acc => acc.id === accountId);
        if (!account) return;
        
        const value = entry.accountValues[accountId] || 0;
        
        // Convert to preferred currency
        let convertedValue = value;
        if (account.currency !== preferredCurrency && entry.exchangeRates) {
          const pair = `${account.currency}-${preferredCurrency}`;
          const rate = entry.exchangeRates[pair];
          if (rate && isFinite(rate) && rate > 0) {
            convertedValue = value * rate;
          }
        }
        
        const trendArray = trendMap.get(accountId) || [];
        trendArray.push(convertedValue);
      });
    });
    
    return trendMap;
  }, [entries, accounts, preferredCurrency]);

  // Calculate trend data for categories using last 12 entries
  const categoryTrendData = useMemo(() => {
    if (!entries.length) return new Map<string, number[]>();
    
    const trendMap = new Map<string, number[]>();
    
    // Get last 12 entries, sorted by date
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recentEntries = sortedEntries.slice(-12); // Take last 12 entries
    
    if (recentEntries.length === 0) return trendMap;
    
    // Initialize trend map for all categories (using category values)
    const allCategories = new Set<string>();
    accounts.forEach(acc => {
      if ((portfolioTab === 'assets' && acc.type === 'asset') || 
          (portfolioTab === 'liabilities' && acc.type === 'liability')) {
        allCategories.add(acc.category);
      }
    });
    
    allCategories.forEach(cat => {
      trendMap.set(cat, []);
    });
    
    // Calculate category totals for each entry
    recentEntries.forEach(entry => {
      const categoryTotals = new Map<string, number>();
      
      Object.entries(entry.accountValues).forEach(([accountId, value]) => {
        const account = accounts.find(acc => acc.id === accountId);
        if (!account) return;
        
        // Filter by portfolio tab
        if ((portfolioTab === 'assets' && account.type !== 'asset') ||
            (portfolioTab === 'liabilities' && account.type !== 'liability')) {
          return;
        }
        
        // Convert to preferred currency
        let convertedValue = value;
        if (account.currency !== preferredCurrency && entry.exchangeRates) {
          const pair = `${account.currency}-${preferredCurrency}`;
          const rate = entry.exchangeRates[pair];
          if (rate && isFinite(rate) && rate > 0) {
            convertedValue = value * rate;
          }
        }
        
        const category = account.category;
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + convertedValue);
      });
      
      // Add values to trend arrays (ensure all categories have a value for this entry)
      allCategories.forEach(cat => {
        const total = categoryTotals.get(cat) || 0;
        const trendArray = trendMap.get(cat) || [];
        trendArray.push(total);
      });
    });
    
    return trendMap;
  }, [entries, accounts, preferredCurrency, portfolioTab]);

  // Sparkline component
  const Sparkline: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
    if (!values || values.length === 0) {
      return <div className="w-16 h-8 flex items-center justify-center text-gray-400 text-xs">No data</div>;
    }
    
    // Check if all values are zero or if there's no meaningful variation
    const hasNonZeroValues = values.some(v => v !== 0);
    if (!hasNonZeroValues) {
      // Show a flat line for zero values
      const width = 64;
      const height = 32;
      const padding = 2;
      const y = height / 2; // Middle line for zero
      const points = `${padding},${y} ${width - padding},${y}`;
      
      return (
        <div className="w-16 h-8 flex items-center">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.5"
            />
          </svg>
        </div>
      );
    }
    
    // Normalize values to fit in 64x32px area
    const width = 64;
    const height = 32;
    const padding = 2;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    
    const points = values.map((value, index) => {
      const x = padding + (index / (values.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="w-16 h-8 flex items-center">
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  // Calculate liability category breakdown
  const liabilityCategoryBreakdown = useMemo((): CategoryBreakdown[] => {
    if (!currentEntry) return [];

    const categoryMap = new Map<string, CategoryBreakdown>();

    Object.entries(currentEntry.accountValues).forEach(([accountId, value]) => {
      const account = accounts.find(acc => acc.id === accountId);
      
      // Only include liabilities
      if (account && account.type === 'liability' && value > 0) {
        let convertedValue = value;
        if (account.currency !== preferredCurrency && currentEntry.exchangeRates) {
          const pair = `${account.currency}-${preferredCurrency}`;
          const rate = currentEntry.exchangeRates[pair];
          if (rate && isFinite(rate) && rate > 0) {
            convertedValue = value * rate;
          }
        }

        const category = account.category;
        const categoryLabel = liabilityCategories.find(cat => cat.value === category)?.label || category;

        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category: categoryLabel,
            total: 0,
            percentage: 0,
            accounts: []
          });
        }

        const categoryData = categoryMap.get(category)!;
        categoryData.total += convertedValue;
        categoryData.accounts.push({
          name: account.name,
          value: convertedValue,
          percentage: 0
        });
      }
    });

    const totalValue = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0);

    return Array.from(categoryMap.values())
      .map((cat) => {
        const categoryValue = liabilityCategories.find(c => c.label === cat.category)?.value || '';
        
        return {
          ...cat,
          percentage: totalValue > 0 ? (cat.total / totalValue) * 100 : 0,
          color: CATEGORY_COLORS[categoryValue] || COLORS[0],
          accounts: cat.accounts.map(acc => ({
            ...acc,
            percentage: cat.total > 0 ? (acc.value / cat.total) * 100 : 0
          }))
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [currentEntry, accounts, liabilityCategories, preferredCurrency]);

  // Convert allocation data to chart format for Recharts
  const chartData = useMemo(() => {
    const sourceData = portfolioTab === 'assets' ? allocationData : liabilityAllocationData;
    const sourceCategoryData = portfolioTab === 'assets' ? categoryBreakdown : liabilityCategoryBreakdown;
    
    if (viewType === 'by-account') {
      return sourceData.map(item => ({
        name: item.name,
        value: item.value,
        fill: item.color
      }));
    } else {
      return sourceCategoryData.map(item => ({
        name: item.category,
        value: item.total,
        fill: item.color
      }));
    }
  }, [allocationData, liabilityAllocationData, categoryBreakdown, liabilityCategoryBreakdown, viewType, portfolioTab]);

  // Get available dates for selection
  const availableDates = useMemo(() => {
    return entries
      .map(entry => entry.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [entries]);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (!currentEntry) return null;

    // Use the already converted values from allocationData (assets only)
    const totalAssets = allocationData.reduce((sum, item) => sum + item.value, 0);
    
    // Calculate liabilities separately for display purposes
    let totalLiabilities = 0;
    Object.entries(currentEntry.accountValues).forEach(([accountId, value]) => {
      const account = accounts.find(acc => acc.id === accountId);
      if (account && account.type === 'liability' && value > 0) {
        let convertedValue = value;
        if (account.currency !== preferredCurrency && currentEntry.exchangeRates) {
          const pair = `${account.currency}-${preferredCurrency}`;
          const rate = currentEntry.exchangeRates[pair];
          if (rate && isFinite(rate) && rate > 0) {
            convertedValue = value * rate;
          }
        }
        totalLiabilities += convertedValue;
      }
    });
    
    const netWorth = totalAssets - totalLiabilities;

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      assetCount: allocationData.length
    };
  }, [allocationData, currentEntry, accounts, preferredCurrency]);

  if (!currentEntry) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Portfolio Allocation</h2>
          <p className="text-gray-500 mb-6">No data available. You can either add your own data or try the demo with sample data.</p>
          <div className="space-y-4">
            <button
              onClick={generateSampleData}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Demo with Sample Data
            </button>
            <div className="text-sm text-gray-500">
              <p>Or go to <strong>Daily Entry</strong> to add your own financial data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Portfolio Allocation</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Date:</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Latest ({availableDates[0]})</option>
                {availableDates.slice(1).map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value as 'by-account' | 'by-category')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="by-account">By Account</option>
                <option value="by-category">By Category</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs for Assets/Liabilities */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setPortfolioTab('assets')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              portfolioTab === 'assets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Assets
          </button>
          <button
            onClick={() => setPortfolioTab('liabilities')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              portfolioTab === 'liabilities'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Liabilities
          </button>
        </div>

        {/* Portfolio Metrics */}
        {portfolioMetrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Total Assets</div>
              <div className="text-xl font-bold text-green-700">
                {formatCurrencyForDisplay(portfolioMetrics.totalAssets)}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600 font-medium">Total Liabilities</div>
              <div className="text-xl font-bold text-red-700">
                {formatCurrencyForDisplay(portfolioMetrics.totalLiabilities)}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Net Worth</div>
              <div className={`text-xl font-bold ${portfolioMetrics.netWorth >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {formatCurrencyForDisplay(portfolioMetrics.netWorth)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">Asset Accounts</div>
              <div className="text-xl font-bold text-gray-700">
                {portfolioMetrics.assetCount}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {portfolioTab === 'assets' 
              ? (viewType === 'by-account' ? 'Asset Allocation by Account' : 'Asset Allocation by Category')
              : (viewType === 'by-account' ? 'Liability Breakdown by Account' : 'Liability Breakdown by Category')
            }
          </h3>
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => {
                      const total = chartData.reduce((sum, item) => sum + item.value, 0);
                      const pct = total > 0 && value ? ((value / total) * 100).toFixed(1) : '0.0';
                      return `${name}: ${pct}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [
                      formatCurrencyForDisplay(value),
                      'Value'
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No data available for chart</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {portfolioTab === 'assets'
              ? (viewType === 'by-account' ? 'Asset Account Values' : 'Asset Category Values')
              : (viewType === 'by-account' ? 'Liability Account Values' : 'Liability Category Values')
            }
          </h3>
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis 
                    width={80}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const rounded = Math.round(value / 1000) * 1000;
                      return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: preferredCurrency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(rounded);
                    }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [
                      formatCurrencyForDisplay(value),
                      'Value'
                    ]}
                  />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p>No data available for chart</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          {portfolioTab === 'assets' ? 'Asset Allocation by Category' : 'Liability Breakdown by Category'}
        </h3>
        <div className="space-y-4">
          {(portfolioTab === 'assets' ? categoryBreakdown : liabilityCategoryBreakdown).map((category, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{category.category}</h4>
                    <div className="text-xs text-gray-500">
                      {category.accounts.length} account{category.accounts.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {(() => {
                      // Find the category value from the label
                      const categoryValue = (portfolioTab === 'assets' ? assetCategories : liabilityCategories)
                        .find(cat => cat.label === category.category)?.value || '';
                      const trendValues = categoryTrendData.get(categoryValue) || [];
                      return <Sparkline values={trendValues} color={category.color || '#3b82f6'} />;
                    })()}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {formatCurrencyForDisplay(category.total)}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {category.percentage.toFixed(1)}% of total {portfolioTab === 'assets' ? 'assets' : 'liabilities'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {category.accounts.map((account, accIndex) => {
                  const sourceData = portfolioTab === 'assets' ? allocationData : liabilityAllocationData;
                  const accountData = sourceData.find(item => item.name === account.name);
                  const accountObject = accounts.find(acc => acc.name === account.name);
                  const accountTrendValues = accountObject ? (accountTrendData.get(accountObject.id) || []) : [];
                  const accountColor = accountData?.color || category.color || '#3b82f6';
                  
                  return (
                    <div key={accIndex} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">{account.name}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          accountData?.type === 'asset' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {accountData?.type || 'unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <Sparkline values={accountTrendValues} color={accountColor} />
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {formatCurrencyForDisplay(account.value)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {account.percentage.toFixed(1)}% of category
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioAllocation;
