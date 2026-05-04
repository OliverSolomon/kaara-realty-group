"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ar" | "zh";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const DICTIONARY: Record<Language, Record<string, string>> = {
  en: {
    search: "SEARCH",
    discover: "DISCOVER",
    properties: "PROPERTIES",
    neighborhoods: "NEIGHBORHOODS",
    about: "ABOUT",
    contact: "CONTACT",
    compare: "COMPARE",
    view_details: "VIEW DETAILS",
    price_on_request: "Price on Request",
    exclusive: "EXCLUSIVE",
  },
  ar: {
    search: "بحث",
    discover: "اكتشف",
    properties: "العقارات",
    neighborhoods: "الأحياء",
    about: "حول",
    contact: "اتصل",
    compare: "مقارنة",
    view_details: "عرض التفاصيل",
    price_on_request: "السعر عند الطلب",
    exclusive: "حصري",
  },
  zh: {
    search: "搜索",
    discover: "发现",
    properties: "房产",
    neighborhoods: "社区",
    about: "关于",
    contact: "联系我们",
    compare: "比较",
    view_details: "查看详情",
    price_on_request: "价格面议",
    exclusive: "独家",
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("kaara_language") as Language;
    if (savedLang && ["en", "ar", "zh"].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem("kaara_language", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  const t = (key: string) => {
    return DICTIONARY[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div dir={language === "ar" ? "rtl" : "ltr"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
