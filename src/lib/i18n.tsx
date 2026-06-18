import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ml' | 'hi';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  en: {
    dashboard: 'Dashboard',
    inbox: 'Inbox',
    settings: 'Settings',
    logout: 'Logout',
    notifications: 'Notifications',
    selectLanguage: 'Language',
    operationsCommand: 'Operations Command',
    dailyPatientVolume: 'Daily Patient Volume',
    scheduleCompletion: 'Schedule Completion',
    activeStaff: 'Active Staff',
    estWaitTime: 'Est. Wait Time',
    search: 'Search command or jump to...',
    welcomeBack: 'Welcome back,',
    petParent: 'Pet Parent',
    addPetProfile: 'Add Pet Profile',
    liveUpdates: 'Live Updates',
    scheduleCheckup: 'Schedule Checkup'
  },
  ml: {
    dashboard: 'ഡാഷ്ബോർഡ്',
    inbox: 'ഇൻബോക്സ്',
    settings: 'ക്രമീകരണങ്ങൾ',
    logout: 'ലോഗൗട്ട്',
    notifications: 'അറിയിപ്പുകൾ',
    selectLanguage: 'ഭാഷ',
    operationsCommand: 'ഓപ്പറേഷൻസ് കമാൻഡ്',
    dailyPatientVolume: 'പ്രതിദിന രോഗികൾ',
    scheduleCompletion: 'ഷെഡ്യൂൾ പൂർത്തിയാക്കൽ',
    activeStaff: 'സജീവ സ്റ്റാഫ്',
    estWaitTime: 'കാത്തിരിപ്പ് സമയം',
    search: 'തിരയുക...',
    welcomeBack: 'തിരികെ സ്വാഗതം,',
    petParent: 'വളർത്തുമൃഗത്തിന്റെ രക്ഷിതാവ്',
    addPetProfile: 'വളർത്തുമൃഗത്തെ ചേർക്കുക',
    liveUpdates: 'തത്സമയ വിവരങ്ങൾ',
    scheduleCheckup: 'ചെക്കപ്പ് ഷെഡ്യൂൾ ചെയ്യുക'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    inbox: 'इनबॉक्स',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    notifications: 'सूचनाएं',
    selectLanguage: 'भाषा',
    operationsCommand: 'संचालन कमान',
    dailyPatientVolume: 'दैनिक रोगी मात्रा',
    scheduleCompletion: 'अनुसूची पूर्णता',
    activeStaff: 'सक्रिय कर्मचारी',
    estWaitTime: 'प्रतीक्षा समय',
    search: 'खोजें...',
    welcomeBack: 'वापसी पर स्वागत है,',
    petParent: 'पालतू जानवर के माता-पिता',
    addPetProfile: 'पालतू प्रोफाइल जोड़ें',
    liveUpdates: 'लाइव अपडेट',
    scheduleCheckup: 'चेकअप शेड्यूल करें'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
