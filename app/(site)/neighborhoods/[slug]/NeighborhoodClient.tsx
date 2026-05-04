"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, 
  School, 
  ShoppingBag, 
  Trees, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight
} from "lucide-react";
import { PortableText } from "@portabletext/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const PropertyMap = dynamic(() => import("@/components/PropertyMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50 animate-pulse flex items-center justify-center text-gray-200 uppercase tracking-widest text-[10px]">LOADING MAP...</div>
});

import { useLanguage } from "@/context/LanguageContext";

interface NeighborhoodClientProps {
  neighborhood: any;
  settings?: {
    general?: any;
    brand?: any;
    contact?: any;
    socials?: any;
  };
}

export default function NeighborhoodClient({ neighborhood, settings }: NeighborhoodClientProps) {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-white text-[#100B28] font-sans">
      <Navbar settings={settings} />

      {/* Hero Section - Responsive Typography */}
      <section className="relative h-[60vh] lg:h-[80vh] w-full flex flex-col justify-center items-center text-center overflow-hidden pt-20">
        {neighborhood.mainImage ? (
          <Image 
            src={neighborhood.mainImage} 
            alt={neighborhood.name} 
            fill 
            className="object-cover brightness-[0.6]" 
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[#000B1D]" />
        )}
        <div className="relative z-10 text-white px-6 space-y-4 lg:space-y-6">
          <p className="text-[10px] lg:text-[11px] tracking-[0.5em] font-bold uppercase opacity-80">DISTRICT GUIDE</p>
          <h1 className="text-4xl lg:text-8xl font-serif tracking-tight uppercase leading-tight">{neighborhood.name}</h1>
        </div>
      </section>

      {/* Sticky Tab Navigation */}
      <nav className="sticky top-20 z-50 bg-white border-b border-gray-100 h-16 flex items-center justify-center gap-6 lg:gap-12 text-[9px] lg:text-[10px] font-bold tracking-[0.3em] uppercase">
        <button className="border-b-2 border-black h-full px-2">OVERVIEW</button>
        <button className="text-gray-400 hover:text-black h-full px-2">LOCAL ASSETS</button>
        <button className="text-gray-400 hover:text-black h-full px-2">{t('discover')} MAP</button>
      </nav>

      {/* Narrative Section */}
      <section className="py-16 lg:py-32 px-6 lg:px-12 max-w-5xl mx-auto text-center space-y-12 lg:space-y-20">
        <div className="space-y-8">
           <div className="h-px w-12 bg-gray-200 mx-auto" />
           <div className="prose prose-xl lg:prose-2xl max-w-none text-gray-800 font-serif italic leading-relaxed">
             <PortableText value={neighborhood.description} />
           </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Link href={`/properties?search=${neighborhood.name}`}>
            <Button className="w-full h-14 bg-black text-white text-[10px] tracking-widest uppercase">VIEW LISTINGS FOR SALE</Button>
          </Link>
          <Link href={`/properties?search=${neighborhood.name}`}>
            <Button variant="outline" className="w-full h-14 border-gray-200 text-[10px] tracking-widest uppercase">VIEW LISTINGS FOR RENT</Button>
          </Link>
        </div>
      </section>

      {/* Signature Elements */}
      <section className="py-24 lg:py-32 bg-gray-50 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-16 lg:space-y-24">
           <div className="text-center space-y-4">
              <h2 className="text-3xl lg:text-5xl font-serif tracking-tight uppercase leading-tight">CHRACTERISTICS OF {neighborhood.name}</h2>
              <p className="text-[10px] tracking-[0.4em] text-gray-400 uppercase font-bold">Why we represent this district</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {neighborhood.amenities?.map((item: string, idx: number) => (
                <div key={idx} className="bg-white p-10 border border-gray-100 flex flex-col items-center text-center space-y-6 hover:shadow-xl transition-all">
                   <div className="w-12 h-12 bg-[#007EA7] flex items-center justify-center text-white">
                      <Trees size={24} />
                   </div>
                   <p className="text-[11px] font-bold tracking-[0.2em] uppercase leading-relaxed text-gray-700">{item}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* District Spotlight - Responsive Grid */}
      <section className="py-24 lg:py-40 px-6 lg:px-12">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">
           <div className="relative aspect-square lg:aspect-[4/5] overflow-hidden group">
              {neighborhood.photos?.[0] ? (
                <Image src={neighborhood.photos[0]} alt="District Spotlight" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full bg-gray-100" />
              )}
           </div>

           <div className="space-y-12 lg:space-y-20">
              <div className="space-y-6">
                 <h3 className="text-4xl lg:text-6xl font-serif tracking-tight uppercase leading-tight">{neighborhood.name} Culture</h3>
                 <div className="h-px w-20 bg-black" />
                 <p className="text-lg lg:text-xl text-gray-500 font-light leading-relaxed">
                   Discover the unique urban pulse of {neighborhood.name}, a district defined by its architectural ambition and curated lifestyle offerings.
                 </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 lg:gap-16 pt-12 border-t border-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-gray-400">
                    <School size={22} className="text-[#007EA7]" />
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase">EDUCATIONAL INSTITUTIONS</span>
                  </div>
                  <ul className="space-y-4">
                    {neighborhood.schools?.map((s: string) => (
                      <li key={s} className="text-[11px] font-bold tracking-widest uppercase border-b border-gray-50 pb-3">{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-gray-400">
                    <ShoppingBag size={22} className="text-[#007EA7]" />
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase">MALLS & DINING</span>
                  </div>
                  <ul className="space-y-4">
                    {neighborhood.malls?.map((m: string) => (
                      <li key={m} className="text-[11px] font-bold tracking-widest uppercase border-b border-gray-50 pb-3">{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-10">
                 <button className="flex items-center gap-4 group">
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase border-b border-black pb-1">Request Private Briefing</span>
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                 </button>
              </div>
           </div>
        </div>
      </section>

      {/* Discovery Map Snapshot */}
      <section className="h-[500px] lg:h-[800px] w-full border-t border-gray-100 relative">
        <PropertyMap properties={[]} zoom={14} />
        <div className="absolute top-10 left-10 z-10 bg-white p-8 border border-gray-100 shadow-2xl hidden lg:block max-w-xs">
           <h4 className="text-xl font-serif uppercase tracking-tight mb-4">{neighborhood.name} Discovery</h4>
           <p className="text-[10px] text-gray-500 tracking-widest leading-relaxed uppercase mb-6">Interactive geocoding of premium assets and district amenities.</p>
           <button className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#007EA7] hover:underline">EXPLORE FULL MAP</button>
        </div>
      </section>

      <Footer settings={settings} />

      <style jsx global>{`
        * { border-radius: 0 !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );
}
