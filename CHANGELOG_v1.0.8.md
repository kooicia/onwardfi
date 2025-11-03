# Changelog v1.0.8

## FIRE Calculator Enhancements

### Removed Toggle, Added Quick Action Buttons
- **Removed** the "Use data from your net worth entries" toggle for a cleaner interface
- **Added "Use Latest" button** next to Current Savings field that instantly copies the user's latest net worth value
- **Added "Use Estimate" button** next to Annual Savings field that fills in estimated annual savings based on historical data
- Quick action buttons only appear when relevant data is available
- Shows latest net worth and estimated savings values below input fields for easy reference

### Persistent Calculator Values
- **All calculator inputs are now saved** to localStorage and automatically restored when users return
- Values persist across browser sessions using user-specific storage keys
- Saved fields include:
  - Annual Expenses
  - Withdrawal Rate
  - Current Age
  - Target Age
  - Current Savings
  - Annual Savings
  - Expected Annual Return
  - Expected Inflation Rate

### Improved Number Input Legibility
- **Added thousand separators** (e.g., "1,000,000") to all numeric input fields:
  - Annual Expenses
  - Current Savings
  - Annual Savings
- Improves readability for large numbers
- Automatically formats numbers as user types

## Daily Entry Enhancements

### Enhanced Visual Feedback
- **Improved save/update/delete feedback** with better visual indicators
- Added minimum loading duration (800ms) to ensure feedback is visible
- Success messages display with clear visual confirmation
- Error messages clearly indicate what went wrong
- Status messages auto-dismiss after a few seconds
- Feedback cleared when date selection changes to prevent stale messages

## Account Management Improvements

### Data Protection for Account Deletion
- **Added comprehensive warnings** when deleting accounts that have historical data
- Shows detailed information before deletion:
  - Number of data points associated with the account
  - Date range of existing data
- Requires explicit user confirmation before deletion
- Helps prevent accidental data loss
- Applied to both Settings page and account management components

## Portfolio Allocation Enhancements

### Trend Lines for Categories and Accounts
- **Added sparkline trend charts** showing value changes over the last 12 entries
- Trend lines displayed to the left of category values in the detailed breakdown
- Trend lines displayed to the left of individual account values
- Uses last 12 entries instead of 12 months for more consistent data points
- Handles zero-value trends gracefully with flat line visualization
- Fixed "no data" issues for accounts with historical data

### Improved Data Handling
- Better initialization of trend data for all accounts in entries
- Accounts with historical data now properly show trend lines even if filtered
- Enhanced Sparkline component for better zero-value visualization

## Technical Improvements

- Added `currentUserId` prop to `FIRECalculator` component for user-specific data persistence
- Enhanced localStorage management with proper error handling
- Improved state management for calculator persistence
- Better TypeScript typing for saved calculator values
- Optimized component re-renders with proper dependency arrays

## Bug Fixes

- Fixed issue where trend lines showed "no data" for accounts with past entries
- Improved handling of zero-value trends in portfolio allocation
- Enhanced error handling for localStorage operations

