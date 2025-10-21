import React, { ReactElement, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ReferenceLine } from 'recharts';
import { NetWorthEntry, Account, ASSET_CATEGORIES, LIABILITY_CATEGORIES } from '../types';
import { formatCurrency, convertCurrencySync } from '../utils/currencyConverter';
import EmptyState from './EmptyState';
import AccountDetailsTable from './AccountDetailsTable';

interface HistoryAndChartsProps {
  entries: NetWorthEntry[];
  accounts: Account[];
  preferredCurrency: string;
  onUpdateEntryValue: (entryId: string, accountId: string, newValue: number) => Promise<void>;
  onCreateFirstEntry?: () => void;
}

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

type ChartFilter = 'all' | 'ytd' | 'last12' | 'last24' | 'year';

export default function HistoryAndCharts({ entries, accounts, preferredCurrency, onUpdateEntryValue, onCreateFirstEntry }: HistoryAndChartsProps) {
  const [showOriginalCurrency, setShowOriginalCurrency] = useState(true);
  const [editingCell, setEditingCell] = useState<{ entryId: string; accountId: string; column: 'original' | 'usd' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [chartFilter, setChartFilter] = useState<ChartFilter>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Helper to recalculate assets, liabilities, and net worth for an entry
  function recalcTotals(entry: NetWorthEntry) {
    let assets = 0;
    let liabilities = 0;
    accounts.forEach(acc => {
      const value = entry.accountValues[acc.id] || 0;
      if (acc.type === 'asset') {
        // Use stored exchange rate if available, otherwise use current rate
        if (entry.exchangeRates && entry.exchangeRates[`${acc.currency}-${preferredCurrency}`]) {
          assets += value * entry.exchangeRates[`${acc.currency}-${preferredCurrency}`];
        } else {
          assets += convertCurrencySync(value, acc.currency, preferredCurrency);
        }
      } else if (acc.type === 'liability') {
        // Use stored exchange rate if available, otherwise use current rate
        if (entry.exchangeRates && entry.exchangeRates[`${acc.currency}-${preferredCurrency}`]) {
          liabilities += value * entry.exchangeRates[`${acc.currency}-${preferredCurrency}`];
        } else {
          liabilities += convertCurrencySync(value, acc.currency, preferredCurrency);
        }
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

  // Filter entries based on selected filter
  const getFilteredEntries = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    switch (chartFilter) {
      case 'ytd':
        return sortedEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.getFullYear() === currentYear;
        });
      case 'last12':
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(now.getMonth() - 12);
        return sortedEntries.filter(entry => new Date(entry.date) >= twelveMonthsAgo);
      case 'last24':
        const twentyFourMonthsAgo = new Date();
        twentyFourMonthsAgo.setMonth(now.getMonth() - 24);
        return sortedEntries.filter(entry => new Date(entry.date) >= twentyFourMonthsAgo);
      case 'year':
        return sortedEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.getFullYear() === selectedYear;
        });
      case 'all':
      default:
        return sortedEntries;
    }
  };

  const filteredEntries = getFilteredEntries();

  // Get available years from entries
  const availableYears = Array.from(new Set(sortedEntries.map(entry => new Date(entry.date).getFullYear()))).sort((a, b) => a - b);
  const minYear = availableYears.length > 0 ? availableYears[0] : new Date().getFullYear();
  const maxYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : new Date().getFullYear();

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

  // Prepare chart data by category
  const allCategories = [...ASSET_CATEGORIES, ...LIABILITY_CATEGORIES];
  const categoryColors: { [key: string]: string } = {
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

  const chartDataByCategory = filteredEntries.map(entry => {
    const row: any = { date: new Date(entry.date).toLocaleDateString() };
    let assetSum = 0;
    let liabilitySum = 0;
    allCategories.forEach(cat => {
      // Sum all accounts in this category
      const sum = accounts
        .filter(acc => acc.category === cat.value)
        .reduce((total, acc) => {
          const value = entry.accountValues[acc.id] || 0;
          let convertedValue: number;
          
          // Use stored exchange rate if available, otherwise use current rate
          if (entry.exchangeRates && entry.exchangeRates[`${acc.currency}-${preferredCurrency}`]) {
            convertedValue = value * entry.exchangeRates[`${acc.currency}-${preferredCurrency}`];
          } else {
            convertedValue = convertCurrencySync(value, acc.currency, preferredCurrency);
          }
          
          // Liabilities are always negative for stacking
          const v = acc.type === 'liability'
            ? -Math.abs(convertedValue)
            : convertedValue;
          return total + v;
        }, 0);
      row[cat.value] = sum;
      if (cat.type === 'asset') assetSum += sum;
      if (cat.type === 'liability') liabilitySum += sum;
    });
    row.netWorth = assetSum + liabilitySum;
    return row;
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
      // Find net worth, asset, and liability entries
      const netWorthEntry = payload.find((entry: any) => entry.name === 'Net Worth');
      const assetEntries = payload.filter((entry: any) => {
        const cat = categoriesWithAccounts.find(cat => cat.label === entry.name);
        return cat && cat.type === 'asset';
      });
      const liabilityEntries = payload.filter((entry: any) => {
        const cat = categoriesWithAccounts.find(cat => cat.label === entry.name);
        return cat && cat.type === 'liability';
      });
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow">
          <p className="font-medium">{label}</p>
          {netWorthEntry && (
            <p
              style={{
                color: netWorthEntry.color,
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {netWorthEntry.name}: {formatCurrencyForDisplay(netWorthEntry.value)}
            </p>
          )}
          {assetEntries.map((entry: any, index: number) => (
            <p
              key={"asset-" + index}
              style={{
                color: entry.color,
                fontSize: 13,
                fontWeight: 400,
                margin: 0,
              }}
            >
              {entry.name}: {formatCurrencyForDisplay(entry.value)}
            </p>
          ))}
          {liabilityEntries.map((entry: any, index: number) => (
            <p
              key={"liab-" + index}
              style={{
                color: entry.color,
                fontSize: 13,
                fontWeight: 400,
                margin: 0,
              }}
            >
              {entry.name}: {formatCurrencyForDisplay(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Only include categories with at least one account, and sort assets first, then liabilities
  const categoriesWithAccounts = allCategories
    .filter(cat => accounts.some(acc => acc.category === cat.value))
    .sort((a, b) => {
      if (a.type === b.type) return 0;
      return a.type === 'asset' ? -1 : 1;
    });

  // Custom small legend for charts
  const SmallLegend = (props: any) => (
    <ul style={{ display: 'flex', flexWrap: 'wrap', fontSize: 12, margin: 0, padding: 0, listStyle: 'none' }}>
      {categoriesWithAccounts.map((cat, index) => {
        const entry = props.payload.find((e: any) => e.value === cat.label);
        if (!entry) return null;
        return (
          <li key={`item-${index}`} style={{ marginRight: 16, display: 'flex', alignItems: 'center' }}>
            <span style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              backgroundColor: entry.color,
              marginRight: 6,
              borderRadius: 2,
            }} />
            <span>{entry.value}</span>
          </li>
        );
      })}
    </ul>
  );

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
      
      {/* Personal Net Worth Section */}
      {sortedEntries.length > 0 && (() => {
        const latestEntry = sortedEntries[sortedEntries.length - 1];
        const { assets, liabilities, netWorth } = recalcTotals(latestEntry);
        
        return (
          <div className="mb-6 sm:mb-8">
            {/* Personal Net Worth Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-4">PERSONAL NET WORTH</h3>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {formatCurrencyForDisplay(netWorth)}
                </div>
                <div className="text-sm text-gray-500 font-normal">
                  - as of {new Date(latestEntry.date).toLocaleDateString('en-CA')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-4 h-4 bg-blue-500 mr-2 rounded-sm"></div>
                    <span className="text-gray-700 font-medium text-sm">Total Assets</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrencyForDisplay(assets)}
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-4 h-4 bg-red-500 mr-2 rounded-sm"></div>
                    <span className="text-gray-700 font-medium text-sm">Total Liabilities</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrencyForDisplay(liabilities)}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row - 2 Column Layout for Summary Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary of Assets - Left Column */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-4">SUMMARY OF ASSETS</h3>
                <div className="space-y-3">
                  {(() => {
                    const assetCategories = [...ASSET_CATEGORIES];
                    const categoryTotals: { [key: string]: number } = {};
                    
                    // Calculate totals by category
                    accounts.filter(acc => acc.type === 'asset').forEach(acc => {
                      const value = latestEntry.accountValues[acc.id] || 0;
                      const rate = latestEntry.exchangeRates?.[`${acc.currency}-${preferredCurrency}`];
                      const convertedValue = rate ? value * rate : convertCurrencySync(value, acc.currency, preferredCurrency);
                      categoryTotals[acc.category] = (categoryTotals[acc.category] || 0) + convertedValue;
                    });
                    
                    return assetCategories
                      .filter(cat => categoryTotals[cat.value] > 0)
                      .map(cat => {
                        const total = categoryTotals[cat.value];
                        const percentage = (total / assets) * 100;
                        const color = categoryColors[cat.value] || '#8884d8';
                        
                        return (
                          <div key={cat.value} className="flex items-center">
                            <div className="w-24 text-sm text-gray-700 font-medium">{cat.label}</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-5 relative mx-3">
                              <div 
                                className="h-5 rounded-full"
                                style={{ 
                                  width: `${Math.min(100, percentage)}%`,
                                  backgroundColor: color
                                }}
                              ></div>
                            </div>
                            <div className="text-sm font-semibold text-gray-900 ml-2">{formatCurrencyForDisplay(total)}</div>
                            <div className="text-sm font-normal text-gray-500 ml-2">{percentage.toFixed(0)}%</div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>

              {/* Summary of Liabilities - Right Column */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-4">SUMMARY OF LIABILITIES</h3>
                <div className="space-y-3">
                  {(() => {
                    const liabilityCategories = [...LIABILITY_CATEGORIES];
                    const categoryTotals: { [key: string]: number } = {};
                    
                    // Calculate totals by category
                    accounts.filter(acc => acc.type === 'liability').forEach(acc => {
                      const value = latestEntry.accountValues[acc.id] || 0;
                      const rate = latestEntry.exchangeRates?.[`${acc.currency}-${preferredCurrency}`];
                      const convertedValue = rate ? value * rate : convertCurrencySync(value, acc.currency, preferredCurrency);
                      categoryTotals[acc.category] = (categoryTotals[acc.category] || 0) + convertedValue;
                    });
                    
                    return liabilityCategories
                      .filter(cat => categoryTotals[cat.value] > 0)
                      .map(cat => {
                        const total = categoryTotals[cat.value];
                        const percentage = (total / liabilities) * 100;
                        const color = categoryColors[cat.value] || '#8884d8';
                        
                        return (
                          <div key={cat.value} className="flex items-center">
                            <div className="w-24 text-sm text-gray-700 font-medium">{cat.label}</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-5 relative mx-3">
                              <div 
                                className="h-5 rounded-full"
                                style={{ 
                                  width: `${Math.min(100, percentage)}%`,
                                  backgroundColor: color
                                }}
                              ></div>
                            </div>
                            <div className="text-sm font-semibold text-gray-900 ml-2">{formatCurrencyForDisplay(total)}</div>
                            <div className="text-sm font-normal text-gray-500 ml-2">{percentage.toFixed(0)}%</div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      

      {/* Category Breakdown Chart */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-4">NET WORTH DEVELOPMENT</h3>
        
        {/* Filter Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setChartFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              chartFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setChartFilter('ytd')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              chartFilter === 'ytd'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            YTD
          </button>
          <button
            onClick={() => setChartFilter('last12')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              chartFilter === 'last12'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 12 Months
          </button>
          <button
            onClick={() => setChartFilter('last24')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              chartFilter === 'last24'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 24 Months
          </button>
          
          {/* Year Selection */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => {
                setChartFilter('year');
                setSelectedYear(prev => prev - 1);
              }}
              disabled={selectedYear <= minYear}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedYear <= minYear
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Previous Year"
            >
              &lt;
            </button>
            <button
              onClick={() => setChartFilter('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                chartFilter === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {selectedYear}
            </button>
            <button
              onClick={() => {
                setChartFilter('year');
                setSelectedYear(prev => prev + 1);
              }}
              disabled={selectedYear >= maxYear}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedYear >= maxYear
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Next Year"
            >
              &gt;
            </button>
          </div>
        </div>
        
        <div className="h-64 sm:h-80" style={{ marginLeft: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDataByCategory} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => {
                  const rounded = Math.round(value / 1000) * 1000;
                  return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: preferredCurrency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(rounded);
                }}
                tick={{ fontSize: 12 }}
              />
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<SmallLegend />} />
              {categoriesWithAccounts.map(cat => (
                <Bar
                  key={cat.value}
                  dataKey={cat.value}
                  stackId={cat.type === 'liability' ? 'liabilities' : 'assets'}
                  fill={hexToRgba(categoryColors[cat.value] || '#8884d8', 0.7)}
                  name={cat.label}
                  isAnimationActive={false}
                />
              ))}
              <Line 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#2563eb', stroke: '#fff', strokeWidth: 3 }}
                name="Net Worth"
                yAxisId={0}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Account Details Table */}
      <AccountDetailsTable
        entries={entries}
        accounts={accounts}
        preferredCurrency={preferredCurrency}
        onUpdateEntryValue={onUpdateEntryValue}
      />
    </div>
  );
} 