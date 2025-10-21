# OnwardFi - Net Worth Tracker

A comprehensive net worth tracking application built with React and TypeScript. Track your assets, liabilities, and net worth over time with support for multiple currencies and automatic exchange rate conversion.

## ✨ Features

- 📊 **Net Worth Tracking**: Track your assets and liabilities over time
- 💰 **Multi-Currency Support**: Support for USD, EUR, GBP, JPY, SGD, MYR, AUD with automatic conversion
- 📈 **Interactive Charts**: Visualize your net worth growth with beautiful charts
- 🔥 **FIRE Calculator**: Calculate your Financial Independence, Retire Early goals
- 📁 **Data Import/Export**: Import and export data in JSON and CSV formats
- 🔄 **Google Sheets Sync**: NEW! Automatically sync your data to Google Sheets
- 🌐 **Multi-language Support**: Available in multiple languages
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🆕 Google Sheets Integration

The app now supports automatic synchronization with Google Sheets! This allows you to:

- **View your data in Google Sheets** for advanced analysis and sharing
- **Auto-sync** to keep your spreadsheet always up-to-date
- **Three organized sheets**: Data, Accounts, and Summary
- **Beautiful formatting** with color-coded headers

[See detailed setup instructions →](./GOOGLE_SHEETS_SETUP.md)

## Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## 🔧 Configuration

### Google Sheets Integration

To enable Google Sheets sync:

1. Follow the detailed instructions in [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)
2. Update credentials in `src/firebase.ts`
3. Restart the development server

### Firebase (Optional)

The app includes Firebase configuration stubs. To enable real Firebase features, update the credentials in `src/firebase.ts`.

## 📚 Learn More

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)
- [Google Sheets API documentation](https://developers.google.com/sheets/api)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.
