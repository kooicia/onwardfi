import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { NetWorthEntry, Account } from '../types';
import { formatCurrency } from '../utils/currencyConverter';

interface FIRECalculatorProps {
  preferredCurrency: string;
  entries?: NetWorthEntry[];
  accounts?: Account[];
  currentUserId?: string;
}

interface SavedCalculatorValues {
  annualExpenses: string;
  withdrawalRate: string;
  currentAge: string;
  targetAge: string;
  currentSavings: string;
  annualSavings: string;
  expectedReturn: string;
  inflationRate: string;
}

export default function FIRECalculator({ preferredCurrency, entries = [], accounts = [], currentUserId = '' }: FIRECalculatorProps) {
  const [annualExpenses, setAnnualExpenses] = useState<string>('');
  const [withdrawalRate, setWithdrawalRate] = useState<string>('4');
  const [currentAge, setCurrentAge] = useState<string>('');
  const [targetAge, setTargetAge] = useState<string>('');
  const [currentSavings, setCurrentSavings] = useState<string>('');
  const [annualSavings, setAnnualSavings] = useState<string>('');
  const [expectedReturn, setExpectedReturn] = useState<string>('7');
  const [inflationRate, setExpectedInflation] = useState<string>('3');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load saved calculator values from localStorage
  useEffect(() => {
    if (!currentUserId || isLoaded) return;
    
    const savedKey = `fireCalculatorValues_${currentUserId}`;
    const saved = localStorage.getItem(savedKey);
    
    if (saved) {
      try {
        const savedValues: SavedCalculatorValues = JSON.parse(saved);
        if (savedValues.annualExpenses) setAnnualExpenses(savedValues.annualExpenses);
        if (savedValues.withdrawalRate) setWithdrawalRate(savedValues.withdrawalRate);
        if (savedValues.currentAge) setCurrentAge(savedValues.currentAge);
        if (savedValues.targetAge) setTargetAge(savedValues.targetAge);
        if (savedValues.currentSavings) setCurrentSavings(savedValues.currentSavings);
        if (savedValues.annualSavings) setAnnualSavings(savedValues.annualSavings);
        if (savedValues.expectedReturn) setExpectedReturn(savedValues.expectedReturn);
        if (savedValues.inflationRate) setExpectedInflation(savedValues.inflationRate);
      } catch (error) {
        console.error('Error loading saved calculator values:', error);
      }
    }
    
    setIsLoaded(true);
  }, [currentUserId, isLoaded]);

  // Save calculator values to localStorage whenever they change
  useEffect(() => {
    if (!currentUserId || !isLoaded) return;
    
    const savedKey = `fireCalculatorValues_${currentUserId}`;
    const valuesToSave: SavedCalculatorValues = {
      annualExpenses,
      withdrawalRate,
      currentAge,
      targetAge,
      currentSavings,
      annualSavings,
      expectedReturn,
      inflationRate
    };
    
    localStorage.setItem(savedKey, JSON.stringify(valuesToSave));
  }, [annualExpenses, withdrawalRate, currentAge, targetAge, currentSavings, annualSavings, expectedReturn, inflationRate, currentUserId, isLoaded]);

  // Get current net worth from latest entry
  const currentNetWorth = useMemo(() => {
    if (entries.length === 0) return 0;
    const latestEntry = entries[entries.length - 1];
    return latestEntry.netWorth || 0;
  }, [entries]);

  // Calculate average annual savings rate from historical data
  const calculatedAnnualSavings = useMemo(() => {
    if (entries.length < 2) return null;
    
    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate growth between first and last entry
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    
    let firstTotal = 0;
    let lastTotal = 0;
    
    firstTotal = firstEntry.netWorth || 0;
    lastTotal = lastEntry.netWorth || 0;

    // Calculate time difference in years
    const firstDate = new Date(firstEntry.date);
    const lastDate = new Date(lastEntry.date);
    const yearsDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (yearsDiff <= 0) return null;

    // Estimate annual savings (simplified calculation)
    // Growth = (lastTotal - firstTotal) / yearsDiff
    // This includes both savings and investment returns
    const growth = (lastTotal - firstTotal) / yearsDiff;
    return Math.max(0, growth);
  }, [entries, accounts]);

  // Helper to copy latest net worth to current savings
  const handleUseLatestNetWorth = () => {
    if (currentNetWorth > 0) {
      setCurrentSavings(Math.round(currentNetWorth).toString());
    }
  };

  // Helper to copy estimated annual savings
  const handleUseEstimatedSavings = () => {
    if (calculatedAnnualSavings !== null && calculatedAnnualSavings > 0) {
      setAnnualSavings(Math.round(calculatedAnnualSavings).toString());
    }
  };

  const formatCurrencyValue = (value: number) => {
    return formatCurrency(value, preferredCurrency);
  };

  // Helper to format number with thousand separators for display
  const formatNumberWithCommas = (value: string | number): string => {
    if (!value) return '';
    const numStr = typeof value === 'number' ? value.toString() : value;
    // Remove existing commas and non-numeric characters except decimal point
    const cleaned = numStr.replace(/[^0-9.]/g, '');
    if (!cleaned) return '';
    
    // Split into integer and decimal parts
    const parts = cleaned.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Add thousand separators to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Combine with decimal part if exists
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };

  // Helper to parse formatted number string back to number
  const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    // Remove commas and parse
    const cleaned = value.replace(/,/g, '');
    return parseFloat(cleaned) || 0;
  };

  const calculateFIRENumber = () => {
    const expenses = parseFloat(annualExpenses) || 0;
    const rate = parseFloat(withdrawalRate) || 4;
    return expenses / (rate / 100);
  };

  const calculateYearsToFIRE = () => {
    const fireNumber = calculateFIRENumber();
    const current = parseFloat(currentSavings) || 0;
    const annual = parseFloat(annualSavings) || 0;
    const returnRate = parseFloat(expectedReturn) || 7;
    const inflation = parseFloat(inflationRate) || 3;
    
    if (annual <= 0 || returnRate <= 0 || fireNumber <= current) return null;
    
    // Adjust for inflation
    const realReturnRate = (returnRate - inflation) / 100;
    const realAnnualSavings = annual * (1 - inflation / 100);
    
    if (realReturnRate === 0) {
      return (fireNumber - current) / realAnnualSavings;
    }
    
    const a = realAnnualSavings;
    const b = current * realReturnRate + a;
    const c = fireNumber * realReturnRate;
    
    if (b === 0) return null;
    
    const years = Math.log((c + a) / b) / Math.log(1 + realReturnRate);
    return Math.max(0, years);
  };

  const calculateMonthlySavingsNeeded = () => {
    const fireNumber = calculateFIRENumber();
    const current = parseFloat(currentSavings) || 0;
    const returnRate = parseFloat(expectedReturn) || 7;
    const inflation = parseFloat(inflationRate) || 3;
    const years = parseFloat(targetAge) - parseFloat(currentAge) || 0;
    
    if (years <= 0 || returnRate <= 0) return null;
    
    const realReturnRate = (returnRate - inflation) / 100;
    const target = fireNumber - current;
    
    if (realReturnRate === 0) {
      return target / years / 12;
    }
    
    const monthlyRate = realReturnRate / 12;
    const months = years * 12;
    
    const monthlySavings = target * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
    return monthlySavings;
  };

  // Calculate projection data for chart
  const projectionData = useMemo(() => {
    const fireNumber = calculateFIRENumber();
    const current = parseFloat(currentSavings) || 0;
    const annual = parseFloat(annualSavings) || 0;
    const returnRate = parseFloat(expectedReturn) || 7;
    const inflation = parseFloat(inflationRate) || 3;
    const age = parseFloat(currentAge) || 0;
    
    if (!current || !annual || !returnRate || !age || !fireNumber) return [];

    const realReturnRate = (returnRate - inflation) / 100;
    const data = [];
    let currentValue = current;
    const maxYears = Math.min(50, Math.ceil((fireNumber - current) / annual) + 10);

    for (let year = 0; year <= maxYears; year++) {
      const currentAgeAtYear = age + year;
      data.push({
        age: currentAgeAtYear,
        year,
        netWorth: Math.round(currentValue),
        fireNumber: Math.round(fireNumber)
      });

      if (currentValue >= fireNumber) break;

      // Calculate next year: current value grows + new savings added
      currentValue = currentValue * (1 + realReturnRate) + annual * (1 - inflation / 100);
    }

    return data;
  }, [currentSavings, annualSavings, expectedReturn, inflationRate, currentAge, calculateFIRENumber]);

  const fireNumber = calculateFIRENumber();
  const yearsToFIRE = calculateYearsToFIRE();
  const monthlySavingsNeeded = calculateMonthlySavingsNeeded();
  const progressPercent = fireNumber > 0 ? Math.min(100, (parseFloat(currentSavings) || 0) / fireNumber * 100) : 0;
  const remainingAmount = fireNumber > 0 ? Math.max(0, fireNumber - (parseFloat(currentSavings) || 0)) : 0;

  return (
    <div className="bg-white rounded shadow p-4 sm:p-6 mt-4">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">FIRE Calculator</h2>
      
      {/* What is FIRE Section */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">What is FIRE?</h3>
        <p className="text-blue-800 text-sm">
          <strong>FIRE</strong> stands for <strong>Financial Independence, Retire Early</strong>. 
          It's a lifestyle movement focused on extreme savings and investment to achieve financial freedom at a young age.
        </p>
      </div>


      {/* Calculator Form */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Your FIRE Number</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Expenses (in {preferredCurrency})
              </label>
              <input
                type="text"
                value={formatNumberWithCommas(annualExpenses)}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                  setAnnualExpenses(cleaned);
                }}
                placeholder="e.g., 40,000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                How much you spend annually (including taxes, healthcare, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Safe Withdrawal Rate (%)
              </label>
              <div className="flex gap-2 mb-2">
                {[3, 3.5, 4, 4.5].map(rate => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setWithdrawalRate(rate.toString())}
                    className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                      withdrawalRate === rate.toString()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={withdrawalRate}
                onChange={(e) => setWithdrawalRate(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Typically 3-4%. The percentage you can safely withdraw annually
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Your FIRE Number</div>
              <div className="text-2xl font-bold text-green-700 mb-3">
                {fireNumber > 0 ? formatCurrencyValue(fireNumber) : 'Enter your expenses'}
              </div>
              {fireNumber > 0 && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div
                      className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, progressPercent)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Progress: {progressPercent.toFixed(1)}%</span>
                    <span>Remaining: {formatCurrencyValue(remainingAmount)}</span>
                  </div>
                </>
              )}
              <p className="text-xs text-gray-500 mt-2">
                This is the amount you need to save to achieve financial independence
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Time to FIRE</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Age
              </label>
              <input
                type="text"
                value={currentAge}
                onChange={(e) => setCurrentAge(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g., 30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Savings (in {preferredCurrency})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formatNumberWithCommas(currentSavings)}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                    setCurrentSavings(cleaned);
                  }}
                  placeholder="e.g., 100,000"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {currentNetWorth > 0 && (
                  <button
                    type="button"
                    onClick={handleUseLatestNetWorth}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm whitespace-nowrap font-medium transition-colors"
                    title={`Use latest net worth: ${formatCurrencyValue(currentNetWorth)}`}
                  >
                    Use Latest
                  </button>
                )}
              </div>
              {currentNetWorth > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Latest net worth: {formatCurrencyValue(currentNetWorth)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Savings (in {preferredCurrency})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formatNumberWithCommas(annualSavings)}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                    setAnnualSavings(cleaned);
                  }}
                  placeholder="e.g., 30,000"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {calculatedAnnualSavings !== null && calculatedAnnualSavings > 0 && (
                  <button
                    type="button"
                    onClick={handleUseEstimatedSavings}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm whitespace-nowrap font-medium transition-colors"
                    title={`Use estimated annual savings: ${formatCurrencyValue(calculatedAnnualSavings)}`}
                  >
                    Use Estimate
                  </button>
                )}
              </div>
              {calculatedAnnualSavings !== null && calculatedAnnualSavings > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Estimated from your data: {formatCurrencyValue(calculatedAnnualSavings)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Annual Return (%)
              </label>
              <input
                type="text"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="7"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Inflation Rate (%)
              </label>
              <input
                type="text"
                value={inflationRate}
                onChange={(e) => setExpectedInflation(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Years to FIRE</div>
              <div className="text-2xl font-bold text-blue-700 mb-2">
                {yearsToFIRE !== null && !isNaN(yearsToFIRE) 
                  ? `${Math.ceil(yearsToFIRE)} years` 
                  : 'Enter your details'}
              </div>
              {yearsToFIRE !== null && !isNaN(yearsToFIRE) && parseFloat(currentAge) > 0 && (
                <p className="text-xs text-gray-600">
                  You'll reach FIRE at age <strong>{Math.ceil(parseFloat(currentAge) + yearsToFIRE)}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Projection Chart */}
      {projectionData.length > 0 && fireNumber > 0 && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Wealth Projection</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="age" 
                label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
                label={{ value: `Net Worth (${preferredCurrency})`, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrencyValue(value)}
                labelFormatter={(label) => `Age ${label}`}
              />
              <Legend />
              <ReferenceLine 
                y={fireNumber} 
                stroke="#10b981" 
                strokeDasharray="5 5" 
                label={{ value: 'FIRE Goal', position: 'right' }}
              />
              <Line 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Projected Net Worth"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="fireNumber" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="FIRE Goal"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          {yearsToFIRE !== null && !isNaN(yearsToFIRE) && (
            <p className="text-sm text-gray-600 mt-4 text-center">
              Based on your current plan, you'll reach your FIRE goal in approximately <strong>{Math.ceil(yearsToFIRE)} years</strong>
            </p>
          )}
        </div>
      )}

      {/* Target Age Calculator */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Target Age Calculator</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target FIRE Age
            </label>
            <input
              type="text"
              value={targetAge}
              onChange={(e) => setTargetAge(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g., 45"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Monthly Savings Needed</div>
            <div className="text-2xl font-bold text-purple-700">
              {monthlySavingsNeeded !== null && !isNaN(monthlySavingsNeeded) 
                ? formatCurrencyValue(monthlySavingsNeeded) 
                : 'Enter target age'}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Monthly amount to save to reach FIRE by your target age
            </p>
          </div>
        </div>
      </div>

      {/* Guidance Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">How to Determine Your FIRE Number</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">1. Calculate Your Annual Expenses</h4>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• Track all your current expenses for 3-6 months</li>
              <li>• Include housing, food, transportation, healthcare, insurance</li>
              <li>• Don't forget taxes, entertainment, and discretionary spending</li>
              <li>• Consider future expenses (children, healthcare in retirement)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">2. Choose Your Withdrawal Rate</h4>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• <strong>4% Rule:</strong> Traditional safe withdrawal rate (25x expenses)</li>
              <li>• <strong>3% Rule:</strong> More conservative, better for early retirement</li>
              <li>• <strong>3.5% Rule:</strong> Middle ground, accounts for longer retirement</li>
              <li>• Consider your risk tolerance and retirement timeline</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">3. Plan Your Savings Strategy</h4>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• Maximize tax-advantaged accounts (401k, IRA, HSA)</li>
              <li>• Invest in low-cost index funds for long-term growth</li>
              <li>• Consider real estate, side hustles, or business ownership</li>
              <li>• Focus on increasing income and reducing expenses</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">4. Important Considerations</h4>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• <strong>Healthcare:</strong> Plan for insurance costs before Medicare</li>
              <li>• <strong>Sequence Risk:</strong> Market downturns early in retirement</li>
              <li>• <strong>Inflation:</strong> Your expenses will increase over time</li>
              <li>• <strong>Flexibility:</strong> Be prepared to adjust your plan</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">💡 Pro Tips</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Start by saving 50-70% of your income if possible</li>
          <li>• Use the 4% rule as a starting point, but be flexible</li>
          <li>• Consider geographic arbitrage (moving to lower-cost areas)</li>
          <li>• Build multiple income streams for security</li>
          <li>• Remember: FIRE is about freedom, not deprivation</li>
        </ul>
      </div>
    </div>
  );
}
