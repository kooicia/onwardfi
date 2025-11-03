# Changelog

All notable changes to this project will be documented in this file.

## [1.0.7] - 2024-12-19

### Added
- Currency selection now always available for each account, even in single currency mode
- Users can set different currencies per account regardless of their currency mode preference
- Improved account setup detection: distinguishes between default predefined accounts and customized accounts

### Changed
- **Onboarding Flow Improvements:**
  - Step 5 (First Entry Tutorial) is now skipped if user chooses "add values later" in Step 4
  - Users who skip value entry now go directly to Step 6 (Feature Tour) instead of seeing unnecessary first entry tutorial
  - Currency defaults now properly reflect user's selected preferred currency instead of always defaulting to USD
  
- **Dashboard Empty State:**
  - Smart detection of account setup status
  - Shows "Add Current Values" button when accounts are set up but no entries exist
  - Shows "Start Setup Wizard" button only when accounts haven't been customized
  - Different messaging and steps based on whether accounts are customized or just default predefined accounts

- **Account Management:**
  - Currency selector always visible in all account forms (Add Account, Edit Account, inline editing)
  - New accounts default to preferred currency but can be changed
  - Existing accounts update from default 'USD' to preferred currency when user selects a different currency
  - Currency initialization logic improved to handle currency preference changes correctly

### Fixed
- Fixed issue where accounts showed USD instead of user's selected preferred currency (e.g., AUD)
- Fixed onboarding flow when user chooses to add values later - Step 5 is now properly skipped
- Fixed empty dashboard detection to distinguish between users with default accounts vs. customized accounts

## [1.0.6] - Previous Release
- Portfolio allocation page with asset/liability breakdown
- Onboarding wizard implementation
- Currency selection improvements

