// Account and financial data types
export interface Account {
  id: string;
  name: string;
  category: string;
  currency: string;
  type: 'asset' | 'liability';
}

export interface AccountCategory {
  value: string;
  label: string;
  type: 'asset' | 'liability';
}

export interface NetWorthEntry {
  id: string;
  date: string;
  accountValues: { [accountId: string]: number };
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  // Store exchange rates used for this entry to preserve historical accuracy
  exchangeRates?: { [currencyPair: string]: number };
}

// Predefined categories as per PRD
export const ASSET_CATEGORIES: AccountCategory[] = [
  { value: 'cash', label: 'Cash', type: 'asset' },
  { value: 'stocks', label: 'Stocks', type: 'asset' },
  { value: 'crypto', label: 'Crypto', type: 'asset' },
  { value: 'properties', label: 'Properties', type: 'asset' },
  { value: 'other-assets', label: 'Other Assets', type: 'asset' },
];

export const LIABILITY_CATEGORIES: AccountCategory[] = [
  { value: 'mortgage', label: 'Mortgage', type: 'liability' },
  { value: 'loans', label: 'Loans', type: 'liability' },
  { value: 'credit-card-debt', label: 'Credit Card Debt', type: 'liability' },
  { value: 'other-liabilities', label: 'Other Liabilities', type: 'liability' },
];

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'AUD', name: 'Australian Dollar' },
];

// Google Sheets integration types
export interface GoogleSheetsConnection {
  isConnected: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  lastSyncDate?: string;
  autoSync: boolean;
} 