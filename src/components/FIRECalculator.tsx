import React, { useState } from 'react';

interface FIRECalculatorProps {
  preferredCurrency: string;
}

export default function FIRECalculator({ preferredCurrency }: FIRECalculatorProps) {
  const [annualExpenses, setAnnualExpenses] = useState<string>('');
  const [withdrawalRate, setWithdrawalRate] = useState<string>('4');
  const [currentAge, setCurrentAge] = useState<string>('');
  const [targetAge, setTargetAge] = useState<string>('');
  const [currentSavings, setCurrentSavings] = useState<string>('');
  const [annualSavings, setAnnualSavings] = useState<string>('');
  const [expectedReturn, setExpectedReturn] = useState<string>('7');
  const [inflationRate, setExpectedInflation] = useState<string>('3');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: preferredCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
    
    if (annual <= 0 || returnRate <= 0) return null;
    
    // Adjust for inflation
    const realReturnRate = (returnRate - inflation) / 100;
    const realAnnualSavings = annual * (1 - inflation / 100);
    
    // Using the formula: FV = PV(1+r)^n + PMT * ((1+r)^n - 1) / r
    // Where FV = fireNumber, PV = current, PMT = realAnnualSavings, r = realReturnRate
    // Solving for n (years)
    
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

  const fireNumber = calculateFIRENumber();
  const yearsToFIRE = calculateYearsToFIRE();
  const monthlySavingsNeeded = calculateMonthlySavingsNeeded();

  return (
    <div className="bg-white rounded shadow p-6 mt-4">
      <h2 className="text-xl font-bold mb-6">FIRE Calculator</h2>
      
      {/* What is FIRE Section */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">What is FIRE?</h3>
        <p className="text-blue-800 text-sm">
          <strong>FIRE</strong> stands for <strong>Financial Independence, Retire Early</strong>. 
          It's a lifestyle movement focused on extreme savings and investment to achieve financial freedom at a young age.
        </p>
      </div>

      {/* Calculator Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Your FIRE Number</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Expenses (in {preferredCurrency})
              </label>
              <input
                type="text"
                value={annualExpenses}
                onChange={(e) => setAnnualExpenses(e.target.value)}
                placeholder="e.g., 40000"
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
              <input
                type="text"
                value={withdrawalRate}
                onChange={(e) => setWithdrawalRate(e.target.value)}
                placeholder="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Typically 3-4%. The percentage you can safely withdraw annually
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Your FIRE Number</div>
              <div className="text-2xl font-bold text-green-700">
                {fireNumber > 0 ? formatCurrency(fireNumber) : 'Enter your expenses'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
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
                onChange={(e) => setCurrentAge(e.target.value)}
                placeholder="e.g., 30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Savings (in {preferredCurrency})
              </label>
              <input
                type="text"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
                placeholder="e.g., 100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Savings (in {preferredCurrency})
              </label>
              <input
                type="text"
                value={annualSavings}
                onChange={(e) => setAnnualSavings(e.target.value)}
                placeholder="e.g., 30000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Annual Return (%)
              </label>
              <input
                type="text"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
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
                onChange={(e) => setExpectedInflation(e.target.value)}
                placeholder="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Years to FIRE</div>
              <div className="text-2xl font-bold text-blue-700">
                {yearsToFIRE !== null && !isNaN(yearsToFIRE) 
                  ? `${Math.ceil(yearsToFIRE)} years` 
                  : 'Enter your details'}
              </div>
              {yearsToFIRE !== null && !isNaN(yearsToFIRE) && (
                <p className="text-xs text-gray-500 mt-1">
                  You'll reach FIRE at age {Math.ceil(parseFloat(currentAge) + yearsToFIRE)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

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
              onChange={(e) => setTargetAge(e.target.value)}
              placeholder="e.g., 45"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Monthly Savings Needed</div>
            <div className="text-2xl font-bold text-purple-700">
              {monthlySavingsNeeded !== null && !isNaN(monthlySavingsNeeded) 
                ? formatCurrency(monthlySavingsNeeded) 
                : 'Enter target age'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Monthly amount to save to reach FIRE by your target age
            </p>
          </div>
        </div>
      </div>

      {/* Guidance Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
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