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

interface HomeClientProps {
  data: {
    heroVideo?: VideoSource;
    secondaryVideo?: VideoSource;
    propertiesSection?: {
      title?: string;
      subtitle?: string;
      featuredProperties?: any[];
    };
    experienceVideo?: VideoSource;
    spotlightSection?: {
      title?: string;
      featuredEvent?: {
        title: string;
        description: string;
        location: string;
        date: string;
        imageUrl: string;
        media: any[];
      };
    };
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

export default function HomeClient({ data, settings }: HomeClientProps) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("CITY SKYLINES");
  
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

      {/* Property Showcase */}
      <section className="pt-24 lg:pt-40 pb-24 lg:pb-32 px-4 lg:px-6 bg-[#100B28] text-white">
        <div className="max-w-[1400px] mx-auto flex flex-col items-center mb-16 lg:mb-24 text-center">
          <p className="font-sans text-[8px] lg:text-[11px] tracking-[0.4em] text-white/60 uppercase mb-4 lg:mb-6 font-bold">{data?.propertiesSection?.subtitle || "Local Experts, Global Reach"}</p>
          <h2 className="text-2xl lg:text-[2.75rem] font-serif tracking-[0.1em] lg:tracking-[0.2em] uppercase text-white mb-8 lg:mb-12">{data?.propertiesSection?.title || "The Next Move Is Yours"}</h2>
          
          <div className="w-[1px] h-12 lg:h-20 bg-white/20 mb-8 lg:mb-12"></div>
          
          <div className="flex flex-wrap justify-center gap-6 lg:gap-16 text-[9px] lg:text-[11px] font-sans tracking-[0.2em] lg:tracking-[0.3em] uppercase text-white/50 font-bold mb-12 lg:mb-16">
            {["CITY SKYLINES", "WATER VIEWS", "FARM & RANCH", "JUST LISTED", "UNDER $20 MILLION"].map((filter) => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`transition-all duration-300 ${activeFilter === filter ? 'text-white border-b-[1.5px] border-white pb-1.5' : 'hover:text-white'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px] lg:gap-1">
          {(data?.propertiesSection?.featuredProperties?.length ? data.propertiesSection.featuredProperties : [
            {
              _id: "fallback-1",
              title: "THE AMETHYST",
              details: "WESTLANDS • EXCLUSIVE PENTHOUSE",
              price: "KSh 520,000,000",
              imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
              propertyType: "penthouse"
            },
            {
              _id: "fallback-2",
              title: "SYMPHONY RESIDENCE",
              details: "3 BR | 4 BA, 1 HALF BA",
              price: "KSh 135,000,000",
              imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
              propertyType: "apartment"
            },
            {
              _id: "fallback-3",
              title: "37BYINEZA",
              details: "3 BR | 2 BA, 1 HALF BA",
              price: "KSh 85,000,000",
              imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
              propertyType: "apartment"
            },
            {
              _id: "fallback-4",
              title: "THE DIPLOMAT",
              details: "2 BR | 7 BA, 4 HALF BA",
              price: "KSh 370,000,000",
              imageUrl: "https://images.unsplash.com/photo-1600607687940-c52af096999c?auto=format&fit=crop&w=1200&q=80",
              propertyType: "apartment"
            }
          ])
            .filter((p: any) => {
              const types = Array.isArray(p.propertyType) ? p.propertyType : [p.propertyType].filter(Boolean);
              const amount = typeof p.price === 'object' ? parseInt(p.price.amount?.replace(/[^0-9]/g, '') || "0") : parseInt(p.price?.replace(/[^0-9]/g, '') || "0");

              if (activeFilter === "CITY SKYLINES") return types.includes('penthouse') || types.includes('apartment') || types.length === 0;
              if (activeFilter === "WATER VIEWS") return types.includes('villa') || types.includes('townhouse');
              if (activeFilter === "FARM & RANCH") return types.includes('land') || types.includes('ranch') || types.includes('farm');
              if (activeFilter === "JUST LISTED") return true;
              if (activeFilter === "UNDER $20 MILLION") {
                return amount < 20000000;
              }
              return true;
            })
            .map((property: any) => (
            <Link 
              key={property._id} 
              href={`/properties/${property.slug?.current || property.slug}`}
              className="group relative h-[500px] lg:h-[650px] w-full cursor-pointer overflow-hidden bg-[#100B28]"
            >
              <Image 
                src={property.imageUrl}
                alt={property.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover transition-transform duration-[2s] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#100B28]/95 via-[#100B28]/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12 text-center flex flex-col items-center z-10 transition-transform duration-700">
                <h3 className="font-serif text-2xl lg:text-3xl mb-3 lg:mb-4 text-white tracking-[0.05em] uppercase">{property.title}</h3>
                <p className="font-sans text-[8px] lg:text-[9px] tracking-[0.3em] lg:tracking-[0.4em] text-white/70 mb-2 lg:mb-3 uppercase font-bold">
                  {property.details || `${property.district || ''}${property.district && property.propertyType ? ' • ' : ''}${Array.isArray(property.propertyType) ? property.propertyType.join(', ') : property.propertyType || ''}`.trim() || "EXCLUSIVE LISTING"}
                </p>
                <p className="font-serif text-[13px] lg:text-[15px] text-white italic">
                  {typeof property.price === 'object' ? `${property.price.currency} ${property.price.amount}` : property.price}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 lg:mt-20 flex justify-center">
           <Link href="/buy">
             <button className="bg-transparent border border-white/40 px-10 py-3.5 lg:px-12 lg:py-4 text-[9px] lg:text-[10px] tracking-[0.3em] lg:tracking-[0.4em] font-sans font-bold hover:bg-white hover:text-[#100B28] transition-all duration-500 rounded-full uppercase">
               VIEW ALL LISTINGS
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

      {/* Spotlight Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-16 bg-[#100B28] text-white">
        <div className="max-w-[1500px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 lg:mb-16 gap-8">
            <h2 className="text-xl lg:text-[2rem] font-serif tracking-[0.1em] lg:tracking-[0.15em] uppercase leading-tight">
              {data?.spotlightSection?.title || "ON THE MOVE WITH"} <span className="italic border-b border-white pb-1.5 font-light text-white/70">@kaararealtygroup</span>
            </h2>
            <div className="hidden lg:flex gap-6">
              <button className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-[#100B28] transition-all duration-500 group shadow-sm">
                <ChevronDown className="rotate-90 group-hover:scale-110 transition-transform" size={18} />
              </button>
              <button className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-[#100B28] transition-all duration-500 group shadow-sm">
                <ChevronDown className="-rotate-90 group-hover:scale-110 transition-transform" size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="relative h-[450px] lg:h-[650px] group overflow-hidden bg-[#100B28]">
              <Image 
                src={data.spotlightSection?.featuredEvent?.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"} 
                alt={data.spotlightSection?.featuredEvent?.title || "Spotlight Event"} 
                fill 
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-[2.5s] group-hover:scale-110 filter desaturate-[0.2]" 
              />
            </div>
            <div className="relative h-[450px] lg:h-[650px] group overflow-hidden bg-[#100B28]">
              <Image 
                src={data.spotlightSection?.featuredEvent?.media?.[0]?.url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"} 
                alt="Spotlight Media" 
                fill 
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-[2.5s] group-hover:scale-110 filter desaturate-[0.2]" 
              />
            </div>
            <div className="bg-[#0b0b14] p-10 lg:p-16 flex flex-col justify-between h-[450px] lg:h-[650px] shadow-xl relative overflow-hidden group border border-white/5">
              <div className="relative z-10">
                <h3 className="text-2xl lg:text-3xl font-serif mb-6 lg:mb-8 leading-[1.3] text-white tracking-[0.02em] uppercase italic">
                  {data.spotlightSection?.featuredEvent?.title || "Spotlight on Vertical Cities: The Symphony & 88 Nairobi"}
                </h3>
                <div className="w-12 lg:w-16 h-[1.5px] bg-white/20 mb-8 lg:mb-10 group-hover:w-24 lg:group-hover:w-32 transition-all duration-1000"></div>
                <p className="text-[8px] lg:text-[10px] tracking-[0.4em] lg:tracking-[0.5em] text-white/50 uppercase mb-3 font-bold">
                  {data.spotlightSection?.featuredEvent?.description || "Innovation Summit 2026"}
                </p>
                <p className="text-[10px] lg:text-[11px] tracking-[0.2em] lg:tracking-[0.3em] text-white uppercase font-bold">
                  {data.spotlightSection?.featuredEvent?.location} | {data.spotlightSection?.featuredEvent?.date}
                </p>
              </div>
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-white/30 flex items-center justify-center text-[9px] lg:text-[11px] font-serif text-white uppercase">K</div>
                 <span className="text-[9px] lg:text-[11px] tracking-[0.3em] lg:tracking-[0.4em] font-serif uppercase text-white font-bold">KAARA REALTY GROUP</span>
              </div>
            </div>
          </div>
        </div>
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
