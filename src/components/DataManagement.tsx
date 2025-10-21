import React, { useState } from 'react';
import { NetWorthEntry, Account } from '../types';
import { convertCurrencySync } from '../utils/currencyConverter';
import EmptyState from './EmptyState';

interface DataManagementProps {
  entries: NetWorthEntry[];
  accounts: Account[];
  onClearEntries: (entryIds: string[]) => void;
  onClearAllData: () => void;
  onCreateFirstEntry?: () => void;
  preferredCurrency: string;
}

export default function DataManagement({ entries, accounts, onClearEntries, onClearAllData, onCreateFirstEntry, preferredCurrency }: DataManagementProps) {
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);

  const handleSelectEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEntries.size === entries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entries.map(entry => entry.id)));
    }
  };

  const handleClearSelected = () => {
    onClearEntries(Array.from(selectedEntries));
    setSelectedEntries(new Set());
    setShowConfirmClear(false);
  };

  const handleClearAllData = () => {
    onClearAllData();
    setSelectedEntries(new Set());
    setShowConfirmClearAll(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: preferredCurrency
    }).format(amount);
  };

  // Recalculate entry totals based on current preferred currency
  const recalculateEntryTotals = (entry: NetWorthEntry) => {
    let totalAssets = 0;
    let totalLiabilities = 0;

    // Loop through all account values in the entry
    Object.entries(entry.accountValues).forEach(([accountId, value]) => {
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) return; // Skip if account no longer exists

      // Convert value to preferred currency
      let convertedValue: number;
      
      // Try to use stored exchange rate first
      const rate = entry.exchangeRates?.[`${account.currency}-${preferredCurrency}`];
      if (typeof rate === 'number' && isFinite(rate) && rate > 0) {
        convertedValue = value * rate;
      } else {
        // Fall back to sync conversion with current rates
        convertedValue = convertCurrencySync(value, account.currency, preferredCurrency);
      }

      // Add to appropriate total
      if (account.type === 'asset') {
        totalAssets += convertedValue;
      } else {
        totalLiabilities += convertedValue;
      }
    });

    const netWorth = totalAssets - totalLiabilities;

    return {
      totalAssets,
      totalLiabilities,
      netWorth
    };
  };

  return (
    <div className="bg-white rounded shadow p-4 sm:p-6 mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <h2 className="text-lg sm:text-xl font-bold">Data Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfirmClearAll(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Clear All Entries
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          variant="data"
          title="No Data to Manage"
          description="You haven't created any net worth entries yet. Start tracking your daily financial data to see it appear here for management and analysis."
          action={{
            label: "Create First Entry",
            onClick: onCreateFirstEntry || (() => {}),
            variant: "primary"
          }}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedEntries.size === entries.length && entries.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
                <span className="text-sm font-medium">Select All</span>
              </label>
              <span className="text-sm text-gray-600">
                {selectedEntries.size} of {entries.length} entries selected
              </span>
            </div>
            {selectedEntries.size > 0 && (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
              >
                Clear Selected ({selectedEntries.size})
              </button>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Select</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Assets</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Liabilities</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Net Worth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map(entry => {
                  const recalculated = recalculateEntryTotals(entry);
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(entry.id)}
                          onChange={() => handleSelectEntry(entry.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        {formatCurrency(recalculated.totalAssets)}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {formatCurrency(recalculated.totalLiabilities)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <span className={recalculated.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(recalculated.netWorth)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Confirm Clear Selected Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Clear Selected</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedEntries.size} selected entry{selectedEntries.size !== 1 ? 'ies' : 'y'}? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearSelected}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear All Modal */}
      {showConfirmClearAll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Clear All Entries</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete ALL your entries? This will remove all your net worth history but keep your accounts intact. 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmClearAll(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Clear All Entries
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 