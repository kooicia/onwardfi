// Remove yahoo-finance2 import
// Cache for exchange rates to avoid repeated API calls
const rateCache: { [key: string]: { rate: number; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export const currencyNames: { [key: string]: string } = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  SGD: 'Singapore Dollar',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  KRW: 'South Korean Won',
  THB: 'Thai Baht',
  MYR: 'Malaysian Ringgit',
  IDR: 'Indonesian Rupiah',
  PHP: 'Philippine Peso',
  VND: 'Vietnamese Dong',
  HKD: 'Hong Kong Dollar',
  TWD: 'Taiwan Dollar',
  NZD: 'New Zealand Dollar',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  PLN: 'Polish Złoty',
  CZK: 'Czech Koruna',
  HUF: 'Hungarian Forint',
  RON: 'Romanian Leu',
  BGN: 'Bulgarian Lev',
  HRK: 'Croatian Kuna',
  RUB: 'Russian Ruble',
  TRY: 'Turkish Lira',
  BRL: 'Brazilian Real',
  MXN: 'Mexican Peso',
  ARS: 'Argentine Peso',
  CLP: 'Chilean Peso',
  COP: 'Colombian Peso',
  PEN: 'Peruvian Sol',
  UYU: 'Uruguayan Peso',
  ZAR: 'South African Rand',
  EGP: 'Egyptian Pound',
  NGN: 'Nigerian Naira',
  KES: 'Kenyan Shilling',
  GHS: 'Ghanaian Cedi',
  MAD: 'Moroccan Dirham',
  TND: 'Tunisian Dinar',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
  QAR: 'Qatari Riyal',
  KWD: 'Kuwaiti Dinar',
  BHD: 'Bahraini Dinar',
  OMR: 'Omani Rial',
  JOD: 'Jordanian Dinar',
  LBP: 'Lebanese Pound',
  ILS: 'Israeli Shekel',
  LYD: 'Libyan Dinar',
  DZD: 'Algerian Dinar',
  XOF: 'West African CFA Franc',
  XAF: 'Central African CFA Franc',
  UGX: 'Ugandan Shilling',
  TZS: 'Tanzanian Shilling',
  ZMW: 'Zambian Kwacha',
  BWP: 'Botswana Pula',
  NAD: 'Namibian Dollar',
  SZL: 'Swazi Lilangeni',
  LSL: 'Lesotho Loti',
  MUR: 'Mauritian Rupee',
  SCR: 'Seychellois Rupee',
  MVR: 'Maldivian Rufiyaa',
  BDT: 'Bangladeshi Taka',
  NPR: 'Nepalese Rupee',
  PKR: 'Pakistani Rupee',
  LKR: 'Sri Lankan Rupee',
  MMK: 'Myanmar Kyat',
  KHR: 'Cambodian Riel',
  LAK: 'Lao Kip',
  MNT: 'Mongolian Tögrög',
  KZT: 'Kazakhstani Tenge',
  UZS: 'Uzbekistani Som',
  TJS: 'Tajikistani Somoni',
  KGS: 'Kyrgyzstani Som',
  TMT: 'Turkmenistan Manat',
  AZN: 'Azerbaijani Manat',
  GEL: 'Georgian Lari',
  AMD: 'Armenian Dram',
  BYN: 'Belarusian Ruble',
  MDL: 'Moldovan Leu',
  UAH: 'Ukrainian Hryvnia',
};

// Currencies supported by Frankfurter API (as of 2024)
const frankfurterSupportedCurrencies = new Set([
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK',
  'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK',
  'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN',
  'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'
]);

// Fallback to ExchangeRate-API.com for currencies not supported by Frankfurter
// This API supports 160+ currencies including TWD
async function getExchangeRateFromFallbackAPI(fromCurrency: string, toCurrency: string): Promise<number> {
  try {
    const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Fallback API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const rate = data.rates[toCurrency];
    
    if (!rate) {
      throw new Error(`Rate not found in fallback API for ${fromCurrency} to ${toCurrency}`);
    }
    
    console.log(`✓ Got rate from ExchangeRate-API.com: ${fromCurrency} to ${toCurrency} = ${rate}`);
    return rate;
  } catch (error) {
    console.error('Error fetching from fallback API:', error);
    throw error;
  }
}

// Get exchange rate from Frankfurter.app for a specific date
export async function getExchangeRate(fromCurrency: string, toCurrency: string, date: string = new Date().toISOString().split('T')[0]): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  // If the date is in the future, use today instead
  const today = new Date().toISOString().split('T')[0];
  if (date > today) {
    date = today;
  }

  const cacheKey = `${fromCurrency}-${toCurrency}-${date}`;
  const now = Date.now();

  // Check cache first
  if (rateCache[cacheKey] && (now - rateCache[cacheKey].timestamp) < CACHE_DURATION) {
    return rateCache[cacheKey].rate;
  }

  // Check if currencies are supported by Frankfurter
  const fromSupported = frankfurterSupportedCurrencies.has(fromCurrency);
  const toSupported = frankfurterSupportedCurrencies.has(toCurrency);

  // If either currency is not supported by Frankfurter, use fallback API
  if (!fromSupported || !toSupported) {
    try {
      const rate = await getExchangeRateFromFallbackAPI(fromCurrency, toCurrency);
      // Cache the result
      rateCache[cacheKey] = {
        rate,
        timestamp: now
      };
      return rate;
    } catch (error) {
      console.error('Fallback API also failed:', error);
      console.warn(`No exchange rate available for ${fromCurrency} to ${toCurrency}. Using 1:1 ratio.`);
      return 1.0;
    }
  }

  try {
    let url;
    if (date === today) {
      // Latest rate
      url = `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`;
    } else {
      // Historical rate
      url = `https://api.frankfurter.app/${date}?from=${fromCurrency}&to=${toCurrency}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    const data = await response.json();
    const rate = data.rates[toCurrency];
    if (!rate) {
      throw new Error(`Rate not found for ${fromCurrency} to ${toCurrency}`);
    }
    // Cache the result
    rateCache[cacheKey] = {
      rate,
      timestamp: now
    };
    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate from Frankfurter.app:', error);
    
    // Try fallback API (ExchangeRate-API.com)
    try {
      const rate = await getExchangeRateFromFallbackAPI(fromCurrency, toCurrency);
      rateCache[cacheKey] = {
        rate,
        timestamp: now
      };
      return rate;
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
      // Return 1.0 as final fallback to prevent app from breaking
      console.warn(`Returning 1:1 ratio for ${fromCurrency} to ${toCurrency} due to all API failures`);
      return 1.0;
    }
  }
}

// Get current exchange rate (today's date)
export async function getCurrentExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  return getExchangeRate(fromCurrency, toCurrency);
}

// Convert currency using real-time rates
export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string, date?: string): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency, date);
  return amount * rate;
}

// Convert currency with fallback to cached rates (for synchronous operations)
export function convertCurrencySync(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Try to use cached rate if available
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `${fromCurrency}-${toCurrency}-${today}`;
  
  if (rateCache[cacheKey]) {
    return amount * rateCache[cacheKey].rate;
  }

  // Fallback: return original amount if no cached rate
  console.warn(`No cached exchange rate for ${fromCurrency} to ${toCurrency}. Using original amount.`);
  return amount;
}

// Convert currency for a given entry, always using the stored rate if available, otherwise fetching from API
export async function convertCurrencyWithEntry(amount: number, fromCurrency: string, toCurrency: string, date: string, exchangeRates?: { [currencyPair: string]: number }): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  const pair = `${fromCurrency}-${toCurrency}`;
  // 1. Use stored rate if available
  if (exchangeRates && typeof exchangeRates[pair] === 'number' && isFinite(exchangeRates[pair]) && exchangeRates[pair] > 0) {
    return amount * exchangeRates[pair];
  }
  // 2. Use in-memory cache if available
  const today = date || new Date().toISOString().split('T')[0];
  const cacheKey = `${fromCurrency}-${toCurrency}-${today}`;
  if (rateCache[cacheKey]) {
    return amount * rateCache[cacheKey].rate;
  }
  // 3. Fetch from API
  try {
    const rate = await getExchangeRate(fromCurrency, toCurrency, today);
    return amount * rate;
  } catch (error) {
    console.warn(`[convertCurrencyWithEntry] Could not fetch rate for ${pair} on ${today}:`, error);
    return amount; // Fallback: return original amount
  }
}

export function formatCurrency(amount: number, currency: string): string {
  const currencyCode = currency.toUpperCase();
  
  // Special formatting for some currencies
  const formatters: { [key: string]: Intl.NumberFormat } = {
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
    GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
    JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
    CNY: new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }),
    INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
    KRW: new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }),
    SGD: new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }),
    CAD: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
    AUD: new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }),
    TWD: new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' }),
  };

  const formatter = formatters[currencyCode] || 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode });

  return formatter.format(amount);
}

export function getAvailableCurrencies(): Array<{ code: string; name: string }> {
  return Object.keys(currencyNames).map(code => ({
    code,
    name: currencyNames[code] || code
  })).sort((a, b) => a.name.localeCompare(b.name));
}

// Clear the rate cache (useful for testing or when rates become stale)
export function clearRateCache(): void {
  Object.keys(rateCache).forEach(key => delete rateCache[key]);
}

// Get cache statistics for debugging
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: Object.keys(rateCache).length,
    keys: Object.keys(rateCache)
  };
} 