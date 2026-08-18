"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ChevronDown, User, Heart, Settings, Menu, ArrowRight, Play, Pause, X as CloseIcon, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import SearchOverlay from "@/components/SearchOverlay";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface VideoSource {
  title?: string;
  subtitle?: string;
  type?: 'file' | 'url';
  videoUrl?: string;
  fileUrl?: string;
}

interface PropertyFilter {
  _key?: string;
  label?: string;
  mode?: 'types' | 'all' | 'maxPrice';
  propertyTypes?: string[];
  maxPrice?: number;
}

interface FeaturedProperty {
  _id: string;
  title?: string;
  slug?: string;
  buildingName?: string;
  price?: { amount?: string; currency?: string };
  imageUrl?: string;
  county?: string;
  district?: string;
  location?: string;
  details?: string;
  propertyType?: string[];
  listingType?: string;
}

interface HomeClientProps {
  data: {
    heroVideo?: VideoSource;
    secondaryVideo?: VideoSource;
    propertiesSection?: {
      title?: string;
      subtitle?: string;
      ctaLabel?: string;
      filters?: PropertyFilter[];
      featuredProperties?: FeaturedProperty[];
    };
    experienceVideo?: VideoSource;
    closingVideo?: VideoSource;
  };
  settings?: {
    general?: any;
    brand?: any;
    contact?: any;
    socials?: any;
  };
}

import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

/* Chips are content now, so they need a stable identity that survives an
   editor renaming one in the Studio. */
const filterKey = (filter: PropertyFilter, index?: number) =>
  filter._key || `${filter.label ?? "filter"}-${index ?? 0}`;

const priceToNumber = (price?: { amount?: string }) =>
  parseInt(String(price?.amount ?? "").replace(/[^0-9]/g, ""), 10) || 0;

const propertyPlace = (property: FeaturedProperty) =>
  property.location ||
  [property.district, property.county].filter(Boolean).join(", ") ||
  property.details ||
  "Nairobi";

const matchesFilter = (property: FeaturedProperty, filter?: PropertyFilter) => {
  if (!filter || filter.mode === "all") return true;
  if (filter.mode === "maxPrice") {
    const ceiling = filter.maxPrice ?? 0;
    if (!ceiling) return true;
    const amount = priceToNumber(property.price);
    return amount > 0 && amount < ceiling;
  }
  const wanted = filter.propertyTypes || [];
  if (wanted.length === 0) return true;
  const types = property.propertyType || [];
  return types.some((type) => wanted.includes(type));
};

