"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronRight, Search as SearchIcon } from "lucide-react";
import { client } from "@/sanity/lib/client";
import { SEARCH_QUERY } from "@/sanity/lib/queries";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface DistrictData {
  _id: string;
  name: string;
  slug: string;
  properties: {
    _id: string;
    title: string;
    slug: string;
    imageUrl: string;
  }[];
}

export default function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [data, setData] = useState<DistrictData[]>([]);
  const [activeDistrictIdx, setActiveDistrictIdx] = useState(0);
  const [activePropertyIdx, setActivePropertyIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      client.fetch(SEARCH_QUERY).then(setData);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeDistrict = data[activeDistrictIdx];
  const activeProperty = activeDistrict?.properties[activePropertyIdx];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 lg:p-0">
      {/* Simple Dark Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-500" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl bg-[#000B1D]/95 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/5">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-50"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          {/* Left: Districts */}
          <div className="lg:col-span-4 border-r border-white/5 p-8 lg:p-12 space-y-8">
             <div className="space-y-2">
                <h3 className="text-[10px] font-bold tracking-[0.4em] text-white/30 uppercase">{t('discover')} DISTRICTS</h3>
                <div className="h-px w-8 bg-[#007EA7]" />
             </div>
             
             <div className="space-y-4">
                {data.map((district, idx) => (
                   <button
                     key={district._id}
                     onMouseEnter={() => { setActiveDistrictIdx(idx); setActivePropertyIdx(0); }}
                     className={cn(
                       "w-full flex items-center justify-between text-left group transition-all",
                       activeDistrictIdx === idx ? "text-white" : "text-white/40 hover:text-white/60"
                     )}
                   >
                      <span className="text-sm font-serif uppercase tracking-widest">{district.name}</span>
                      <ChevronRight size={14} className={cn("transition-transform", activeDistrictIdx === idx ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:opacity-100")} />
                   </button>
                ))}
             </div>

             <div className="pt-8 border-t border-white/5">
                <Link 
                  href="/properties" 
                  onClick={onClose}
                  className="text-[9px] font-bold tracking-[0.3em] text-[#007EA7] uppercase hover:underline"
                >
                  VIEW ALL {t('properties')}
                </Link>
             </div>
          </div>

          {/* Middle: Property Names */}
          <div className="lg:col-span-4 border-r border-white/5 p-8 lg:p-12 space-y-8 bg-black/20">
             <div className="space-y-2">
                <h3 className="text-[10px] font-bold tracking-[0.4em] text-white/30 uppercase">PREMIER ASSETS</h3>
                <p className="text-[8px] text-white/20 uppercase tracking-widest">{activeDistrict?.name}</p>
             </div>

             <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                {activeDistrict?.properties.map((property, idx) => (
                   <Link
                     key={property._id}
                     href={`/properties/${property.slug}`}
                     onClick={onClose}
                     onMouseEnter={() => setActivePropertyIdx(idx)}
                     className={cn(
                       "block text-left transition-all",
                       activePropertyIdx === idx ? "text-white" : "text-white/40 hover:text-white/60"
                     )}
                   >
                      <span className="text-xs font-bold uppercase tracking-widest">{property.title}</span>
                   </Link>
                ))}
                
                {activeDistrict && (
                  <Link 
                    href={`/properties?search=${activeDistrict.name}`}
                    onClick={onClose}
                    className="block pt-4 text-[9px] font-bold tracking-[0.3em] text-[#007EA7] uppercase hover:underline"
                  >
                    ALL {activeDistrict.name} LISTINGS
                  </Link>
                )}
             </div>
          </div>

          {/* Right: Property Photo */}
          <div className="lg:col-span-4 relative group overflow-hidden">
             {activeProperty ? (
               <>
                 <Image 
                   src={activeProperty.imageUrl} 
                   alt={activeProperty.title} 
                   fill 
                   className="object-cover transition-transform duration-1000 group-hover:scale-110"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#000B1D] via-transparent to-transparent opacity-60" />
                 <div className="absolute bottom-8 left-8 right-8 space-y-2">
                    <p className="text-[8px] font-bold tracking-[0.4em] text-white/60 uppercase">FEATURED RESIDENCE</p>
                    <h4 className="text-xl font-serif text-white uppercase tracking-tight">{activeProperty.title}</h4>
                 </div>
               </>
             ) : (
               <div className="w-full h-full bg-[#000B1D] flex items-center justify-center">
                  <SearchIcon size={48} className="text-white/5" />
               </div>
             )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        * { border-radius: 0 !important; }
      `}</style>
    </div>
  );
}
