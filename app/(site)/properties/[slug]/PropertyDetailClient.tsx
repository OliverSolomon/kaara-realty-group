"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, 
  Share2, 
  Heart, 
  MapPin, 
  FileText, 
  Download, 
  ChevronRight,
  Play,
  ShieldCheck,
  Building2,
  Maximize,
  BedDouble,
  Bath,
  ArrowRight,
  ArrowUpRight,
  Printer,
  Calendar,
  Clock,
  Mail,
  Phone,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
  Copy,
  Info,
  UserCheck
} from "lucide-react";
import { PortableText } from "@portabletext/react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { extractCoordsFromGoogleMapsUrl, getCoordsBySearch } from "@/lib/geocoding";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useCurrency } from "@/context/CurrencyContext";
import { Modal } from "@/components/ui/modal";
import Footer from "@/components/Footer";

const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50 animate-pulse flex items-center justify-center text-gray-200 uppercase tracking-widest text-[10px]">LOADING MAP...</div>
});

interface PropertyDetailClientProps {
  property: any;
}

export default function PropertyDetailClient({ property }: PropertyDetailClientProps) {
  const [activeMediaIdx, setactiveMediaIdx] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const { formatPrice: globalFormatPrice } = useCurrency();
  const agencyEmail = property.siteSettings?.contact?.email || "kaara@kaararealtygroup.com";
  const contactPhone = property.siteSettings?.contact?.phone || "+254 700 000000";
  const contactAddress = property.siteSettings?.contact?.address || "Nairobi, Kenya";
  
  // Modal States
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [compareProperty, setCompareProperty] = useState<any>(null);
  
  // Form States
  const [selectedMethod, setSelectedMethod] = useState("Email");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Interaction States
  const [isLiked, setIsLiked] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
    const favorites = JSON.parse(localStorage.getItem("kaara_favorites") || "[]");
    setIsLiked(favorites.includes(property.slug));
  }, [property.slug]);

  const toggleLike = () => {
    const favorites = JSON.parse(localStorage.getItem("kaara_favorites") || "[]");
    let newFavorites;
    if (isLiked) {
      newFavorites = favorites.filter((s: string) => s !== property.slug);
      setShowToast("Removed from favorites");
    } else {
      newFavorites = [...favorites, property.slug];
      setShowToast("Added to favorites");
    }
    localStorage.setItem("kaara_favorites", JSON.stringify(newFavorites));
    setIsLiked(!isLiked);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: property.shortDescription,
          url: currentUrl,
        });
      } catch (err) {
        setIsShareModalOpen(true);
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const mediaItems = useMemo(() => {
    const items = property.media?.map((m: any) => ({
      ...m,
      type: m._type === "externalVideo" ? "video" : "image"
    })) || [];
    
    if (property.imageUrl && !items.some((m: any) => m.url === property.imageUrl)) {
      items.unshift({ url: property.imageUrl, type: "image" });
    }
    
    return items;
  }, [property.media, property.imageUrl]);

  const coords = useMemo(() => {
    let extracted = property.googleMapsUrl ? extractCoordsFromGoogleMapsUrl(property.googleMapsUrl) : null;
    if (!extracted) {
      extracted = getCoordsBySearch(property.title, property.district?.name, property.county);
    }
    return extracted;
  }, [property.googleMapsUrl, property.district, property.county]);

  const formatPrice = (price: any) => {
    if (!price) return "Price on Request";
    const amount = typeof price === 'object' ? price.amount : price;
    const currency = typeof price === 'object' ? price.currency : "USD";
    return globalFormatPrice(amount, currency);
  };

  // Map Data Preparation
  const mapProperties = useMemo(() => {
    const list = [];
    if (coords) {
      list.push({
        _id: property._id,
        title: property.title,
        price: formatPrice(property.price),
        coords: coords,
        imageUrl: property.imageUrl,
        district: property.district?.name
      });
    }
    return list;
  }, [property, coords, formatPrice]);

  return (
    <main className="min-h-screen bg-white text-[#000B1D] font-sans">
      <Navbar settings={property.siteSettings} />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[3000] bg-[#000B1D] text-white px-8 py-4 text-[10px] font-bold tracking-[0.3em] uppercase">
           {showToast}
        </div>
      )}

      {/* Web Layout */}
      <div className="print:hidden">
        {/* Breadcrumbs Top */}
        <div className="pt-[5.5rem] pb-3 lg:pb-5 px-6 lg:px-12 bg-white flex flex-wrap items-center justify-center gap-3 lg:gap-5 text-[8px] lg:text-[9px] font-bold tracking-[0.4em] text-gray-400 uppercase border-b border-gray-50">
           <Link href="/properties" className="hover:text-[#000B1D] transition-colors">ALL PROPERTIES</Link>
           <span>/</span>
           <Link href={`/properties?search=${property.district?.name}`} className="hover:text-[#000B1D] transition-colors">
              {property.district?.name}
           </Link>
           <span>/</span>
           <span className="text-[#000B1D]">{property.title}</span>
        </div>

        {/* Hero Gallery Section */}
        <section className="bg-white relative">
          <div className="relative h-[50vh] lg:h-[85vh] w-full bg-gray-50 overflow-hidden">
            {mediaItems.length > 0 ? (
              mediaItems[activeMediaIdx].type === "video" ? (
                <div className="w-full h-full flex items-center justify-center bg-[#000B1D]">
                  <a href={mediaItems[activeMediaIdx].url} target="_blank" className="px-10 py-4 border border-white text-white text-[10px] font-bold tracking-widest uppercase hover:bg-white hover:text-black">PLAY VIDEO</a>
                </div>
              ) : (
                <Image src={mediaItems[activeMediaIdx].url} alt={property.title} fill className="object-cover" priority />
              )
            ) : null}
            
            <div className="absolute bottom-6 right-6 lg:bottom-12 lg:right-12 flex gap-2">
              <button onClick={() => setactiveMediaIdx(prev => prev > 0 ? prev - 1 : mediaItems.length - 1)} className="w-10 h-10 lg:w-14 lg:h-14 bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setactiveMediaIdx(prev => prev < mediaItems.length - 1 ? prev + 1 : 0)} className="w-10 h-10 lg:w-14 lg:h-14 bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* Property Information Header */}
        <section className="py-12 lg:py-24 px-6 text-center max-w-5xl mx-auto border-b border-gray-100">
           <div className="space-y-4 lg:space-y-6 mb-10">
              <h1 className="text-3xl lg:text-5xl font-serif tracking-tight text-gray-900 uppercase leading-tight">{property.title}</h1>
              <p className="text-[10px] lg:text-[11px] tracking-[0.4em] text-gray-400 uppercase font-bold">
                {property.buildingName && `${property.buildingName}, `}{property.district?.name}, {property.county}
              </p>
           </div>
           
           <div className="h-px w-12 bg-gray-200 mx-auto mb-10" />

           <div className="space-y-3 mb-12">
              <p className="text-4xl lg:text-6xl font-serif text-gray-900 tracking-tighter">{formatPrice(property.price)}</p>
              <p className="text-[9px] font-bold tracking-[0.5em] text-gray-400 uppercase">OFFERED AT</p>
           </div>

           <div className="flex flex-wrap justify-center items-center gap-10 lg:gap-20 pt-8">
              {[
                { label: 'BEDROOMS', value: property.details?.split('|')[0] || '4 BR' },
                { label: 'BATHROOMS', value: property.details?.split('|')[1] || '3.5 BA' },
                { label: 'APPROX. SF', value: '4,250' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-1 lg:gap-2">
                   <p className="text-xl lg:text-2xl font-serif text-gray-900">{stat.value}</p>
                   <p className="text-[8px] lg:text-[10px] font-bold tracking-[0.4em] text-gray-400 uppercase">{stat.label}</p>
                </div>
              ))}
           </div>
        </section>

        {/* Detail Content Section */}
        <section className="py-12 lg:py-24 px-6 lg:px-20 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
           <div className="lg:col-span-8 space-y-16">
              {/* Narrative */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="h-px w-10 bg-[#007EA7]" />
                    <h2 className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#007EA7]">The Property</h2>
                 </div>
                 <p className="text-xl lg:text-2xl font-light font-serif italic text-gray-700 leading-relaxed">
                   {property.shortDescription || "A residence of unparalleled distinction and architectural purity."}
                 </p>
                 <div className="prose prose-lg max-w-none text-gray-500 font-light leading-relaxed">
                    {property.longDescription ? <PortableText value={property.longDescription} /> : <p>Detailed architectural specs available on request.</p>}
                 </div>
              </div>

              {/* Compliance documents */}
              <div className="bg-gray-50 p-8 lg:p-12 space-y-10 border border-gray-100">
                 <div className="space-y-2">
                    <h3 className="text-xl lg:text-2xl font-serif uppercase tracking-tight">Compliance & Verification</h3>
                    <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Verified Asset Dossier</p>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
                    {property.verificationDocuments?.map((doc: any, i: number) => (
                      <div key={i} className="bg-white p-6 flex items-center justify-between group hover:bg-gray-50 transition-all cursor-pointer">
                         <div className="flex items-center gap-4">
                            <FileText className="text-[#007EA7]" size={20} />
                            <span className="text-[9px] font-bold tracking-widest uppercase">{doc.originalFilename}</span>
                         </div>
                         <Download size={16} className="text-gray-300 group-hover:text-black transition-all" />
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Sticky Consultation Sidebar */}
           <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-10">
              <div className="border border-gray-200 p-8 lg:p-10 space-y-10">
                 <div className="space-y-4">
                    <p className="text-[10px] font-bold tracking-[0.5em] text-gray-400 uppercase">Consultation</p>
                    <p className="text-sm text-gray-500 font-light leading-relaxed">Schedule a private showing or request detailed analysis for this property.</p>
                 </div>
                 <div className="space-y-4">
                    <button onClick={() => setIsScheduleModalOpen(true)} className="w-full h-14 bg-[#007EA7] text-white text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-black transition-all">SCHEDULE SHOWING</button>
                    <button onClick={() => setIsInterestModalOpen(true)} className="w-full h-14 border border-black text-black text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-black hover:text-white transition-all">INQUIRE</button>
                 </div>
                 <div className="pt-8 border-t border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-serif text-lg">K</div>
                    <div>
                       <p className="text-[10px] font-bold tracking-widest uppercase">Kaara Realty Group</p>
                       <p className="text-[8px] text-gray-400 tracking-[0.2em] uppercase font-bold">Exclusive Listing Agent</p>
                    </div>
                 </div>
              </div>

              <div className="flex justify-center gap-10 text-gray-400">
                 <button onClick={handleShare} className="flex flex-col items-center gap-2 hover:text-black transition-colors">
                    <Share2 size={18} /><span className="text-[8px] font-bold uppercase tracking-widest">Share</span>
                 </button>
                 <button onClick={handlePrint} className="flex flex-col items-center gap-2 hover:text-black transition-colors">
                    <Printer size={18} /><span className="text-[8px] font-bold uppercase tracking-widest">Print</span>
                 </button>
                 <button onClick={toggleLike} className={cn("flex flex-col items-center gap-2 transition-colors", isLiked ? "text-red-500" : "hover:text-black")}>
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} /><span className="text-[8px] font-bold uppercase tracking-widest">{isLiked ? 'Saved' : 'Save'}</span>
                 </button>
              </div>
           </div>
        </section>

        {/* Similar Listings Gallery */}
        <section className="py-24 bg-gray-50 px-6 lg:px-20 border-t border-gray-100">
           <div className="text-center space-y-3 mb-16">
              <h2 className="text-2xl lg:text-4xl font-serif uppercase tracking-tight">Explore More Listings</h2>
              <p className="text-[10px] font-bold tracking-[0.4em] text-gray-400 uppercase">Curated Portfolio</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 max-w-[1700px] mx-auto">
              {property.similarProperties?.map((p: any) => (
                <Link key={p._id} href={`/properties/${p.slug}`} className="group bg-white border border-gray-200 block transition-transform duration-500">
                   <div className="relative aspect-[4/3] overflow-hidden">
                      <Image src={p.imageUrl} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                      <div className="absolute top-0 left-0 bg-black text-white px-3 py-1.5 text-[8px] font-bold tracking-widest uppercase">EXCLUSIVE</div>
                   </div>
                   <div className="p-8 space-y-6">
                      <div>
                         <p className="text-2xl font-serif text-gray-900 mb-2">{formatPrice(p.price)}</p>
                         <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase line-clamp-1">{p.title}</h3>
                      </div>
                      <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                         <span>{p.details?.split('|')[0] || '4 BR'}</span>
                         <span>{p.details?.split('|')[1] || '3 BA'}</span>
                         <span>4,250 SF</span>
                      </div>
                   </div>
                </Link>
              ))}
           </div>
        </section>
      </div>

      <Footer settings={property.siteSettings} />

      <style jsx global>{`
        * { border-radius: 0 !important; }
        .prose p { margin-bottom: 1.5em; }
      `}</style>
    </main>
  );
}
