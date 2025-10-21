import React, { useState, useEffect } from 'react';
import { Account, NetWorthEntry, GoogleSheetsConnection } from '../types';
import { 
  GOOGLE_CLIENT_ID, 
  GOOGLE_API_KEY, 
  GOOGLE_DISCOVERY_DOCS, 
  GOOGLE_SCOPES 
} from '../firebase';
import {
  initGoogleClient,
  signInToGoogle,
  signOutFromGoogle,
  isSignedIn,
  createGoogleSheet,
  syncToGoogleSheets,
  getSpreadsheetUrl,
} from '../utils/googleSheetsSync';

interface GoogleSheetsSyncProps {
  accounts: Account[];
  entries: NetWorthEntry[];
  preferredCurrency: string;
  googleSheetsConnection: GoogleSheetsConnection;
  onConnectionChange: (connection: GoogleSheetsConnection) => void;
}

export default function GoogleSheetsSync({
  accounts,
  entries,
  preferredCurrency,
  googleSheetsConnection,
  onConnectionChange,
}: GoogleSheetsSyncProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSignedInState, setIsSignedInState] = useState(false);

  // Check if Google API is properly configured
  // Client ID is required, API key is optional for OAuth-authenticated requests
  const isConfigured = 
    GOOGLE_CLIENT_ID.length > 0 && 
    !GOOGLE_CLIENT_ID.includes("YOUR_GOOGLE_CLIENT_ID");

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    // Load Google Identity Services (GIS) script first
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    
    // Load Google API client script
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;

    let scriptsLoaded = 0;
    const onScriptLoad = async () => {
      scriptsLoaded++;
      if (scriptsLoaded === 2) {
        // Both scripts loaded, now initialize
        try {
          await initGoogleClient(
            GOOGLE_CLIENT_ID,
            GOOGLE_API_KEY || '', // API key is optional for OAuth
            GOOGLE_DISCOVERY_DOCS,
            GOOGLE_SCOPES
          );
          setIsInitialized(true);
          setIsSignedInState(isSignedIn());
        } catch (error) {
          console.error('Error initializing Google API:', error);
          setError('Failed to initialize Google API. Please check your configuration.');
        }
      }
    };

    gisScript.onload = onScriptLoad;
    gapiScript.onload = onScriptLoad;

    document.body.appendChild(gisScript);
    document.body.appendChild(gapiScript);

    return () => {
      // Cleanup scripts on unmount
      if (gisScript.parentNode) {
        gisScript.parentNode.removeChild(gisScript);
      }
      if (gapiScript.parentNode) {
        gapiScript.parentNode.removeChild(gapiScript);
      }
    };
  }, [isConfigured]);

  const handleConnect = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Sign in to Google
      await signInToGoogle();
      setIsSignedInState(true);

      // Create a new Google Sheet
      const sheetTitle = `OnwardFi Net Worth Tracker - ${new Date().toLocaleDateString()}`;
      const { spreadsheetId, spreadsheetUrl } = await createGoogleSheet(sheetTitle);

      // Sync initial data
      await syncToGoogleSheets(spreadsheetId, accounts, entries, preferredCurrency);

      // Update connection state
      const newConnection: GoogleSheetsConnection = {
        isConnected: true,
        spreadsheetId,
        spreadsheetUrl,
        lastSyncDate: new Date().toISOString(),
        autoSync: true,
      };

      onConnectionChange(newConnection);
      setSuccessMessage('Successfully connected to Google Sheets and synced data!');
    } catch (error: any) {
      console.error('Error connecting to Google Sheets:', error);
      setError(error.message || 'Failed to connect to Google Sheets. Please try again.');
      setIsSignedInState(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await signOutFromGoogle();
      setIsSignedInState(false);

      // Update connection state
      const newConnection: GoogleSheetsConnection = {
        isConnected: false,
        autoSync: false,
      };

      onConnectionChange(newConnection);
      setSuccessMessage('Successfully disconnected from Google Sheets.');
    } catch (error: any) {
      console.error('Error disconnecting:', error);
      setError('Failed to disconnect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!googleSheetsConnection.spreadsheetId) {
      setError('No spreadsheet connected. Please connect first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await syncToGoogleSheets(
        googleSheetsConnection.spreadsheetId,
        accounts,
        entries,
        preferredCurrency
      );

      // Update last sync date
      const newConnection: GoogleSheetsConnection = {
        ...googleSheetsConnection,
        lastSyncDate: new Date().toISOString(),
      };

      onConnectionChange(newConnection);
      setSuccessMessage('Data synced successfully!');
    } catch (error: any) {
      console.error('Error syncing:', error);
      setError('Failed to sync data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoSync = () => {
    const newConnection: GoogleSheetsConnection = {
      ...googleSheetsConnection,
      autoSync: !googleSheetsConnection.autoSync,
    };
    onConnectionChange(newConnection);
  };

  const handleOpenSpreadsheet = () => {
    if (googleSheetsConnection.spreadsheetUrl) {
      window.open(googleSheetsConnection.spreadsheetUrl, '_blank');
    }
  };

  if (!isConfigured) {
    return (
      <div className="bg-white rounded shadow p-4 sm:p-6 mt-4">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Google Sheets Sync</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚙️ Configuration Required</h3>
          <p className="text-sm text-yellow-700 mb-3">
            To enable Google Sheets sync, you need to configure Google API credentials:
          </p>
          <ol className="text-sm text-yellow-700 space-y-2 ml-4 list-decimal">
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
            <li>Create a new project or select an existing one</li>
            <li>Enable the Google Sheets API</li>
            <li>Create OAuth 2.0 credentials (Web application)</li>
            <li>Add authorized JavaScript origins (e.g., http://localhost:3000 and your production URL)</li>
            <li>Update the credentials in <code className="bg-yellow-100 px-1 rounded">src/firebase.ts</code></li>
          </ol>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="bg-white rounded shadow p-4 sm:p-6 mt-4">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Google Sheets Sync</h2>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Initializing Google API...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow p-4 sm:p-6 mt-4">
      <h2 className="text-lg sm:text-xl font-bold mb-4">Google Sheets Sync</h2>
      
      <p className="text-sm text-gray-600 mb-6">
        Automatically sync your net worth data to a Google Sheet for easy viewing, sharing, and analysis.
      </p>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          ✓ {successMessage}
        </div>
      )}

      {/* Connection Status */}
      <div className="border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Connection Status</h3>
            <div className="flex items-center mt-2">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  googleSheetsConnection.isConnected ? 'bg-green-500' : 'bg-gray-300'
                }`}
              ></div>
              <span className="text-sm text-gray-700">
                {googleSheetsConnection.isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
          
          {googleSheetsConnection.isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Connecting...' : 'Connect Google Sheets'}
            </button>
          )}
        </div>

        {/* Connection Details */}
        {googleSheetsConnection.isConnected && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Spreadsheet:</span>
              <button
                onClick={handleOpenSpreadsheet}
                className="text-sm text-blue-600 hover:underline"
              >
                Open in Google Sheets →
              </button>
            </div>
            
            {googleSheetsConnection.lastSyncDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Synced:</span>
                <span className="text-sm text-gray-700">
                  {new Date(googleSheetsConnection.lastSyncDate).toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Auto-sync on changes:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleSheetsConnection.autoSync}
                  onChange={handleToggleAutoSync}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Manual Sync */}
      {googleSheetsConnection.isConnected && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">Manual Sync</h3>
          <p className="text-sm text-gray-600 mb-4">
            Click the button below to manually sync your latest data to Google Sheets.
          </p>
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ About Google Sheets Sync</h4>
        <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
          <li>Your data is synced directly to your Google account</li>
          <li>The spreadsheet includes three sheets: Data, Accounts, and Summary</li>
          <li>Auto-sync will update the sheet whenever you make changes to your data</li>
          <li>You can manually sync at any time using the "Sync Now" button</li>
          <li>All data remains private and secure in your Google Drive</li>
        </ul>
      </div>
    </div>
  );
}

