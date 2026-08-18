"use client";

import React, { createContext, useCallback, useContext, useSyncExternalStore } from "react";

export type Language = "en" | "ar" | "zh";

export const LANGUAGES: { code: Language; label: string; native: string; locale: string }[] = [
  { code: "en", label: "English", native: "English", locale: "en-KE" },
  { code: "ar", label: "Arabic", native: "العربية", locale: "ar-AE-u-nu-latn" },
  { code: "zh", label: "Chinese", native: "中文", locale: "zh-CN" },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Looks a phrase up in the dictionary, falling back to the English wording. */
  t: (key: string) => string;
  /** BCP 47 tag for Intl, so numbers and dates follow the chosen language. */
  locale: string;
  /** True for right to left languages, so components can mirror themselves. */
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Interface wording only.
 *
 * Listing copy, page copy and market insights come from the Studio and stay in
 * the language they were written in. This dictionary covers the chrome around
 * that content: navigation, buttons, labels, states.
 */
const DICTIONARY: Record<Language, Record<string, string>> = {
  en: {
    // navigation
    buy: "Buy",
    sell: "Sell",
    stay: "Stay",
    world_of_kaara: "World of Kaara",
    market_insights: "Market Insights",
    contact: "Contact",
    all_properties: "All Properties",
    search: "Search",
    menu: "Menu",
    close: "Close",
    currency: "Currency",
    language: "Language",
    // listings
    properties: "Properties",
    property: "Property",
    listings: "Listings",
    view_listing: "View listing",
    view_all_properties: "View all properties",
    see_more: "See more",
    more_properties: "more properties",
    more_property: "more property",
    price_on_request: "Price on request",
    rate_on_request: "Rate on request",
    per_night: "a night",
    owner_vetted: "Owner vetted",
    views: "views",
    bed: "bed",
    bath: "bath",
    // filters
    everything: "Everything",
    sort: "Sort",
    newest_first: "Newest first",
    price_low_high: "Price, low to high",
    price_high_low: "Price, high to low",
    property_type: "Property type",
    bedrooms_minimum: "Bedrooms, minimum",
    maximum_price: "Maximum price",
    no_limit: "No limit",
    any: "Any",
    clear_all: "Clear all",
    filters_on: "filters on",
    // tools
    run_the_numbers: "Run the numbers",
    floor_area: "Floor area",
    repayments: "Repayments",
    amount: "Amount",
    // forms
    email_address: "Email address",
    subscribe: "Subscribe",
    send: "Send",
    sending: "Sending",
    // states
    nothing_found: "Nothing matches those filters",
    registered_company: "Registered company",
    all_rights_reserved: "All rights reserved",
  },
  ar: {
    buy: "شراء",
    sell: "بيع",
    stay: "إقامة",
    world_of_kaara: "عالم كارا",
    market_insights: "رؤى السوق",
    contact: "اتصل بنا",
    all_properties: "جميع العقارات",
    search: "بحث",
    menu: "القائمة",
    close: "إغلاق",
    currency: "العملة",
    language: "اللغة",
    properties: "العقارات",
    property: "عقار",
    listings: "القوائم",
    view_listing: "عرض العقار",
    view_all_properties: "عرض جميع العقارات",
    see_more: "عرض المزيد",
    more_properties: "عقارات أخرى",
    more_property: "عقار آخر",
    price_on_request: "السعر عند الطلب",
    rate_on_request: "السعر عند الطلب",
    per_night: "لليلة",
    owner_vetted: "مالك موثق",
    views: "مشاهدة",
    bed: "غرفة نوم",
    bath: "حمام",
    everything: "الكل",
    sort: "ترتيب",
    newest_first: "الأحدث أولاً",
    price_low_high: "السعر من الأقل إلى الأعلى",
    price_high_low: "السعر من الأعلى إلى الأقل",
    property_type: "نوع العقار",
    bedrooms_minimum: "الحد الأدنى لغرف النوم",
    maximum_price: "السعر الأقصى",
    no_limit: "بلا حد",
    any: "الكل",
    clear_all: "مسح الكل",
    filters_on: "عوامل تصفية مفعلة",
    run_the_numbers: "احسب الأرقام",
    floor_area: "المساحة",
    repayments: "الأقساط",
    amount: "المبلغ",
    email_address: "البريد الإلكتروني",
    subscribe: "اشتراك",
    send: "إرسال",
    sending: "جاري الإرسال",
    nothing_found: "لا توجد نتائج مطابقة",
    registered_company: "شركة مسجلة",
    all_rights_reserved: "جميع الحقوق محفوظة",
  },
  zh: {
    buy: "购买",
    sell: "出售",
    stay: "短租",
    world_of_kaara: "卡拉世界",
    market_insights: "市场洞察",
    contact: "联系我们",
    all_properties: "全部房产",
    search: "搜索",
    menu: "菜单",
    close: "关闭",
    currency: "货币",
    language: "语言",
    properties: "房产",
    property: "房产",
    listings: "房源",
    view_listing: "查看房源",
    view_all_properties: "查看全部房产",
    see_more: "查看更多",
    more_properties: "更多房产",
    more_property: "更多房产",
    price_on_request: "价格面议",
    rate_on_request: "价格面议",
    per_night: "每晚",
    owner_vetted: "业主已核实",
    views: "次浏览",
    bed: "卧室",
    bath: "卫浴",
    everything: "全部",
    sort: "排序",
    newest_first: "最新优先",
    price_low_high: "价格由低到高",
    price_high_low: "价格由高到低",
    property_type: "房产类型",
    bedrooms_minimum: "最少卧室数",
    maximum_price: "最高价格",
    no_limit: "不限",
    any: "不限",
    clear_all: "清除全部",
    filters_on: "个筛选条件",
    run_the_numbers: "核算数字",
    floor_area: "建筑面积",
    repayments: "还款",
    amount: "金额",
    email_address: "电子邮箱",
    subscribe: "订阅",
    send: "发送",
    sending: "发送中",
    nothing_found: "没有符合条件的房源",
    registered_company: "注册公司",
    all_rights_reserved: "版权所有",
  },
};

const STORAGE_KEY = "kaara_language";
const DEFAULT_LANGUAGE: Language = "en";

/**
 * The saved language lives in localStorage, outside React. Reading it through
 * an external store keeps the server render and the first client render
 * identical, which is the same approach the currency provider takes.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): Language {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved && LANGUAGES.some((l) => l.code === saved) ? (saved as Language) : DEFAULT_LANGUAGE;
}

function getServerSnapshot(): Language {
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isRtl = language === "ar";
  const locale = LANGUAGES.find((l) => l.code === language)?.locale || "en-KE";

  const setLanguage = useCallback((next: Language) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    listeners.forEach((listener) => listener());
  }, []);

  // The direction and lang attributes belong on <html>, not on a wrapper div:
  // that is what screen readers, search engines and the browser's own text
  // handling read, and it lets `rtl:` styles work anywhere on the page.
  React.useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [language, isRtl]);

  const t = useCallback(
    (key: string) => DICTIONARY[language][key] ?? DICTIONARY.en[key] ?? key,
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, locale, isRtl }}>
      {children}
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
