import React, { ReactElement, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { NetWorthEntry, Account } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currencyConverter';
import EmptyState from './EmptyState';
import AccountDetailsTable from './AccountDetailsTable';

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
      <AccountDetailsTable
        entries={entries}
        accounts={accounts}
        preferredCurrency={preferredCurrency}
        onUpdateEntryValue={onUpdateEntryValue}
      />

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