import React from 'react';
import { getAvailableCurrencies, formatCurrency } from '../utils/currencyConverter';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  className?: string;
}

export default function CurrencySelector({ selectedCurrency, onCurrencyChange, className = '' }: CurrencySelectorProps) {
  const currencies = getAvailableCurrencies();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">Display Currency:</label>
      <select
        value={selectedCurrency}
        onChange={(e) => onCurrencyChange(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {currencies.map(currency => (
          <option key={currency.code} value={currency.code}>
            {currency.code} - {currency.name}
          </option>
        ))}
      </select>
      <span className="text-xs text-gray-500">
        {formatCurrency(1, selectedCurrency)}
      </span>
    </div>
  );
} 