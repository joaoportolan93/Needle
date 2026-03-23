import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ compact = false }) => {
  const { i18n } = useTranslation();

  const currentLang = i18n.language?.startsWith('pt') ? 'pt-BR' : 'en';

  const toggleLanguage = () => {
    const newLang = currentLang === 'pt-BR' ? 'en' : 'pt-BR';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`
        flex items-center gap-2 rounded-lg transition-all duration-200
        text-muted-foreground hover:text-foreground hover:bg-accent
        ${compact ? 'p-2' : 'px-4 py-2.5'}
      `}
      title={currentLang === 'pt-BR' ? 'Switch to English' : 'Mudar para Português'}
      aria-label={currentLang === 'pt-BR' ? 'Switch to English' : 'Mudar para Português'}
    >
      <span className="text-lg leading-none">
        {currentLang === 'pt-BR' ? '🇧🇷' : '🇺🇸'}
      </span>
      {!compact && (
        <span className="text-sm font-medium">
          {currentLang === 'pt-BR' ? 'PT-BR' : 'EN'}
        </span>
      )}
    </button>
  );
};

export default LanguageSwitcher;
