import React, { createContext, useContext, useState } from 'react';
import { translations, getText } from '../data/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLangState] = useState(() => {
        const saved = localStorage.getItem('appLang');
        return (saved === 'vi' || saved === 'en') ? saved : 'vi';
    });

    const setLang = (newLang) => {
        if (['vi', 'en'].includes(newLang)) {
            localStorage.setItem('appLang', newLang);
            setLangState(newLang);
        }
    };

    const t = (key, params = {}) => {
        try {
            const parts = key.split('.');
            let value = translations[lang];
            for (const part of parts) {
                if (value && typeof value === 'object' && part in value) {
                    value = value[part];
                } else {
                    return key;
                }
            }
            if (typeof value === 'string' && Object.keys(params).length > 0) {
                // Replace {{param}} or {param} placeholders
                let result = value;
                // Handle {{param}} format first (2 braces)
                result = result.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                    return params[param] !== undefined ? params[param] : match;
                });
                // Handle {param} format (1 brace)
                result = result.replace(/\{(\w+)\}/g, (match, param) => {
                    return params[param] !== undefined ? params[param] : match;
                });
                return result;
            }
            return value;
        } catch (e) {
            return key;
        }
    };

    const tRaw = (text) => {
        return getText(lang, text);
    };

    const value = { lang, setLang, t, tRaw };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};
