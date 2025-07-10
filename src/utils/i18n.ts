import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Add all English translations here
      "appName": "OnwardFI",
      "dashboard": "Dashboard",
      "dailyEntry": "Daily Entry",
      "dataManagement": "Data Management",
      "fireCalculator": "FIRE Calculator",
      "settings": "Settings",
      "generalSettings": "General Settings",
      "preferredCurrency": "Preferred Currency for Totals",
      "displayCurrency": "Display Currency:",
      "resetToDefaults": "Reset to Defaults",
      "accounts": "Accounts",
      "accountCategories": "Account Categories",
      "assetCategories": "Asset Categories",
      "liabilityCategories": "Liability Categories",
      "importantNotes": "Important Notes",
      "language": "Language",
      "english": "English",
      "chineseTraditional": "Chinese (Traditional)",
      "addCategory": "Add Category",
      "addAssetCategory": "Add Asset Category",
      "addLiabilityCategory": "Add Liability Category",
      "edit": "Edit",
      "delete": "Delete",
      "save": "Save",
      "cancel": "Cancel",
      "resetCategoriesConfirm": "Are you sure you want to reset all categories to their default values? This will remove all custom categories you have created.",
      "noAssetCategories": "No asset categories defined",
      "noLiabilityCategories": "No liability categories defined",
      "addNewCategory": "Add New Category",
      "categoryValue": "Category Value",
      "displayName": "Display Name",
      "type": "Type",
      "selectType": "Select type",
      "asset": "Asset",
      "liability": "Liability",
      "internalIdentifier": "This is the internal identifier (auto-converted to lowercase with hyphens)",
      "nameShownToUsers": "This is the name shown to users",
      "currencyDescription": "This currency will be used to display all totals and net worth. All account values will be converted to this currency for summary calculations.",
      "importExport": "Import / Export",
      "dangerZone": "Danger Zone",
      // ...add more keys as needed
    }
  },
  zh: {
    translation: {
      // Add all Traditional Chinese translations here
      "appName": "OnwardFI",
      "dashboard": "儀表板",
      "dailyEntry": "每日記錄",
      "dataManagement": "資料管理",
      "fireCalculator": "FIRE 計算器",
      "settings": "設定",
      "generalSettings": "一般設定",
      "preferredCurrency": "總計首選貨幣",
      "displayCurrency": "顯示貨幣：",
      "resetToDefaults": "重設為預設值",
      "accounts": "帳戶",
      "accountCategories": "帳戶類別",
      "assetCategories": "資產類別",
      "liabilityCategories": "負債類別",
      "importantNotes": "重要說明",
      "language": "語言",
      "english": "英文",
      "chineseTraditional": "繁體中文",
      "addCategory": "新增類別",
      "addAssetCategory": "新增資產類別",
      "addLiabilityCategory": "新增負債類別",
      "edit": "編輯",
      "delete": "刪除",
      "save": "儲存",
      "cancel": "取消",
      "resetCategoriesConfirm": "您確定要將所有類別重設為預設值嗎？這將移除您建立的所有自訂類別。",
      "noAssetCategories": "尚未定義資產類別",
      "noLiabilityCategories": "尚未定義負債類別",
      "addNewCategory": "新增類別",
      "categoryValue": "類別值",
      "displayName": "顯示名稱",
      "type": "類型",
      "selectType": "選擇類型",
      "asset": "資產",
      "liability": "負債",
      "internalIdentifier": "這是內部識別碼（自動轉為小寫並以連字符分隔）",
      "nameShownToUsers": "這是顯示給使用者的名稱",
      "currencyDescription": "此貨幣將用於顯示所有總計和淨資產。所有帳戶金額將會轉換為此貨幣以進行彙總計算。",
      "importExport": "匯入 / 匯出",
      "dangerZone": "危險區域",
      // ...add more keys as needed
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n; 