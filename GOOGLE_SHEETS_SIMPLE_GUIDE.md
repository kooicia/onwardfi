# Google Sheets Sync - Simple Guide

## 🤔 What Is This Feature?

The Google Sheets sync feature lets users view their net worth data in a Google Sheet (like Excel, but online). 

**Example:**
- User enters their net worth data in your app
- They click "Connect Google Sheets"
- A new spreadsheet appears in their Google Drive with all their data
- Whenever they update data in your app, the sheet updates automatically

## 🔑 Why Do We Need Credentials?

### The Problem
Your app needs permission to create and write to Google Sheets on behalf of users.

### The Solution
You register your app with Google once, and Google gives you credentials (like an ID card). When users try to connect, Google checks your credentials and says "OK, this app is legitimate, I'll ask the user if they want to allow it."

### Important: One Set of Credentials = All Users
- **You** set up credentials **once** (as the app developer)
- **Every user** can then use the feature with their own Google account
- Users don't need to set up anything in Google Cloud

## 📋 Step-by-Step Setup (10 minutes)

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### Step 2: Create a New Project
1. Click the project dropdown at the top
2. Click "New Project"
3. Name it: "OnwardFi" (or any name)
4. Click "Create"
5. Wait 30 seconds for it to be created

### Step 3: Enable Google Sheets API
1. In the left menu, click "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it
4. Click "Enable"
5. Wait for it to enable (~10 seconds)

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted about consent screen:
   - Click "Configure Consent Screen"
   - Choose "External"
   - Fill in:
     - App name: "OnwardFi"
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue" through all screens
   - Click "Back to Dashboard"
   - Return to "Credentials" tab

4. Now create the OAuth client:
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "OnwardFi Web Client"
   - Authorized JavaScript origins:
     - Click "Add URI"
     - Enter: `http://localhost:3000`
     - (Later add your production URL like `https://yourdomain.com`)
   - Click "Create"

5. **COPY THE CLIENT ID** - it looks like:
   ```
   123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```

### Step 5: Create API Key
1. Still in "Credentials" page
2. Click "Create Credentials" → "API key"
3. **COPY THE API KEY** - it looks like:
   ```
   AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz
   ```
4. (Optional) Click "Restrict Key":
   - API restrictions: Choose "Google Sheets API"
   - Click "Save"

### Step 6: Update Your App

Open `src/firebase.ts` and replace these lines:

**BEFORE:**
```typescript
export const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
export const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY";
```

**AFTER (using your actual credentials):**
```typescript
export const GOOGLE_CLIENT_ID = "123456789-abcdefghijklmnop.apps.googleusercontent.com";
export const GOOGLE_API_KEY = "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz";
```

### Step 7: Restart Your App
```bash
npm start
```

## ✅ Testing It Out

1. Open your app at http://localhost:3000
2. Log in
3. Go to **Settings** → **Google Sheets** tab
4. Click "Connect Google Sheets"
5. Sign in with your Google account
6. Grant permission when asked
7. A new spreadsheet will be created!
8. Click "Open in Google Sheets" to see it

## 🎯 What Happens for End Users?

Once you've set up the credentials, here's what users experience:

1. **User opens your app** → They see the Google Sheets option
2. **User clicks "Connect"** → They're asked to sign in with their Google account
3. **User signs in** → Google asks "Do you want to allow OnwardFi to access your Sheets?"
4. **User clicks "Allow"** → A new spreadsheet is created in their Drive
5. **Done!** → Their data syncs automatically

## 🔒 Security & Privacy

### Is This Safe?
**Yes!** Here's why:
- You never see users' Google passwords
- Users explicitly grant permission
- Users can revoke access anytime in their Google account settings
- Data goes directly from your app to their Google Drive
- Each user's data stays in their own private Google Drive

### What Can the App Do?
The app can only:
- ✅ Create and edit spreadsheets
- ❌ Can't access email, documents, or other files
- ❌ Can't delete anything
- ❌ Can't access other Google services

### What If I Don't Set Up Credentials?
- The feature simply won't work
- Users will see a message: "Configuration Required"
- The rest of your app works normally
- No errors or crashes

## 🆘 Troubleshooting

### "Configuration Required" message shows up
**Solution:** You haven't updated the credentials in `src/firebase.ts` yet.

### "Failed to initialize Google API"
**Solution:** 
1. Check that credentials are correctly copy-pasted (no extra spaces)
2. Make sure you enabled Google Sheets API in Google Cloud
3. Try clearing browser cache and cookies

### "Authentication failed"
**Solution:**
1. Check that `http://localhost:3000` is added to "Authorized JavaScript origins"
2. Make sure the OAuth client ID is correct
3. Try in an incognito/private browser window

### "This app isn't verified"
**Solution:** This is normal for development. Click "Advanced" → "Go to [app name] (unsafe)". For production, you'd submit your app for Google verification.

## 💡 Do I HAVE to Set This Up?

**No!** The Google Sheets feature is completely optional:
- If you don't set it up, the rest of your app works fine
- Users just won't see the Google Sheets sync option
- They can still export data as JSON/CSV

## 📝 Summary

**What you need:**
1. Google Cloud account (free)
2. 10 minutes to follow the steps above
3. Copy two values into your code

**What you get:**
- Users can sync their data to Google Sheets
- Data automatically stays up-to-date
- Professional feature that makes your app more useful

**Cost:**
- **$0** - Google Sheets API is free for normal use
- You get 60 requests per minute per user, which is more than enough

---

Still confused? Check out `GOOGLE_SHEETS_SETUP.md` for even more detailed instructions with screenshots and explanations!

