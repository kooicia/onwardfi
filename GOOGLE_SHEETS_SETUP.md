# Google Sheets Integration Setup Guide

This guide will walk you through setting up Google Sheets integration for your OnwardFi Net Worth Tracker application.

## Overview

The Google Sheets integration allows users to:
- Connect their Google account via OAuth 2.0
- Automatically create a Google Sheet in their Google Drive
- Sync their net worth data to the sheet
- Enable auto-sync to keep data always up-to-date
- View formatted data with multiple sheets (Data, Accounts, Summary)

## Prerequisites

1. A Google Cloud Platform account
2. Access to Google Cloud Console

## Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "OnwardFi Net Worth Tracker")
5. Click "Create"

### Step 2: Enable Google Sheets API

1. In the Google Cloud Console, ensure your new project is selected
2. Navigate to "APIs & Services" > "Library"
3. Search for "Google Sheets API"
4. Click on "Google Sheets API"
5. Click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted to configure the OAuth consent screen:
   - Click "Configure Consent Screen"
   - Select "External" user type
   - Fill in the required fields:
     - App name: "OnwardFi Net Worth Tracker"
     - User support email: Your email
     - Developer contact email: Your email
   - Click "Save and Continue"
   - Skip the "Scopes" step (click "Save and Continue")
   - Add test users if needed
   - Click "Save and Continue"
   - Click "Back to Dashboard"

4. Now create the OAuth client ID:
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "OnwardFi Web Client"
   - Authorized JavaScript origins:
     - For development: `http://localhost:3000`
     - For production: Add your production URL (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs: Leave empty (not needed for this implementation)
   - Click "Create"

5. Copy the generated credentials:
   - Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
   - You'll also see an API key option in the Credentials page

### Step 4: Create an API Key

1. In "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API key"
3. Copy the generated API key
4. (Optional) Click "Restrict Key" to add restrictions:
   - Application restrictions: Select "HTTP referrers"
   - Add your website URLs
   - API restrictions: Select "Restrict key" and choose "Google Sheets API"
   - Click "Save"

### Step 5: Configure Your Application

1. Open the file `src/firebase.ts` in your project
2. Replace the placeholder values with your credentials:

```typescript
export const GOOGLE_CLIENT_ID = "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com";
export const GOOGLE_API_KEY = "YOUR_ACTUAL_API_KEY";
```

Example:
```typescript
export const GOOGLE_CLIENT_ID = "123456789-abcdefghijklmnop.apps.googleusercontent.com";
export const GOOGLE_API_KEY = "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz";
```

3. Save the file

### Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm start
   ```

2. Log into the application
3. Navigate to Settings > Google Sheets tab
4. Click "Connect Google Sheets"
5. Sign in with your Google account
6. Grant the necessary permissions
7. The app will create a new Google Sheet and sync your data

## Features

### Automatic Spreadsheet Creation

When you connect for the first time, the app automatically creates a new Google Sheet with three tabs:

1. **Data Sheet**: Contains all your net worth entries with:
   - Date
   - Total Assets
   - Total Liabilities
   - Net Worth
   - Individual account values

2. **Accounts Sheet**: Lists all your accounts with:
   - Account Name
   - Type (Asset/Liability)
   - Category
   - Currency

3. **Summary Sheet**: Displays key metrics:
   - Preferred Currency
   - Total Accounts
   - Total Entries
   - Latest Net Worth
   - Latest Total Assets
   - Latest Total Liabilities
   - Last Updated timestamp

### Auto-Sync

When enabled, auto-sync will:
- Automatically sync your data whenever you make changes
- Use a 2-second debounce to prevent excessive API calls
- Update the "Last Synced" timestamp
- Run in the background without interrupting your workflow

### Manual Sync

You can manually trigger a sync at any time:
1. Go to Settings > Google Sheets
2. Click "Sync Now"
3. Wait for the success message

### Disconnecting

To disconnect your Google Sheets:
1. Go to Settings > Google Sheets
2. Click "Disconnect"
3. This will sign you out but won't delete the spreadsheet
4. The spreadsheet remains in your Google Drive for future access

## Troubleshooting

### "Configuration Required" Message

If you see this message, it means the Google API credentials haven't been configured yet. Follow Steps 1-5 above.

### Authentication Failed

If authentication fails:
1. Check that your Client ID and API Key are correct
2. Verify that your current URL is listed in the "Authorized JavaScript origins"
3. Make sure the Google Sheets API is enabled in your project
4. Clear your browser cache and cookies
5. Try using an incognito/private browsing window

### Sync Errors

If syncing fails:
1. Check your internet connection
2. Verify that the spreadsheet still exists in your Google Drive
3. Ensure you haven't revoked the app's permissions in your Google account settings
4. Try disconnecting and reconnecting

### Rate Limiting

Google Sheets API has rate limits. If you're hitting rate limits:
1. Disable auto-sync temporarily
2. Use manual sync only when needed
3. Consider increasing the debounce time in `src/App.tsx` (currently 2 seconds)

## Privacy & Security

- Your data is synced directly to your Google account
- The app only requests permissions for Google Sheets (not Drive or other services)
- All data remains private in your Google Drive
- The app doesn't store your Google credentials
- You can revoke access at any time in your [Google Account Settings](https://myaccount.google.com/permissions)

## Advanced Configuration

### Custom Debounce Time

To change the auto-sync delay, edit `src/App.tsx`:

```typescript
// Change 2000 to your preferred milliseconds
const timeoutId = setTimeout(() => {
  autoSyncToSheets();
}, 2000); // Current: 2 seconds
```

### Spreadsheet Formatting

To customize the spreadsheet appearance, edit `src/utils/googleSheetsSync.ts` in the `syncToGoogleSheets` function. You can modify:
- Header colors
- Font styles
- Column widths
- Number formatting

## Support

If you encounter any issues not covered in this guide:
1. Check the browser console for error messages
2. Review the Google Cloud Console for API usage and errors
3. Ensure all credentials are correctly configured
4. Verify that the Google Sheets API quota hasn't been exceeded

## Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

