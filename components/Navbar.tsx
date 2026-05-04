"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Globe, ChevronDown, Settings, X, Menu, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import SearchOverlay from "./SearchOverlay";

interface NavbarProps {
  settings?: {
    general?: any;
    brand?: any;
    contact?: any;
    socials?: any;
  };
}

export default function Navbar({ settings }: NavbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage, t } = useLanguage();

  // Initialize from Sanity settings if not in localStorage
  useEffect(() => {
    if (settings?.general?.defaultCurrency && !localStorage.getItem("kaara_currency")) {
      setCurrency(settings.general.defaultCurrency);
    }
    if (settings?.general?.defaultLanguage && !localStorage.getItem("kaara_language")) {
      setLanguage(settings.general.defaultLanguage);
    }
  }, [settings, setCurrency, setLanguage]);

  return (
    <>
      <nav className="fixed top-0 w-full z-[1000] bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 -ml-2 hover:bg-gray-50 transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-12">
          <Link href="/" className="text-sm lg:text-base font-serif tracking-[0.3em] uppercase whitespace-nowrap">
            {settings?.general?.siteName || "KAARA REALTY GROUP"}
          </Link>
          
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/properties" className="text-[10px] font-bold tracking-[0.2em] uppercase hover:text-gray-500 transition-colors">{t('properties')}</Link>
            <Link href="#" className="text-[10px] font-bold tracking-[0.2em] uppercase hover:text-gray-500 transition-colors">BLOGS</Link>
            <Link href="#" className="text-[10px] font-bold tracking-[0.2em] uppercase hover:text-gray-500 transition-colors">WORLD OF KAARA</Link>
          </div>
        </div>

        {/* Start Your Search Button (Premium Style) */}
        <div className="hidden xl:flex absolute left-1/2 -translate-x-1/2">
           <button 
             onClick={() => setIsSearchOpen(true)}
             className="px-8 py-2.5 border border-[#100B28]/10 text-[9px] font-bold tracking-[0.3em] uppercase hover:bg-[#100B28] hover:text-white transition-all flex items-center gap-3 group"
           >
             START YOUR SEARCH
             <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
           </button>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase hover:text-gray-500"
          >
            <SearchIcon size={18} className="lg:size-[16px]" />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase hover:text-gray-500 relative"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">SETTINGS</span>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[2000] bg-white animate-in slide-in-from-left duration-500">
             <div className="p-8 space-y-12">
                <div className="flex justify-between items-center">
                   <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-serif tracking-[0.3em] uppercase">KAARA</Link>
                   <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
                </div>

                <div className="flex flex-col gap-8">
                   <Link href="/properties" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-serif uppercase tracking-tight">Properties</Link>
                   <Link href="#" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-serif uppercase tracking-tight">Blogs</Link>
                   <Link href="#" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-serif uppercase tracking-tight">World of Kaara</Link>
                </div>

                <div className="pt-12 border-t border-gray-100">
                   <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-6">Connect with us</p>
                   <div className="grid grid-cols-2 gap-4">
                      <button className="h-14 border border-gray-100 text-[10px] font-bold tracking-[0.3em] uppercase">EMAIL</button>
                      <button className="h-14 border border-gray-100 text-[10px] font-bold tracking-[0.3em] uppercase">WHATSAPP</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Settings Dropdown */}
        {isSettingsOpen && (
          <div className="absolute top-24 right-6 lg:right-12 w-[calc(100vw-3rem)] sm:w-80 bg-white shadow-2xl border border-gray-100 p-8 z-[1100] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-bold tracking-[0.3em] uppercase">GLOBAL SETTINGS</h3>
              <button onClick={() => setIsSettingsOpen(false)}><X size={18} className="text-gray-400" /></button>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">LANGUAGES</label>
                <div className="relative">
                  <select 
                    className="w-full h-12 bg-gray-50 border border-gray-100 px-4 text-xs font-medium appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-[#100B28]/10"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                  >
                    <option value="en">English (ENG)</option>
                    <option value="ar">Arabic (عربي)</option>
                    <option value="zh">Chinese (中文)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">CURRENCY</label>
                <div className="relative">
                  <select 
                    className="w-full h-12 bg-gray-50 border border-gray-100 px-4 text-xs font-medium appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-[#100B28]/10"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                  >
                    <option value="USD">United States Dollar (USD)</option>
                    <option value="KSH">Kenyan Shilling (KSH)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Globe size={16} className="text-gray-400" />
                 <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">GLOBAL SITE</span>
               </div>
               <button className="text-[9px] font-bold tracking-widest uppercase text-[#007EA7] hover:underline">VISIT SITE</button>
            </div>
          </div>
        )}
      </nav>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
