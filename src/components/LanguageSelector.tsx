import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', labelKey: 'english' },
  { code: 'zh', labelKey: 'chineseTraditional' },
];

export default function LanguageSelector({ className = '' }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language === 'zh' || i18n.language.startsWith('zh') ? 'zh' : 'en';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="language-select" className="text-sm font-medium text-gray-700">
        {t('language')}:
      </label>
      <select
        id="language-select"
        value={currentLang}
        onChange={handleChange}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {t(lang.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
} 