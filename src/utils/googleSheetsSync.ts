import { Account, NetWorthEntry } from '../types';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let tokenClient: any = null;
let accessToken: string | null = null;

// Initialize Google API client (using new Google Identity Services)
export const initGoogleClient = async (
  clientId: string,
  apiKey: string,
  discoveryDocs: string[],
  scopes: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Load the gapi client library
    window.gapi.load('client', async () => {
      try {
        // Initialize gapi client (no auth2, just client)
        await window.gapi.client.init({
          discoveryDocs: discoveryDocs,
        });
        
        // Initialize the new Google Identity Services token client
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: scopes,
          callback: '', // Will be set in signInToGoogle
        });
        
        resolve();
      } catch (error) {
        console.error('Init error:', error);
        reject(error);
      }
    });
  });
};

// Sign in to Google (using new Google Identity Services)
export const signInToGoogle = async (): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      // Set the callback for when we receive the token
      tokenClient.callback = async (response: any) => {
        if (response.error) {
          reject(response);
          return;
        }
        
        // Store the access token
        accessToken = response.access_token;
        
        // Set the token in gapi client
        window.gapi.client.setToken({
          access_token: accessToken,
        });
        
        resolve(response);
      };
      
      // Check if we already have a token
      if (accessToken && window.gapi.client.getToken() !== null) {
        resolve({ access_token: accessToken });
      } else {
        // Request a new token
        tokenClient.requestAccessToken({ prompt: 'consent' });
      }
    } catch (error) {
      console.error('Error signing in:', error);
      reject(error);
    }
  });
};

// Sign out from Google
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    if (accessToken) {
      // Revoke the token
      window.google.accounts.oauth2.revoke(accessToken, () => {
        console.log('Token revoked');
      });
      accessToken = null;
      window.gapi.client.setToken(null);
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Check if user is signed in
export const isSignedIn = (): boolean => {
  try {
    const token = window.gapi?.client?.getToken();
    return token !== null && token !== undefined;
  } catch (error) {
    return false;
  }
};

// Create a new Google Sheet
export const createGoogleSheet = async (title: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.create({
      properties: {
        title: title,
      },
    });
    
    return {
      spreadsheetId: response.result.spreadsheetId,
      spreadsheetUrl: response.result.spreadsheetUrl,
    };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
};

// Format data for Google Sheets
const formatDataForSheets = (
  accounts: Account[],
  entries: NetWorthEntry[],
  preferredCurrency: string
): any[][] => {
  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Create header row
  const header = ['Date', 'Total Assets', 'Total Liabilities', 'Net Worth', ...accounts.map(acc => acc.name)];
  
  // Create data rows
  const rows = sortedEntries.map(entry => {
    const row = [
      entry.date,
      entry.totalAssets,
      entry.totalLiabilities,
      entry.netWorth,
      ...accounts.map(acc => entry.accountValues[acc.id] || 0)
    ];
    return row;
  });
  
  return [header, ...rows];
};

// Format accounts metadata for Google Sheets
const formatAccountsMetadata = (accounts: Account[]): any[][] => {
  const header = ['Account Name', 'Type', 'Category', 'Currency'];
  const rows = accounts.map(acc => [acc.name, acc.type, acc.category, acc.currency]);
  return [header, ...rows];
};

// Sync data to Google Sheets
export const syncToGoogleSheets = async (
  spreadsheetId: string,
  accounts: Account[],
  entries: NetWorthEntry[],
  preferredCurrency: string
): Promise<void> => {
  try {
    // Clear existing sheets and create new ones
    const sheetsResponse = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });
    
    const existingSheets = sheetsResponse.result.sheets;
    const requests: any[] = [];
    
    // Keep the first sheet, delete others
    for (let i = 1; i < existingSheets.length; i++) {
      requests.push({
        deleteSheet: {
          sheetId: existingSheets[i].properties.sheetId,
        },
      });
    }
    
    // Rename first sheet to "Data"
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: existingSheets[0].properties.sheetId,
          title: 'Data',
        },
        fields: 'title',
      },
    });
    
    // Add "Accounts" sheet
    requests.push({
      addSheet: {
        properties: {
          title: 'Accounts',
        },
      },
    });
    
    // Add "Summary" sheet
    requests.push({
      addSheet: {
        properties: {
          title: 'Summary',
        },
      },
    });
    
    if (requests.length > 0) {
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: requests,
        },
      });
    }
    
    // Format data
    const dataValues = formatDataForSheets(accounts, entries, preferredCurrency);
    const accountsValues = formatAccountsMetadata(accounts);
    
    // Calculate summary statistics
    const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
    const summaryValues = [
      ['Metric', 'Value'],
      ['Preferred Currency', preferredCurrency],
      ['Total Accounts', accounts.length],
      ['Total Entries', entries.length],
      ['Latest Net Worth', latestEntry ? latestEntry.netWorth : 0],
      ['Latest Total Assets', latestEntry ? latestEntry.totalAssets : 0],
      ['Latest Total Liabilities', latestEntry ? latestEntry.totalLiabilities : 0],
      ['Last Updated', new Date().toISOString()],
    ];
    
    // Update all sheets at once
    const batchUpdateData = {
      data: [
        {
          range: 'Data!A1',
          values: dataValues,
        },
        {
          range: 'Accounts!A1',
          values: accountsValues,
        },
        {
          range: 'Summary!A1',
          values: summaryValues,
        },
      ],
      valueInputOption: 'RAW',
    };
    
    await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: batchUpdateData,
    });
    
    // Format the sheets (make headers bold, freeze rows, etc.)
    const formatRequests = [
      // Format Data sheet header
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.5, blue: 0.8 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
      // Freeze Data sheet header row
      {
        updateSheetProperties: {
          properties: {
            sheetId: 0,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          fields: 'gridProperties.frozenRowCount',
        },
      },
      // Format Accounts sheet header
      {
        repeatCell: {
          range: {
            sheetId: existingSheets.length, // Accounts sheet ID
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.7, blue: 0.5 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
      // Format Summary sheet
      {
        repeatCell: {
          range: {
            sheetId: existingSheets.length + 1, // Summary sheet ID
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.8, green: 0.5, blue: 0.2 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
    ];
    
    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: formatRequests,
      },
    });
    
    console.log('Successfully synced data to Google Sheets');
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    throw error;
  }
};

// Get spreadsheet URL
export const getSpreadsheetUrl = (spreadsheetId: string): string => {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
};