export default function HomeClient({ data, settings }: HomeClientProps) {
  const { t } = useLanguage();
  // The home page grid quotes prices in whatever currency is selected in the
  // navigation, same as every other price on the site.
  const { formatPrice } = useCurrency();

  const formatListingPrice = (property: FeaturedProperty) => {
    const amount = property.price?.amount;
    if (!amount) return t("price_on_request");
    return formatPrice(amount, property.price?.currency || "KES");
  };
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const filters: PropertyFilter[] = (data?.propertiesSection?.filters || []).map((f, i) => ({
    ...f,
    _key: filterKey(f, i),
  }));
  const featured: FeaturedProperty[] = data?.propertiesSection?.featuredProperties || [];
  const [activeFilter, setActiveFilter] = useState(filters[0]?._key || "");
  const selectedFilter = filters.find((f) => f._key === activeFilter) || filters[0];
  const visibleProperties = featured.filter((property) => matchesFilter(property, selectedFilter));

  // Four tiles is the width of the row. Past that, the fourth tile becomes a
  // bento box: the fourth property stacked over a link to the rest, so the row
  // stays one clean line instead of wrapping into a ragged second one.
  const isOverflowing = visibleProperties.length > 4;
  const fullTiles = isOverflowing ? visibleProperties.slice(0, 3) : visibleProperties.slice(0, 4);
  const bentoProperty = isOverflowing ? visibleProperties[3] : undefined;
  const remainingCount = isOverflowing ? visibleProperties.length - 4 : 0;
  
  // Pause video when search is open
  useEffect(() => {
    if (isSearchOpen) {
      videoRefs.current.forEach(v => v?.pause());
    } else if (isPlaying) {
      videoRefs.current.forEach(v => v?.play());
    }
  }, [isSearchOpen, isPlaying]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: "", 
    type: 'success' 
  });
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    videoRefs.current.forEach((video) => {
      if (video) {
        if (newState) {
          video.play();
        } else {
          video.pause();
        }
      }
    });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      if (response.ok) {
        setToast({ show: true, message: "Welcome to the Collective", type: 'success' });
        setNewsletterEmail("");
      } else {
        const errorData = await response.json();
        setToast({ show: true, message: errorData.error || "Submission failed", type: 'error' });
      }
      
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    } catch (error) {
      setToast({ show: true, message: "Network error. Please try again.", type: 'error' });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVideoSrc = (source?: VideoSource, fallback?: string) => {
    if (!source) return fallback;
    if (source.type === 'url') return source.videoUrl || fallback;
    return source.fileUrl || fallback;
  };

  const vHero = getVideoSrc(data?.heroVideo, "/videos/amethyst.mp4");
  const vSecondary = getVideoSrc(data?.secondaryVideo, "https://res.cloudinary.com/dk92v0fkk/video/upload/w_1870,h_947,c_fill/v1724088268/staging/yv4bjz9n4wggkcgxvgqt.mp4#t=0.1");
  const vTertiary = getVideoSrc(data?.experienceVideo, "https://res.cloudinary.com/dk92v0fkk/video/upload/w_1870,h_947,c_fill/v1773870636/production/inrthpxt4vwiblfpko8j.mp4#t=0.1");
  const vQuaternary = getVideoSrc(data?.closingVideo, "https://res.cloudinary.com/dk92v0fkk/video/upload/w_1870,h_947,c_fill/v1724088268/staging/yv4bjz9n4wggkcgxvgqt.mp4#t=0.1");

  const SectionBottomNav = () => (
    <div className="absolute bottom-0 w-full z-50 px-6 py-8 lg:px-12 lg:py-12 flex justify-between items-center text-[9px] lg:text-[10px] font-sans tracking-[0.3em] text-white font-bold uppercase">
      <div className="flex items-center space-x-8 lg:space-x-12">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="hover:text-white/60 transition-colors"
        >
          <Search size={18} />
        </button>
        <Link href="/buy" className="hover:text-white/60 transition-colors hidden sm:block">BUY</Link>
        <Link href="/sell" className="hover:text-white/60 transition-colors hidden sm:block">SELL</Link>
        <Link href="/stay" className="hover:text-white/60 transition-colors hidden sm:block">STAY</Link>
      </div>

      <div className="hidden lg:flex items-center space-x-12">
        <Link href="/market-insights" className="hover:text-white/60 transition-colors">MARKET INSIGHTS</Link>
        <Link href="/world-of-kaara" className="hover:text-white/60 transition-colors text-[#E5E5E5]">WORLD OF KAARA</Link>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#100b28]">
      <Navbar settings={settings} transparent />
      {/* Custom Toast Notification */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[500] transition-all duration-700 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className="bg-white text-[#100B28] px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-xl">
          {toast.type === 'success' ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <AlertCircle size={20} className="text-red-600" />
          )}
          <span className="text-[11px] font-sans tracking-[0.2em] font-bold uppercase">{toast.message}</span>
        </div>
      </div>

      {/* Fixed Play/Pause Toggle */}
      <div className="fixed top-6 right-6 lg:top-8 lg:right-8 z-[120]">
        <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-all border border-white/40 rounded-full p-2 lg:p-2.5 flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-[#100B28]/40 backdrop-blur-md shadow-lg group">
          {isPlaying ? <Pause size={14} fill="currentColor" className="lg:size-4" /> : <Play size={14} fill="currentColor" className="ml-1 lg:size-4" />}
        </button>
      </div>

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Hero Section (Section 1) */}
      <section className="relative h-screen w-full flex flex-col justify-center items-center text-center overflow-hidden">
        <video 
          ref={(el) => { videoRefs.current[0] = el; }}
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src={vHero} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#100B28]/30 z-10" />


        <div className="absolute top-28 lg:top-36 left-6 lg:left-16 z-20 text-left max-w-xl">
          <h1 className="text-xl lg:text-[1.75rem] font-serif text-white tracking-[0.15em] uppercase leading-tight mb-2">
            {data?.heroVideo?.title || "WHERE DO YOU WANT TO GO?"}
          </h1>
          <p className="text-[8px] lg:text-[0.6rem] font-sans tracking-[0.2em] text-white/70 font-light uppercase">
            {data?.heroVideo?.subtitle || "Leaders in Luxury Vertical Living • Nairobi"}
          </p>
        </div>
        
        <div className="relative z-20 flex flex-col items-center justify-center">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="group flex items-center gap-4 bg-transparent border border-white/50 px-10 py-4 lg:px-12 lg:py-5 text-[10px] lg:text-[11px] font-sans tracking-[0.3em] font-bold hover:bg-white hover:text-[#100B28] transition-all duration-500 text-white rounded-full uppercase shadow-2xl backdrop-blur-sm"
          >
            {t('search')}
            <ChevronDown className="group-hover:translate-y-1 transition-transform duration-500" size={14} />
          </button>
        </div>

        <SectionBottomNav />
      </section>

      {/* Video Section 2 */}
      <section className="relative h-screen w-full flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        <video 
          ref={(el) => { videoRefs.current[1] = el; }}
          autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src={vSecondary} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#100B28]/40 z-10" />
        
        <div className="absolute top-12 lg:top-24 left-6 lg:left-16 z-20 text-left">
           <h2 className="text-xl lg:text-[2.5rem] font-serif text-white tracking-[0.1em] lg:tracking-[0.2em] uppercase leading-tight">
             {data?.secondaryVideo?.title || "UNRIVALED EXCLUSIVITY"}
           </h2>
           {data?.secondaryVideo?.subtitle && (
             <p className="text-[8px] lg:text-sm tracking-[0.2em] lg:tracking-[0.3em] text-white/80 uppercase font-light mt-4">{data.secondaryVideo.subtitle}</p>
           )}
        </div>

        <SectionBottomNav />
      </section>

      {/* Property Showcase - copy, filter chips and the grid all come from Sanity */}
      <section className="pt-24 lg:pt-40 pb-24 lg:pb-32 px-4 lg:px-6 bg-[#100B28] text-white">
        <div className="max-w-[1400px] mx-auto flex flex-col items-center mb-16 lg:mb-24 text-center">
          <p className="font-sans text-[8px] lg:text-[11px] tracking-[0.4em] text-white/60 uppercase mb-4 lg:mb-6 font-bold">{data?.propertiesSection?.subtitle || "Local Experts, Global Reach"}</p>
          <h2 className="text-2xl lg:text-[2.75rem] font-serif tracking-[0.1em] lg:tracking-[0.2em] uppercase text-white mb-8 lg:mb-12">{data?.propertiesSection?.title || "The Next Move Is Yours"}</h2>

          <div className="w-[1px] h-12 lg:h-20 bg-white/20 mb-8 lg:mb-12"></div>

          {filters.length > 0 && (
            <div className="flex flex-wrap justify-center gap-6 lg:gap-16 text-[9px] lg:text-[11px] font-sans tracking-[0.2em] lg:tracking-[0.3em] uppercase text-white/50 font-bold mb-12 lg:mb-16">
              {filters.map((filter) => {
                const key = filterKey(filter);
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={`transition-all duration-300 ${activeFilter === key ? 'text-white border-b-[1.5px] border-white pb-1.5' : 'hover:text-white'}`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {visibleProperties.length > 0 ? (
          <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px] lg:gap-1">
            {fullTiles.map((property) => (
              <Link
                key={property._id}
                href={`/properties/${property.slug}`}
                className="group relative h-[500px] lg:h-[650px] w-full cursor-pointer overflow-hidden bg-[#100B28]"
              >
                <Image
                  src={property.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"}
                  alt={property.title || "Kaara listing"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#100B28]/95 via-[#100B28]/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12 text-center flex flex-col items-center z-10 transition-transform duration-700">
                  <h3 className="font-serif text-2xl lg:text-3xl mb-3 lg:mb-4 text-white tracking-[0.05em] uppercase">{property.title}</h3>
                  <p className="font-sans text-[8px] lg:text-[9px] tracking-[0.3em] lg:tracking-[0.4em] text-white/70 mb-2 lg:mb-3 uppercase font-bold">
                    {propertyPlace(property)}
                  </p>
                  <p className="font-serif text-[13px] lg:text-[15px] text-white italic">
                    {formatListingPrice(property)}
                  </p>
                </div>
              </Link>
            ))}

            {/* Bento cell: the fourth property above, the way through to the
                rest below. */}
            {bentoProperty && (
              <div className="flex h-[500px] lg:h-[650px] w-full flex-col gap-[2px] lg:gap-1">
                <Link
                  href={`/properties/${bentoProperty.slug}`}
                  className="group relative flex-[3] w-full cursor-pointer overflow-hidden bg-[#100B28]"
                >
                  <Image
                    src={bentoProperty.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"}
                    alt={bentoProperty.title || "Kaara listing"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#100B28]/95 via-[#100B28]/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 text-center flex flex-col items-center z-10">
                    <h3 className="font-serif text-xl lg:text-2xl mb-2 text-white tracking-[0.05em] uppercase">{bentoProperty.title}</h3>
                    <p className="font-sans text-[8px] tracking-[0.3em] text-white/70 mb-1.5 uppercase font-bold">
                      {propertyPlace(bentoProperty)}
                    </p>
                    <p className="font-serif text-[13px] text-white italic">
                      {formatListingPrice(bentoProperty)}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/properties"
                  className="group relative flex flex-[2] w-full flex-col items-center justify-center gap-3 overflow-hidden border border-white/10 bg-[#171232] px-6 text-center transition-colors duration-500 hover:bg-[#1d1740]"
                >
                  <span className="font-serif text-3xl lg:text-4xl text-white tabular-nums">
                    +{remainingCount}
                  </span>
                  <span className="font-sans text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
                    {remainingCount === 1 ? t("more_property") : t("more_properties")}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-2 font-sans text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.28em] text-[#4f9d8f]">
                    {t("see_more")}
                    <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-[900px] mx-auto border border-white/10 bg-[#171232] px-8 py-16 text-center">
            <h3 className="font-serif text-2xl text-[#efebe3]">Nothing in this category yet</h3>
            <p className="mx-auto mt-4 max-w-[52ch] text-sm leading-relaxed text-white/55">
              Pick another category above, or view every listing we have live right now.
            </p>
          </div>
        )}

        <div className="mt-12 lg:mt-20 flex justify-center">
           <Link href="/properties">
             <button className="bg-transparent border border-white/40 px-10 py-3.5 lg:px-12 lg:py-4 text-[9px] lg:text-[10px] tracking-[0.3em] lg:tracking-[0.4em] font-sans font-bold hover:bg-white hover:text-[#100B28] transition-all duration-500 rounded-full uppercase">
               {data?.propertiesSection?.ctaLabel || "View All Listings"}
             </button>
           </Link>
        </div>
      </section>

      {/* Video Section 3 */}
      <section className="relative h-screen w-full flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        <video 
          ref={(el) => { videoRefs.current[2] = el; }}
          autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src={vTertiary} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#100B28]/40 z-10" />
        
        <div className="absolute top-12 lg:top-24 left-6 lg:left-16 z-20 text-left">
            <h2 className="text-xl lg:text-[2.5rem] font-serif text-white tracking-[0.1em] lg:tracking-[0.2em] uppercase leading-tight">
              {data?.experienceVideo?.title || "LIVE THE EXTRAORDINARY"}
            </h2>
            {data?.experienceVideo?.subtitle && (
              <p className="text-[8px] lg:text-sm tracking-[0.2em] lg:tracking-[0.3em] text-white/80 uppercase font-light mt-4">{data.experienceVideo.subtitle}</p>
            )}
        </div>

        <SectionBottomNav />
      </section>

      {/* Video Section 4 */}
      <section className="relative h-screen w-full flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        <video 
          ref={(el) => { videoRefs.current[3] = el; }}
          autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src={vQuaternary} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#100B28]/40 z-10" />
        
        <div className="absolute top-12 lg:top-24 left-6 lg:left-16 z-20 text-left">
           <h2 className="text-xl lg:text-[2.5rem] font-serif text-white tracking-[0.1em] lg:tracking-[0.2em] mb-4 lg:mb-8 uppercase leading-tight">
             {data?.closingVideo?.title || "88 NAIROBI CONDOMINIUM"}
           </h2>
           <p className="text-[8px] lg:text-sm tracking-[0.2em] lg:tracking-[0.3em] text-white/80 uppercase font-light">
             {data?.closingVideo?.subtitle || "The Apex of Upper Hill • Handover May 2026"}
           </p>
        </div>

        <SectionBottomNav />
      </section>

      {/* World of Kaara */}
      <section className="relative py-32 lg:py-48 flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#100B28]/85 z-10" />
          <Image 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80"
            alt="Vertical Nairobi"
            fill
            sizes="100vw"
            className="object-cover filter grayscale"
          />
        </div>
        
        <div className="relative z-20 max-w-3xl">
          <h2 className="text-3xl lg:text-[3.5rem] font-serif text-white mb-8 lg:mb-10 uppercase tracking-[0.1em] lg:tracking-[0.2em] font-light">The World of KAARA</h2>
          <p className="text-sm lg:text-lg font-sans font-light text-white/70 mb-10 lg:mb-14 leading-relaxed uppercase tracking-[0.15em] lg:tracking-[0.25em]">
            Immersive market insights, architectural narratives, and the lifestyle of the Nairobi elite. 
          </p>
          
          <button className="bg-white text-[#100B28] px-10 py-4 lg:px-14 lg:py-5 text-[10px] lg:text-[11px] font-sans tracking-[0.3em] lg:tracking-[0.4em] font-bold hover:bg-transparent hover:text-white border border-white transition-all duration-500 uppercase rounded-full">
            EXPLORE THE EDITORIAL
          </button>
        </div>
      </section>

      <Footer settings={settings} />
    </main>
  );
}
