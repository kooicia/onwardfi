import React, { useState } from 'react';
import { NetWorthEntry } from '../types';
import EmptyState from './EmptyState';

interface DataManagementProps {
  entries: NetWorthEntry[];
  onClearEntries: (entryIds: string[]) => void;
  onClearAllData: () => void;
}

export default function DataManagement({ entries, onClearEntries, onClearAllData }: DataManagementProps) {
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
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded shadow p-6 mt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Data Management</h2>
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
            onClick: () => {
              window.location.hash = '#entry';
            },
            variant: "primary"
          }}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
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
                {entries.map(entry => (
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
                      {formatCurrency(entry.totalAssets)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600">
                      {formatCurrency(entry.totalLiabilities)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span className={entry.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(entry.netWorth)}
                      </span>
                    </td>
                  </tr>
                ))}
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