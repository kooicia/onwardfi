import React, { useState, useEffect } from 'react';
import { Account, AccountCategory, NetWorthEntry } from '../types';
import { CURRENCIES, ASSET_CATEGORIES, LIABILITY_CATEGORIES } from '../types';
import { formatCurrency, convertCurrencyWithEntry } from '../utils/currencyConverter';

interface OnboardingWizardProps {
  userId: string;
  accounts: Account[];
  entries: NetWorthEntry[];
  preferredCurrency: string;
  useSingleCurrency: boolean;
  assetCategories: AccountCategory[];
  liabilityCategories: AccountCategory[];
  onComplete: (data: {
    preferredCurrency: string;
    useSingleCurrency: boolean;
    accounts: Account[];
    firstEntry?: NetWorthEntry;
  }) => void;
  onSkip: () => void;
  onUpdateAccounts: (accounts: Account[]) => void;
  onUpdateCurrency: (currency: string) => void;
  onUpdateSingleCurrency: (useSingle: boolean) => void;
}

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export default function OnboardingWizard({
  userId,
  accounts,
  entries,
  preferredCurrency,
  useSingleCurrency,
  assetCategories,
  liabilityCategories,
  onComplete,
  onSkip,
  onUpdateAccounts,
  onUpdateCurrency,
  onUpdateSingleCurrency
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [localPreferredCurrency, setLocalPreferredCurrency] = useState(preferredCurrency || 'USD');
  const [localUseSingleCurrency, setLocalUseSingleCurrency] = useState<boolean | null>(null);
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);
  const [firstEntryValues, setFirstEntryValues] = useState<{ [accountId: string]: number }>({});

  // Load saved onboarding progress
  useEffect(() => {
    const savedStep = localStorage.getItem(`onboardingStep_${userId}`);
    const savedCurrency = localStorage.getItem(`firePreferredCurrency_${userId}`);
    const savedSingleCurrency = localStorage.getItem(`fireUseSingleCurrency_${userId}`);
    
    if (savedStep) {
      setCurrentStep(parseInt(savedStep) as OnboardingStep);
    }
    if (savedCurrency) {
      setLocalPreferredCurrency(savedCurrency);
    }
    if (savedSingleCurrency !== null) {
      setLocalUseSingleCurrency(savedSingleCurrency === 'true');
    }
  }, [userId]);

  // Save progress on step change
  useEffect(() => {
    localStorage.setItem(`onboardingStep_${userId}`, currentStep.toString());
  }, [currentStep, userId]);

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };

  const handleSkip = () => {
    // Save current progress
    localStorage.setItem(`onboardingStep_${userId}`, currentStep.toString());
    onSkip();
  };

  const handleSkipToDashboard = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    // Save onboarding completion
    localStorage.setItem(`onboardingCompleted_${userId}`, 'true');
    localStorage.setItem(`onboardingCompletedDate_${userId}`, new Date().toISOString());
    
    // Save preferences
    if (localPreferredCurrency) {
      onUpdateCurrency(localPreferredCurrency);
    }
    if (localUseSingleCurrency !== null) {
      onUpdateSingleCurrency(localUseSingleCurrency);
    }
    if (localAccounts.length > 0) {
      onUpdateAccounts(localAccounts);
    }

    // Create first entry if values provided
    let firstEntry: NetWorthEntry | undefined;
    if (Object.keys(firstEntryValues).length > 0) {
      const { convertCurrency } = await import('../utils/currencyConverter');
      const entryDate = new Date().toISOString().split('T')[0];
      let totalAssets = 0;
      let totalLiabilities = 0;
      const exchangeRates: { [currencyPair: string]: number } = {};

      // Convert values to preferred currency for totals
      for (const [accountId, value] of Object.entries(firstEntryValues)) {
        const account = localAccounts.find(acc => acc.id === accountId);
        if (account && value > 0) {
          // Values are stored in account's original currency
          let convertedValue = value;
          
          // Convert to preferred currency if different
          if (account.currency !== localPreferredCurrency) {
            try {
              convertedValue = await convertCurrency(value, account.currency, localPreferredCurrency, entryDate);
              const pair = `${account.currency}-${localPreferredCurrency}`;
              exchangeRates[pair] = convertedValue / value;
            } catch (error) {
              console.warn(`Could not convert ${account.currency} to ${localPreferredCurrency}:`, error);
              // Fallback: use 1:1 if conversion fails
              convertedValue = value;
            }
          }
          
          if (account.type === 'asset') {
            totalAssets += convertedValue;
          } else {
            totalLiabilities += convertedValue;
          }
        }
      }

      firstEntry = {
        id: `entry-${Date.now()}`,
        date: entryDate,
        accountValues: firstEntryValues, // Store in original currency
        exchangeRates: Object.keys(exchangeRates).length > 0 ? exchangeRates : undefined,
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities
      };
    }

    onComplete({
      preferredCurrency: localPreferredCurrency,
      useSingleCurrency: localUseSingleCurrency ?? true,
      accounts: localAccounts,
      firstEntry
    });
  };

  // Step Indicator Component
  const StepIndicator = ({ step, totalSteps }: { step: number; totalSteps: number }) => {
    const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s <= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            {s < totalSteps && (
              <div
                className={`w-12 h-1 mx-2 transition-colors ${
                  s < step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Step Indicator */}
        <div className="pt-6 px-6">
          <StepIndicator step={currentStep} totalSteps={6} />
        </div>

        {/* Step Content */}
        <div className="px-6 py-8">
          {currentStep === 1 && (
            <Step1Welcome
              onNext={handleNext}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 2 && (
            <Step2Currency
              preferredCurrency={localPreferredCurrency}
              useSingleCurrency={localUseSingleCurrency}
              onCurrencyChange={setLocalPreferredCurrency}
              onSingleCurrencyChange={setLocalUseSingleCurrency}
              onNext={handleNext}
              onBack={currentStep > 1 ? handleBack : undefined}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 3 && (
            <Step3Accounts
              accounts={localAccounts}
              preferredCurrency={localPreferredCurrency}
              useSingleCurrency={localUseSingleCurrency ?? true}
              assetCategories={assetCategories}
              liabilityCategories={liabilityCategories}
              onAccountsChange={setLocalAccounts}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 4 && (
            <Step4Values
              accounts={localAccounts}
              values={firstEntryValues}
              onValuesChange={setFirstEntryValues}
              preferredCurrency={localPreferredCurrency}
              assetCategories={assetCategories}
              liabilityCategories={liabilityCategories}
              onNext={() => {
                // If no values entered, skip Step 5 and go directly to Step 6
                if (Object.keys(firstEntryValues).length === 0 || 
                    Object.values(firstEntryValues).every(v => v === 0 || !v)) {
                  setCurrentStep(6 as OnboardingStep);
                } else {
                  handleNext();
                }
              }}
              onBack={handleBack}
              onSkip={() => {
                // Skip to Step 6 (Feature Tour) if no values, otherwise skip onboarding
                if (Object.keys(firstEntryValues).length === 0 || 
                    Object.values(firstEntryValues).every(v => v === 0 || !v)) {
                  setCurrentStep(6 as OnboardingStep);
                } else {
                  handleSkip();
                }
              }}
            />
          )}

          {currentStep === 5 && (
            <Step5FirstEntry
              accounts={localAccounts}
              entries={entries}
              preferredCurrency={localPreferredCurrency}
              firstEntryValues={firstEntryValues}
              onNext={handleNext}
              onBack={handleBack}
              onSkipToDashboard={handleSkipToDashboard}
            />
          )}

          {currentStep === 6 && (
            <Step6FeatureTour
              onComplete={handleComplete}
              onSkip={handleSkipToDashboard}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Welcome
function Step1Welcome({
  onNext,
  onSkip
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to OnwardFi!</h2>
      <p className="text-lg text-gray-600 mb-8">Your personal net worth tracker</p>

      <div className="grid grid-cols-1 gap-4 mb-8 text-left max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-700">Track your net worth over time</span>
        </div>
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-700">Multi-currency support</span>
        </div>
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-700">Beautiful charts and insights</span>
        </div>
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-700">FIRE calculator for financial independence</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Get Started
        </button>
      </div>

      <button
        onClick={onSkip}
        className="mt-6 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        Skip setup for now
      </button>
    </div>
  );
}

// Step 2: Currency Setup
function Step2Currency({
  preferredCurrency,
  useSingleCurrency,
  onCurrencyChange,
  onSingleCurrencyChange,
  onNext,
  onBack,
  onSkip
}: {
  preferredCurrency: string;
  useSingleCurrency: boolean | null;
  onCurrencyChange: (currency: string) => void;
  onSingleCurrencyChange: (useSingle: boolean) => void;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}) {
  // Always start with selection screen in onboarding (ignore saved preference)
  // This ensures users explicitly make the choice during onboarding
  const [currencyMode, setCurrencyMode] = useState<'single' | 'multi' | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(preferredCurrency || 'USD');

  const handleModeSelect = (mode: 'single' | 'multi') => {
    setCurrencyMode(mode);
    onSingleCurrencyChange(mode === 'single');
    // Auto-select currency if not already selected
    if (!selectedCurrency || selectedCurrency === '') {
      const defaultCurrency = preferredCurrency || 'USD';
      setSelectedCurrency(defaultCurrency);
      onCurrencyChange(defaultCurrency);
    }
  };

  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency);
    onCurrencyChange(currency);
  };

  // Can continue when: mode is selected AND currency is selected
  const canContinue = currencyMode !== null && selectedCurrency !== '';

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Currency Setup</h2>
      <p className="text-gray-600 mb-8">Tell us about your financial accounts</p>

      {currencyMode === null ? (
        // Part A: Single vs Multiple Currency Selection
        <div className="space-y-4">
          <div className="text-center mb-6">
            <p className="text-lg font-medium text-gray-700 mb-2">
              Do you have your accounts in only a single currency or multiple currencies?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <button
              onClick={() => handleModeSelect('single')}
              className={`p-6 border-2 rounded-xl transition-all duration-200 text-left ${
                currencyMode === 'single'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currencyMode === 'single' ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Single Currency</h3>
              </div>
              <p className="text-sm text-gray-600">All my accounts are in one currency</p>
            </button>

            <button
              onClick={() => handleModeSelect('multi')}
              className={`p-6 border-2 rounded-xl transition-all duration-200 text-left ${
                currencyMode === 'multi'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currencyMode === 'multi' ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg className="w-4 h-4 text-white absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginLeft: '24px', marginTop: '-8px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Multiple Currencies</h3>
              </div>
              <p className="text-sm text-gray-600">I have accounts in different currencies</p>
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">You can change this preference anytime in Settings</p>
          </div>
        </div>
      ) : currencyMode === 'single' ? (
        // Part B1: Single Currency Selection
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Your Currency</h3>
            <p className="text-gray-600">All your accounts will use this currency</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencySelect(currency.code)}
                className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                  selectedCurrency === currency.code
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl font-bold mb-1">{currency.code}</div>
                <div className="text-xs text-gray-600">{currency.name}</div>
              </button>
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-green-800">Simpler setup</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-green-800">No currency conversion needed</span>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setCurrencyMode(null)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Change selection
            </button>
          </div>
        </div>
      ) : (
        // Part B2: Multiple Currencies - Preferred Currency Selection
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Your Preferred Currency</h3>
            <p className="text-gray-600">You'll be able to see your total net worth calculated in this currency</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencySelect(currency.code)}
                className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                  selectedCurrency === currency.code
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl font-bold mb-1">{currency.code}</div>
                <div className="text-xs text-gray-600">{currency.name}</div>
              </button>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How Multi-Currency Works</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• You can set each account's currency individually</li>
                  <li>• All values will be automatically converted to {selectedCurrency}</li>
                  <li>• Your dashboard will show net worth in {selectedCurrency}</li>
                  <li>• Historical exchange rates are preserved for accuracy</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setCurrencyMode(null)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Change selection
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip for now
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!canContinue}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canContinue ? "Please select your currency preference first" : ""}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 3: Account Customization
function Step3Accounts({
  accounts,
  preferredCurrency,
  useSingleCurrency,
  assetCategories,
  liabilityCategories,
  onAccountsChange,
  onNext,
  onBack,
  onSkip
}: {
  accounts: Account[];
  preferredCurrency: string;
  useSingleCurrency: boolean;
  assetCategories: AccountCategory[];
  liabilityCategories: AccountCategory[];
  onAccountsChange: (accounts: Account[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [localAccounts, setLocalAccounts] = useState<Account[]>(() => {
    // Initialize with accounts, updating currency if it's still the default 'USD' to preferredCurrency
    if (accounts.length > 0 && preferredCurrency && preferredCurrency !== 'USD') {
      return accounts.map(account => ({
        ...account,
        // If account has no currency or still using default 'USD', update to preferredCurrency
        currency: (!account.currency || account.currency === 'USD') ? preferredCurrency : account.currency
      }));
    }
    if (accounts.length > 0 && preferredCurrency) {
      return accounts.map(account => ({
        ...account,
        currency: account.currency || preferredCurrency
      }));
    }
    return accounts;
  });
  const [localAssetCategories, setLocalAssetCategories] = useState<AccountCategory[]>(assetCategories);
  const [localLiabilityCategories, setLocalLiabilityCategories] = useState<AccountCategory[]>(liabilityCategories);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<string | null>(null); // For inline editing (account ID)
  const [editingAccountModal, setEditingAccountModal] = useState<Account | null>(null); // For modal editing (Account object)
  const [addingAccountToCategory, setAddingAccountToCategory] = useState<string | null>(null);
  const [addingCategoryType, setAddingCategoryType] = useState<'asset' | 'liability' | null>(null);
  const [categoryForm, setCategoryForm] = useState({ value: '', label: '' });
  const [accountForm, setAccountForm] = useState({ name: '', currency: preferredCurrency || 'USD', type: 'asset' as 'asset' | 'liability', category: '' });

  // Update accountForm currency when preferredCurrency changes (if form is empty)
  useEffect(() => {
    if (preferredCurrency && !editingAccount && !addingAccountToCategory) {
      setAccountForm(prev => {
        // Update currency if form is empty (no name entered)
        if (!prev.name) {
          return {
            ...prev,
            currency: preferredCurrency
          };
        }
        return prev;
      });
    }
  }, [preferredCurrency, editingAccount, addingAccountToCategory]);

  // Sync localAccounts when accounts prop changes and update currencies from 'USD' to preferredCurrency
  useEffect(() => {
    if (accounts.length > 0 && preferredCurrency && preferredCurrency !== 'USD') {
      // Check if accounts from props have 'USD' and need updating
      const hasAccountsWithUSD = accounts.some(acc => !acc.currency || acc.currency === 'USD');
      if (hasAccountsWithUSD) {
        const updatedAccounts = accounts.map(account => ({
          ...account,
          // Update if account has no currency or is still using the default 'USD'
          currency: (!account.currency || account.currency === 'USD') ? preferredCurrency : account.currency
        }));
        // Only update if localAccounts don't already match the updated accounts
        const needsUpdate = localAccounts.length !== updatedAccounts.length ||
          localAccounts.some((acc, idx) => acc.id !== updatedAccounts[idx]?.id || 
            acc.currency !== updatedAccounts[idx]?.currency);
        if (needsUpdate) {
          setLocalAccounts(updatedAccounts);
          onAccountsChange(updatedAccounts);
        }
        return;
      }
    }
    // Update localAccounts to match accounts prop if they differ (structure-wise, not just currency)
    if (accounts.length !== localAccounts.length || 
        accounts.some((acc, idx) => acc.id !== localAccounts[idx]?.id)) {
      if (accounts.length > 0 && preferredCurrency) {
        const syncedAccounts = accounts.map(account => ({
          ...account,
          currency: account.currency || preferredCurrency
        }));
        setLocalAccounts(syncedAccounts);
      } else {
        setLocalAccounts(accounts);
      }
    }
  }, [accounts, preferredCurrency]);

  const handleAccountToggle = (accountId: string, enabled: boolean) => {
    let updatedAccounts: Account[];
    
    if (enabled) {
      // Add account back (if it exists in original accounts)
      const accountToAdd = accounts.find(acc => acc.id === accountId);
      if (accountToAdd && !localAccounts.find(acc => acc.id === accountId)) {
        updatedAccounts = [...localAccounts, {
          ...accountToAdd,
          currency: accountToAdd.currency || preferredCurrency
        }];
      } else {
        updatedAccounts = localAccounts;
      }
    } else {
      // Remove account
      updatedAccounts = localAccounts.filter(acc => acc.id !== accountId);
    }
    
    setLocalAccounts(updatedAccounts);
    onAccountsChange(updatedAccounts);
  };

  const handleAccountEdit = (account: Account) => {
    setEditingAccountModal(account);
  };

  const handleAccountSave = (updatedAccount: Account) => {
    const updatedAccounts = localAccounts.map(acc =>
      acc.id === updatedAccount.id ? updatedAccount : acc
    );
    setLocalAccounts(updatedAccounts);
    onAccountsChange(updatedAccounts);
    setEditingAccountModal(null);
  };

  const handleAccountDelete = (accountId: string) => {
    const updatedAccounts = localAccounts.filter(acc => acc.id !== accountId);
    setLocalAccounts(updatedAccounts);
    onAccountsChange(updatedAccounts);
  };

  const getCategoryLabel = (categoryValue: string, type: 'asset' | 'liability') => {
    const categories = type === 'asset' ? localAssetCategories : localLiabilityCategories;
    return categories.find(cat => cat.value === categoryValue)?.label || categoryValue;
  };

  // Get accounts for a specific category
  const getAccountsForCategory = (categoryValue: string, type: 'asset' | 'liability') => {
    return localAccounts.filter(acc => acc.category === categoryValue && acc.type === type);
  };

  // Category handlers
  const handleAddCategory = (type: 'asset' | 'liability') => {
    if (!categoryForm.value || !categoryForm.label) return;

    const newCategory: AccountCategory = {
      value: categoryForm.value.toLowerCase().replace(/\s+/g, '-'),
      label: categoryForm.label,
      type,
    };

    if (type === 'asset') {
      setLocalAssetCategories([...localAssetCategories, newCategory]);
    } else {
      setLocalLiabilityCategories([...localLiabilityCategories, newCategory]);
    }

    setCategoryForm({ value: '', label: '' });
    setAddingCategoryType(null);
  };

  const handleEditCategory = (oldValue: string, type: 'asset' | 'liability') => {
    if (!categoryForm.label) return;

    const categories = type === 'asset' ? localAssetCategories : localLiabilityCategories;
    const updatedCategories = categories.map(cat =>
      cat.value === oldValue ? { ...cat, label: categoryForm.label } : cat
    );

    if (type === 'asset') {
      setLocalAssetCategories(updatedCategories);
    } else {
      setLocalLiabilityCategories(updatedCategories);
    }

    setCategoryForm({ value: '', label: '' });
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryValue: string, type: 'asset' | 'liability') => {
    const categoryAccounts = getAccountsForCategory(categoryValue, type);
    
    if (categoryAccounts.length > 0) {
      alert(`Cannot delete category. Please delete or move the ${categoryAccounts.length} account(s) in this category first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete this category?`)) {
      if (type === 'asset') {
        setLocalAssetCategories(localAssetCategories.filter(cat => cat.value !== categoryValue));
      } else {
        setLocalLiabilityCategories(localLiabilityCategories.filter(cat => cat.value !== categoryValue));
      }
    }
  };

  // Account handlers for inline editing
  const handleAddAccountToCategory = (categoryValue: string, type: 'asset' | 'liability') => {
    if (!accountForm.name) return;

    const newAccount: Account = {
      id: `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: accountForm.name,
      type,
      category: categoryValue,
      currency: accountForm.currency || preferredCurrency,
    };

    const updatedAccounts = [...localAccounts, newAccount];
    setLocalAccounts(updatedAccounts);
    onAccountsChange(updatedAccounts);
    setAccountForm({ name: '', currency: preferredCurrency || 'USD', type: 'asset', category: '' });
    setAddingAccountToCategory(null);
  };

  const handleEditAccountInline = (accountId: string) => {
    if (!accountForm.name) return;

    const updatedAccounts = localAccounts.map(acc =>
      acc.id === accountId
        ? { ...acc, name: accountForm.name, currency: accountForm.currency || preferredCurrency }
        : acc
    );

    setLocalAccounts(updatedAccounts);
    onAccountsChange(updatedAccounts);
    setAccountForm({ name: '', currency: preferredCurrency || 'USD', type: 'asset', category: '' });
    setEditingAccount(null);
  };

  const startEditCategory = (category: AccountCategory) => {
    setEditingCategory(category.value);
    setCategoryForm({ value: category.value, label: category.label });
  };

  const startEditAccountInline = (account: Account) => {
    setEditingAccount(account.id);
    setAccountForm({ name: account.name, currency: account.currency, type: account.type, category: account.category });
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditingAccount(null); // Inline editing
    setAddingAccountToCategory(null);
    setAddingCategoryType(null);
    setCategoryForm({ value: '', label: '' });
    setAccountForm({ name: '', currency: preferredCurrency || 'USD', type: 'asset', category: '' });
  };

  // Render add category form
  const renderAddCategoryForm = (type: 'asset' | 'liability') => {
    if (addingCategoryType !== type) return null;

    return (
      <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
        <h4 className="text-md font-semibold mb-3">Add New {type === 'asset' ? 'Asset' : 'Liability'} Category</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
            <input
              type="text"
              value={categoryForm.value}
              onChange={(e) => setCategoryForm({ ...categoryForm, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., real-estate"
            />
            <p className="text-xs text-gray-500 mt-1">Lowercase, use dashes</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={categoryForm.label}
              onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Real Estate"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleAddCategory(type)}
            disabled={!categoryForm.value || !categoryForm.label}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Add Category
          </button>
          <button
            onClick={cancelEdit}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Render category section with its accounts
  const renderCategorySection = (category: AccountCategory) => {
    const categoryAccounts = getAccountsForCategory(category.value, category.type);
    const isEditingThisCategory = editingCategory === category.value;
    const isAddingAccount = addingAccountToCategory === category.value;
    
    // Show category even if empty (for adding accounts)
    // But we can skip if we want - let's show them

    return (
      <div key={category.value} className="border rounded-lg p-4 bg-white mb-4">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-3">
          {isEditingThisCategory ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={categoryForm.label}
                onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Category name"
                autoFocus
              />
              <button
                onClick={() => handleEditCategory(category.value, category.type)}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">{getCategoryLabel(category.value, category.type)}</h3>
                <span className="text-sm text-gray-500">({categoryAccounts.length} account{categoryAccounts.length !== 1 ? 's' : ''})</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEditCategory(category)}
                  className="px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.value, category.type)}
                  className="px-2 py-1 text-xs border border-gray-300 text-gray-500 rounded hover:bg-gray-50 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-4">
          {categoryAccounts.map((account) => {
            const isEditingThisAccount = editingAccount === account.id;

            return (
              <div key={account.id}>
                {isEditingThisAccount ? (
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={accountForm.name}
                        onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Account name"
                      />
                      <select
                        value={accountForm.currency}
                        onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        {CURRENCIES.map(currency => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAccountInline(account.id)}
                          className="flex-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <AccountCardInline
                    account={account}
                    useSingleCurrency={useSingleCurrency}
                    onEdit={startEditAccountInline}
                    onDelete={handleAccountDelete}
                  />
                )}
              </div>
            );
          })}
          
          {/* Add Account Tile */}
          {isAddingAccount ? (
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 min-h-[120px]">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="e.g., Savings"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={accountForm.currency}
                    onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleAddAccountToCategory(category.value, category.type)}
                    disabled={!accountForm.name}
                    className="flex-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  >
                    Add
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setAddingAccountToCategory(category.value);
                setAccountForm({ name: '', currency: preferredCurrency || 'USD', type: 'asset', category: '' });
              }}
              className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center min-h-[120px] group"
            >
              <div className="text-3xl text-gray-300 group-hover:text-green-500 transition-colors mb-1">+</div>
              <div className="text-sm text-gray-500 group-hover:text-green-600 font-medium">Add Account</div>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your Accounts</h2>
      <p className="text-gray-600 mb-8">We've created some common accounts for you. Customize them now!</p>

      {editingAccountModal ? (
        <EditAccountForm
          account={editingAccountModal}
          preferredCurrency={preferredCurrency}
          useSingleCurrency={useSingleCurrency}
          assetCategories={assetCategories}
          liabilityCategories={liabilityCategories}
          onSave={handleAccountSave}
          onCancel={() => setEditingAccountModal(null)}
        />
      ) : (
        <>
          {/* Account Cards by Category */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {localAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No accounts yet. Add your first account below!</p>
              </div>
            ) : (
              <>
                {/* Assets Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">💰 Asset Categories</h3>
                    {!addingCategoryType && (
                      <button
                        onClick={() => setAddingCategoryType('asset')}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600"
                      >
                        + Add Category
                      </button>
                    )}
                  </div>
                  {renderAddCategoryForm('asset')}
                  {localAssetCategories.map(category => renderCategorySection(category))}
                </div>

                {/* Liabilities Section */}
                <div>
                  <div className="flex items-center justify-between mb-4 mt-6">
                    <h3 className="text-xl font-bold text-gray-800">💳 Liability Categories</h3>
                    {!addingCategoryType && (
                      <button
                        onClick={() => setAddingCategoryType('liability')}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50 hover:border-red-400 hover:text-red-600"
                      >
                        + Add Category
                      </button>
                    )}
                  </div>
                  {renderAddCategoryForm('liability')}
                  {localLiabilityCategories.map(category => renderCategorySection(category))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            I'll do this later
          </button>
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// Account Card Inline Component (for category-based layout)
function AccountCardInline({
  account,
  useSingleCurrency,
  onEdit,
  onDelete
}: {
  account: Account;
  useSingleCurrency: boolean;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
}) {
  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="mb-2">
        <div className="text-sm font-semibold text-gray-800 mb-1">{account.name}</div>
        <div className="inline-block text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border border-gray-300">
          {account.currency}
        </div>
      </div>
      <div className="flex gap-1 text-xs pt-2 border-t border-gray-200">
        <button
          onClick={() => onEdit(account)}
          className="flex-1 px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(account.id)}
          className="flex-1 px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Edit Account Form Component
function EditAccountForm({
  account,
  preferredCurrency,
  useSingleCurrency,
  assetCategories,
  liabilityCategories,
  onSave,
  onCancel
}: {
  account: Account;
  preferredCurrency: string;
  useSingleCurrency: boolean;
  assetCategories: AccountCategory[];
  liabilityCategories: AccountCategory[];
  onSave: (account: Account) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<'asset' | 'liability'>(account.type);
  const [category, setCategory] = useState(account.category);
  const [currency, setCurrency] = useState(account.currency);

  const categories = type === 'asset' ? assetCategories : liabilityCategories;

  const handleSave = () => {
    onSave({
      ...account,
      name,
      type,
      category,
      currency: currency || preferredCurrency
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Account</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter account name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType('asset');
              setCategory('');
            }}
            className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
              type === 'asset'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Asset
          </button>
          <button
            type="button"
            onClick={() => {
              setType('liability');
              setCategory('');
            }}
            className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
              type === 'liability'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Liability
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CURRENCIES.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.code} - {curr.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Add Account Form Component
function AddAccountForm({
  preferredCurrency,
  useSingleCurrency,
  assetCategories,
  liabilityCategories,
  existingAccountIds,
  onSave,
  onCancel
}: {
  preferredCurrency: string;
  useSingleCurrency: boolean;
  assetCategories: AccountCategory[];
  liabilityCategories: AccountCategory[];
  existingAccountIds: string[];
  onSave: (account: Account) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'asset' | 'liability'>('asset');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState(preferredCurrency);

  const categories = type === 'asset' ? assetCategories : liabilityCategories;

  const handleSave = () => {
    if (!name || !category) return;

    const newAccount: Account = {
      id: `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      category,
      currency: currency || preferredCurrency
    };

    onSave(newAccount);
    setName('');
    setCategory('');
    setCurrency(preferredCurrency);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Account</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Savings Account"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType('asset');
              setCategory('');
            }}
            className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
              type === 'asset'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Asset
          </button>
          <button
            type="button"
            onClick={() => {
              setType('liability');
              setCategory('');
            }}
            className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
              type === 'liability'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Liability
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CURRENCIES.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.code} - {curr.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={!name || !category}
          className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Account
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Step 4: Optional Value Entry
function Step4Values({
  accounts,
  values,
  onValuesChange,
  preferredCurrency,
  onNext,
  onBack,
  onSkip,
  assetCategories,
  liabilityCategories
}: {
  accounts: Account[];
  values: { [accountId: string]: number };
  onValuesChange: (values: { [accountId: string]: number }) => void;
  preferredCurrency: string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  assetCategories?: AccountCategory[];
  liabilityCategories?: AccountCategory[];
}) {
  const [enterValuesNow, setEnterValuesNow] = useState(false);
  const [localValues, setLocalValues] = useState<{ [accountId: string]: string }>(() => {
    const initial: { [accountId: string]: string } = {};
    accounts.forEach(account => {
      initial[account.id] = values[account.id]?.toString() || '';
    });
    return initial;
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [convertedValues, setConvertedValues] = useState<{ [accountId: string]: string }>({});

  // Helper function to get category label
  const getCategoryLabel = (categoryValue: string, type: 'asset' | 'liability') => {
    const categories = type === 'asset' ? assetCategories : liabilityCategories;
    if (!categories || categories.length === 0) return categoryValue;
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  // Get accounts by type
  const getAccountsByType = (type: 'asset' | 'liability') => {
    return accounts.filter(account => account.type === type);
  };

  // Get accounts by category
  const getAccountsByCategory = (type: 'asset' | 'liability') => {
    const typeAccounts = getAccountsByType(type);
    const categories: { [key: string]: Account[] } = {};
    
    typeAccounts.forEach(account => {
      const category = account.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(account);
    });
    
    return categories;
  };

  // Update converted values when inputs change
  useEffect(() => {
    accounts.forEach(account => {
      const value = values[account.id] || 0;
      if (account.currency !== preferredCurrency && value > 0) {
        convertCurrencyWithEntry(value, account.currency, preferredCurrency, selectedDate)
          .then(converted => {
            setConvertedValues(prev => ({
              ...prev,
              [account.id]: formatCurrency(converted, preferredCurrency)
            }));
          })
          .catch(error => {
            console.error(`Conversion failed for ${account.name}:`, error);
          });
      } else {
        setConvertedValues(prev => ({
          ...prev,
          [account.id]: formatCurrency(value, preferredCurrency)
        }));
      }
    });
  }, [values, accounts, preferredCurrency, selectedDate]);

  const handleValueChange = (accountId: string, value: string) => {
    setLocalValues({ ...localValues, [accountId]: value });
    const numValue = parseFloat(value) || 0;
    onValuesChange({ ...values, [accountId]: numValue });
  };

  // Render account card (similar to Daily Entry)
  const renderAccountCard = (account: Account) => {
    return (
      <div key={account.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">{account.name}</div>
            <div className="text-xs text-gray-500">{account.currency}</div>
          </div>
        </div>
        <div className="space-y-1">
          <input
            type="text"
            value={localValues[account.id] || ''}
            onChange={(e) => handleValueChange(account.id, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0.00"
            inputMode="decimal"
          />
          {values[account.id] ? (
            <div className="text-xs text-gray-600">
              <div className="truncate">{formatCurrency(values[account.id], account.currency)}</div>
              {account.currency !== preferredCurrency && (
                <div className="text-gray-400 truncate">
                  = {convertedValues[account.id] || '...'}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 h-6"></div>
          )}
        </div>
      </div>
    );
  };

  // Render account section by category (similar to Daily Entry)
  const renderAccountSection = (type: 'asset' | 'liability', title: string) => {
    const categories = getAccountsByCategory(type);
    const allAccounts = getAccountsByType(type);
    
    if (allAccounts.length === 0) {
      return null;
    }

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
        {Object.entries(categories).map(([category, categoryAccounts]) => {
          const categoryLabel = getCategoryLabel(category, type);
          
          return (
            <div key={category} className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">{categoryLabel}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categoryAccounts.map(renderAccountCard)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!enterValuesNow) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Your Current Values (Optional)</h2>
        <p className="text-gray-600 mb-8">You can enter values now or add them later in Daily Entry</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
          <button
            onClick={() => setEnterValuesNow(true)}
            className={`p-6 border-2 rounded-xl transition-all duration-200 ${
              enterValuesNow
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-lg font-semibold text-gray-900 mb-2">Enter values now</div>
            <p className="text-sm text-gray-600">Set up your accounts with current balances</p>
          </button>

          <button
            onClick={onSkip}
            className={`p-6 border-2 rounded-xl transition-all duration-200 ${
              !enterValuesNow
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-lg font-semibold text-gray-900 mb-2">I'll add them later</div>
            <p className="text-sm text-gray-600">Skip this step and add values later</p>
          </button>
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={onNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Your Current Values</h2>
      <p className="text-gray-600 mb-6">Enter the current balance for each account</p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="mb-6 max-h-[60vh] overflow-y-auto">
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No accounts to add values for. Please add accounts first.</p>
          </div>
        ) : (
          <>
            {renderAccountSection('asset', 'Assets')}
            {renderAccountSection('liability', 'Liabilities')}
          </>
        )}
      </div>


      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={() => setEnterValuesNow(false)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            I'll add later
          </button>
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 5: First Entry Tutorial
function Step5FirstEntry({
  accounts,
  entries,
  preferredCurrency,
  firstEntryValues,
  onNext,
  onBack,
  onSkipToDashboard
}: {
  accounts: Account[];
  entries: NetWorthEntry[];
  preferredCurrency: string;
  firstEntryValues: { [accountId: string]: number };
  onNext: () => void;
  onBack?: () => void;
  onSkipToDashboard: () => void;
}) {
  const hasFirstEntry = entries.length > 0 || Object.keys(firstEntryValues).length > 0;

  if (hasFirstEntry) {
    // Show success message if entry already created
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Great! Your First Entry is Recorded</h2>
        <p className="text-gray-600 mb-8">
          Your net worth tracking journey has begun. Let's explore your dashboard!
        </p>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Continue →
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Your First Entry</h2>
      <p className="text-gray-600 mb-8">
        Let's record your net worth for today to get started!
      </p>

      {accounts.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">No Accounts Yet</h3>
              <p className="text-sm text-yellow-800 mb-3">
                You need to set up at least one account before you can add an entry.
              </p>
              <button
                onClick={onBack}
                className="text-sm text-yellow-800 underline hover:text-yellow-900"
              >
                Go back to set up accounts
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Ready to Add Your First Entry</h3>
              <p className="text-sm text-blue-800 mb-3">
                You can add your first entry in the Daily Entry tab. We'll guide you through it, or you can explore on your own.
              </p>
              <p className="text-sm text-blue-700">
                After adding your first entry, you'll see your net worth visualized in charts and graphs!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <button
            onClick={onSkipToDashboard}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip to Dashboard
          </button>
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 6: Feature Highlights (Optional)
function Step6FeatureTour({
  onComplete,
  onSkip
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Dashboard',
      description: 'See your net worth growth over time with beautiful charts',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: 'Daily Entry',
      description: 'Track changes over time with easy-to-use entry forms',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: 'Portfolio',
      description: 'View asset allocation breakdown by category',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'FIRE Calculator',
      description: 'Plan your financial independence and retirement',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Your Dashboard</h2>
      <p className="text-gray-600 mb-8">Here are some key features to help you on your financial journey</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200"
          >
            <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Start Using OnwardFi
        </button>
      </div>
    </div>
  );
}

