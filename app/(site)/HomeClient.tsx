"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ChevronDown, User, Heart, Settings, Menu, ArrowRight, Play, Pause, X as CloseIcon, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const SEARCH_REGIONS = [
  {
    name: "NAIROBI",
    districts: ["MUTHAIGA", "KAREN", "RUNDA", "WESTLANDS", "GIGIRI", "LAVINGTON", "KILELESHWA", "VIEW ALL NAIROBI"],
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "MOMBASA",
    districts: ["NYALI", "BAMBURI", "SHANZU", "DIANI BEACH", "VIPINGO RIDGE", "VIEW ALL MOMBASA"],
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "KIAMBU",
    districts: ["TIGONI", "THIKA GREENS", "TATU CITY", "FOURWAYS JUNCTION", "KIAMBU ROAD", "VIEW ALL KIAMBU"],
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "NAIVASHA",
    districts: ["GREAT RIFT VALLEY", "LAKE NAIVASHA", "KEDONG RANCH", "MOUNT LONGONOT", "VIEW ALL NAIVASHA"],
    image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "LAIKIPIA",
    districts: ["NANYUKI", "MOUNT KENYA WILDLIFE ESTATE", "LOISABA", "OL PEJETA", "VIEW ALL LAIKIPIA"],
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "KAJIADO",
    districts: ["NGONG HILLS", "KISAJU", "KITENGELA", "AMBOSELI", "VIEW ALL KAJIADO"],
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80"
  }
];

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
    tertiaryVideo?: VideoSource;
    quaternaryVideo?: VideoSource;
    featuredProperties?: any[];
    featuredEvent?: {
      title: string;
      description: string;
      location: string;
      date: string;
      imageUrl: string;
      media: any[];
    };
  }
}

export default function HomeClient({ data }: HomeClientProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeRegionIdx, setActiveRegionIdx] = useState(0);
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
  const vTertiary = getVideoSrc(data?.tertiaryVideo, "https://res.cloudinary.com/dk92v0fkk/video/upload/w_1870,h_947,c_fill/v1773870636/production/inrthpxt4vwiblfpko8j.mp4#t=0.1");
  const vQuaternary = getVideoSrc(data?.quaternaryVideo, "https://res.cloudinary.com/dk92v0fkk/video/upload/w_1870,h_947,c_fill/v1724088268/staging/yv4bjz9n4wggkcgxvgqt.mp4#t=0.1");

  const SectionBottomNav = () => (
    <div className="absolute bottom-0 w-full z-50 px-6 py-8 lg:px-12 lg:py-12 flex justify-between items-center text-[9px] lg:text-[10px] font-sans tracking-[0.3em] text-white font-bold uppercase">
      <div className="flex items-center space-x-8 lg:space-x-12">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="hover:text-white/60 transition-colors"
        >
          <Search size={18} />
        </button>
        <Link href="#" className="hover:text-white/60 transition-colors hidden sm:block">BUY</Link>
        <Link href="#" className="hover:text-white/60 transition-colors hidden sm:block">RENT</Link>
        <Link href="#" className="hover:text-white/60 transition-colors hidden sm:block">SELL</Link>
        <Link href="#" className="hover:text-white/60 transition-colors hidden sm:block">AGENTS</Link>
      </div>

      <div className="hidden lg:flex items-center space-x-12">
        <Link href="#" className="hover:text-white/60 transition-colors">NEW DEVELOPMENT</Link>
        <Link href="#" className="hover:text-white/60 transition-colors text-[#E5E5E5]">WORLD OF KAARA</Link>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#100B28]">
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

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[300] bg-[#100B28] flex flex-col p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-16">
            <Link href="/" className="text-lg font-serif tracking-[0.3em] text-white uppercase">
              KAARA REALTY
            </Link>
            <button onClick={() => setIsMenuOpen(false)} className="text-white">
              <CloseIcon size={24} />
            </button>
          </div>
          <div className="flex flex-col space-y-8 text-2xl font-serif tracking-[0.1em] uppercase text-white">
            <Link href="#" className="hover:text-white/60 transition-colors" onClick={() => setIsMenuOpen(false)}>BUY</Link>
            <Link href="#" className="hover:text-white/60 transition-colors" onClick={() => setIsMenuOpen(false)}>RENT</Link>
            <Link href="#" className="hover:text-white/60 transition-colors" onClick={() => setIsMenuOpen(false)}>SELL</Link>
            <Link href="#" className="hover:text-white/60 transition-colors" onClick={() => setIsMenuOpen(false)}>AGENTS</Link>
            <Link href="#" className="hover:text-white/60 transition-colors" onClick={() => setIsMenuOpen(false)}>NEW DEVELOPMENT</Link>
            <Link href="#" className="hover:text-white/60 transition-colors text-white/50" onClick={() => setIsMenuOpen(false)}>WORLD OF KAARA</Link>
          </div>
          <div className="mt-auto pt-16 flex gap-8">
            <Link href="#" className="text-white/40 hover:text-white"><FaFacebookF size={20} /></Link>
            <Link href="#" className="text-white/40 hover:text-white"><FaXTwitter size={20} /></Link>
            <Link href="#" className="text-white/40 hover:text-white"><FaInstagram size={20} /></Link>
            <Link href="#" className="text-white/40 hover:text-white"><FaLinkedinIn size={20} /></Link>
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 lg:p-8">
          <div 
            className="absolute inset-0 bg-[#100B28]/95 backdrop-blur-2xl cursor-pointer" 
            onClick={() => setIsSearchOpen(false)}
          />
          
          <div className="absolute top-0 w-full px-6 py-6 lg:px-8 lg:py-8 flex justify-center items-start z-[210]">
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="group flex items-center gap-3 bg-white/10 border border-white/30 px-6 py-3 lg:px-8 lg:py-3.5 text-[9px] lg:text-[10px] font-sans tracking-[0.2em] lg:tracking-[0.3em] font-bold hover:bg-white hover:text-[#100B28] transition-all duration-500 text-white rounded-full uppercase"
            >
              START YOUR SEARCH
              <ChevronDown className="rotate-180 transition-transform duration-500" size={14} />
            </button>
          </div>

          <div className="relative z-[210] w-full max-w-5xl bg-[#100B28]/80 border border-white/10 rounded-2xl overflow-hidden flex flex-col lg:flex-row h-[85vh] lg:h-[600px] shadow-2xl">
            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto py-8 lg:py-12">
              <p className="px-10 mb-6 text-[8px] tracking-[0.4em] text-white/30 uppercase font-bold lg:hidden">Regions</p>
              {SEARCH_REGIONS.map((region, idx) => (
                <button
                  key={region.name}
                  onClick={() => setActiveRegionIdx(idx)}
                  onMouseEnter={() => setActiveRegionIdx(idx)}
                  className={`w-full px-10 lg:px-12 py-4 lg:py-5 flex justify-between items-center text-[10px] lg:text-[11px] tracking-[0.2em] lg:tracking-[0.3em] font-sans transition-all duration-300 uppercase ${activeRegionIdx === idx ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/70'}`}
                >
                  {region.name}
                  <ChevronRight size={14} className={`transition-transform duration-300 ${activeRegionIdx === idx ? 'translate-x-2 opacity-100' : 'opacity-0 lg:opacity-0'}`} />
                </button>
              ))}
            </div>

            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto py-8 lg:py-12 px-10 lg:px-12">
              <p className="mb-8 text-[8px] tracking-[0.4em] text-white/30 uppercase font-bold lg:hidden">Districts</p>
              <div className="grid grid-cols-1 gap-6 lg:gap-8">
                {SEARCH_REGIONS[activeRegionIdx].districts.map((district) => (
                  <Link 
                    key={district} 
                    href="#" 
                    className="text-[10px] lg:text-[11px] tracking-[0.2em] lg:tracking-[0.25em] font-sans text-white/50 hover:text-white transition-all duration-300 uppercase font-light"
                  >
                    {district}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden lg:block lg:w-1/3 relative">
              <Image 
                src={SEARCH_REGIONS[activeRegionIdx].image}
                alt={SEARCH_REGIONS[activeRegionIdx].name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-[2s] hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#100B28]/80 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10">
                <p className="text-[9px] tracking-[0.4em] text-white/60 uppercase mb-3 font-bold">Featured Area</p>
                <h4 className="text-2xl font-serif text-white tracking-[0.1em] uppercase">{SEARCH_REGIONS[activeRegionIdx].name}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

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

        <nav className="absolute top-0 w-full z-50 px-6 py-8 lg:px-12 lg:py-12 flex justify-center items-center">
          <Link href="/" className="text-lg lg:text-[1.75rem] font-serif tracking-[0.4em] text-white text-center whitespace-nowrap uppercase">
            KAARA REALTY GROUP
          </Link>
        </nav>

        <div className="absolute top-24 lg:top-32 left-6 lg:left-16 z-20 text-left max-w-xl">
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
            START YOUR SEARCH
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
          <p className="font-sans text-[8px] lg:text-[11px] tracking-[0.4em] text-white/60 uppercase mb-4 lg:mb-6 font-bold">Local Experts, Global Reach</p>
          <h2 className="text-2xl lg:text-[2.75rem] font-serif tracking-[0.1em] lg:tracking-[0.2em] uppercase text-white mb-8 lg:mb-12">The Next Move Is Yours</h2>
          
          <div className="w-[1px] h-12 lg:h-20 bg-white/20 mb-8 lg:mb-12"></div>
          
          <div className="flex flex-wrap justify-center gap-6 lg:gap-16 text-[9px] lg:text-[11px] font-sans tracking-[0.2em] lg:tracking-[0.3em] uppercase text-white/50 font-bold mb-12 lg:mb-16">
            <button className="text-white border-b-[1.5px] border-white pb-1.5">CITY SKYLINES</button>
            <button className="hover:text-white transition-all duration-300">WATER VIEWS</button>
            <button className="hover:text-white transition-all duration-300">FARM & RANCH</button>
            <button className="hover:text-white transition-all duration-300">JUST LISTED</button>
            <button className="hover:text-white transition-all duration-300">UNDER $20 MILLION</button>
          </div>
        </div>

        <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px] lg:gap-1">
          {(data?.featuredProperties || []).map((property: any) => (
            <div key={property._id} className="group relative h-[500px] lg:h-[650px] w-full cursor-pointer overflow-hidden bg-[#100B28]">
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
                <p className="font-sans text-[8px] lg:text-[9px] tracking-[0.3em] lg:tracking-[0.4em] text-white/70 mb-2 lg:mb-3 uppercase font-bold">{property.district} • {property.county}</p>
                <p className="font-serif text-[13px] lg:text-[15px] text-white italic">{property.price}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 lg:mt-20 flex justify-center">
           <button className="bg-transparent border border-white/40 px-10 py-3.5 lg:px-12 lg:py-4 text-[9px] lg:text-[10px] tracking-[0.3em] lg:tracking-[0.4em] font-sans font-bold hover:bg-white hover:text-[#100B28] transition-all duration-500 rounded-full uppercase">
             VIEW ALL LISTINGS
           </button>
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
             {data?.tertiaryVideo?.title || "LIVE THE EXTRAORDINARY"}
           </h2>
           {data?.tertiaryVideo?.subtitle && (
             <p className="text-[8px] lg:text-sm tracking-[0.2em] lg:tracking-[0.3em] text-white/80 uppercase font-light mt-4">{data.tertiaryVideo.subtitle}</p>
           )}
        </div>

        <SectionBottomNav />
      </section>

      {/* Spotlight Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-16 bg-[#100B28] text-white">
        <div className="max-w-[1500px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 lg:mb-16 gap-8">
            <h2 className="text-xl lg:text-[2rem] font-serif tracking-[0.1em] lg:tracking-[0.15em] uppercase leading-tight">
              ON THE MOVE WITH <span className="italic border-b border-white pb-1.5 font-light text-white/70">@kaararealtygroup</span>
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
                src={data.featuredEvent?.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"} 
                alt={data.featuredEvent?.title || "Spotlight Event"} 
                fill 
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-[2.5s] group-hover:scale-110 filter desaturate-[0.2]" 
              />
            </div>
            <div className="relative h-[450px] lg:h-[650px] group overflow-hidden bg-[#100B28]">
              <Image 
                src={data.featuredEvent?.media?.[0]?.url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"} 
                alt="Spotlight Media" 
                fill 
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-[2.5s] group-hover:scale-110 filter desaturate-[0.2]" 
              />
            </div>
            <div className="bg-[#0b0b14] p-10 lg:p-16 flex flex-col justify-between h-[450px] lg:h-[650px] shadow-xl relative overflow-hidden group border border-white/5">
              <div className="relative z-10">
                <h3 className="text-2xl lg:text-3xl font-serif mb-6 lg:mb-8 leading-[1.3] text-white tracking-[0.02em] uppercase italic">
                  {data.featuredEvent?.title || "Spotlight on Vertical Cities: The Symphony & 88 Nairobi"}
                </h3>
                <div className="w-12 lg:w-16 h-[1.5px] bg-white/20 mb-8 lg:mb-10 group-hover:w-24 lg:group-hover:w-32 transition-all duration-1000"></div>
                <p className="text-[8px] lg:text-[10px] tracking-[0.4em] lg:tracking-[0.5em] text-white/50 uppercase mb-3 font-bold">
                  {data.featuredEvent?.description || "Innovation Summit 2026"}
                </p>
                <p className="text-[10px] lg:text-[11px] tracking-[0.2em] lg:tracking-[0.3em] text-white uppercase font-bold">
                  {data.featuredEvent?.location} | {data.featuredEvent?.date}
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
             {data?.quaternaryVideo?.title || "88 NAIROBI CONDOMINIUM"}
           </h2>
           <p className="text-[8px] lg:text-sm tracking-[0.2em] lg:tracking-[0.3em] text-white/80 uppercase font-light">
             {data?.quaternaryVideo?.subtitle || "The Apex of Upper Hill • Handover May 2026"}
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

      {/* Master Footer */}
      <footer className="bg-[#100B28] text-white pt-24 lg:pt-40 pb-12 lg:pb-16 px-6 lg:px-20 border-t border-white/5">
        <div className="max-w-[1700px] mx-auto">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-20 lg:mb-32 group cursor-pointer text-center">
            <div className="text-center">
              <span className="text-xl lg:text-[2rem] tracking-[0.4em] lg:tracking-[0.6em] font-serif uppercase text-white inline-block mb-3">KAARA REALTY GROUP</span>
              <div className="h-[1px] w-0 bg-white/20 mx-auto transition-all duration-1000 group-hover:w-full"></div>
              <p className="text-[10px] tracking-[0.3em] text-white/40 mt-4 uppercase font-bold">info@kaararealtygroup.com</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16 mb-24 lg:mb-32 font-sans text-[9px] lg:text-[10px] tracking-[0.3em] lg:tracking-[0.4em] uppercase font-bold text-center sm:text-left">
            <div className="space-y-6 lg:space-y-8">
              <h4 className="text-white/40 mb-8 lg:mb-12 font-bold tracking-[0.5em]">The Agency</h4>
              <ul className="space-y-4 lg:space-y-6 text-white/70">
                <li><Link href="#" className="hover:text-white transition-all duration-300">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">Leadership</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">Vertical Experts</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">Press Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">Careers</Link></li>
              </ul>
            </div>
            <div className="space-y-6 lg:space-y-8">
              <h4 className="text-white/40 mb-8 lg:mb-12 font-bold tracking-[0.5em]">Intelligence</h4>
              <ul className="space-y-4 lg:space-y-6 text-white/70">
                <li><Link href="#" className="hover:text-white transition-all duration-300">Market Reports</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">Vertical Insights</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">The Journal</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">Global Search</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">Client Login</Link></li>
              </ul>
            </div>
            <div className="space-y-6 lg:space-y-8">
              <h4 className="text-white/40 mb-8 lg:mb-12 font-bold tracking-[0.5em]">Districts</h4>
              <ul className="space-y-4 lg:space-y-6 text-white/70">
                <li><Link href="#" className="hover:text-white transition-all duration-300">Upper Hill</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">Westlands</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">Kilimani</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">Karen</Link></li>
                <li><Link href="#" className="hover:text-white transition-all duration-300">Muthaiga</Link></li>
              </ul>
            </div>
            <div className="space-y-8 lg:space-y-10 sm:col-span-2 lg:col-span-2">
              <h4 className="text-white/40 mb-8 lg:mb-12 font-bold tracking-[0.5em]">The Collective</h4>
              <p className="text-white/30 normal-case tracking-normal mb-8 lg:mb-10 leading-relaxed max-w-sm mx-auto sm:mx-0 text-xs font-light uppercase">
                Join our exclusive network for curated updates on vertical developments and luxury estates across Nairobi.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex max-w-md border-b border-white/10 pb-3 group mx-auto sm:mx-0">
                <input 
                  type="email" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={isSubmitting ? "SUBMITTING..." : "SUBSCRIBE"} 
                  disabled={isSubmitting}
                  className="bg-transparent border-none outline-none flex-grow text-[10px] lg:text-[11px] tracking-[0.4em] lg:tracking-[0.5em] font-sans placeholder:text-white/10 text-white font-bold uppercase"
                />
                <button type="submit" disabled={isSubmitting} className="text-white/20 group-hover:text-white transition-all duration-500 group-hover:translate-x-1">
                  <ArrowRight size={20} />
                </button>
              </form>
            </div>
          </div>

          <div className="pt-12 lg:pt-16 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-12 lg:gap-16 text-[8px] lg:text-[9px] tracking-[0.3em] lg:tracking-[0.5em] text-white/30 uppercase text-center">
             <div className="flex flex-wrap justify-center gap-8 lg:gap-10">
                <Link href="#" className="hover:text-white transition-colors">Digital Site Map</Link>
                <Link href="#" className="hover:text-white transition-colors">Legal Terms</Link>
                <Link href="#" className="hover:text-white transition-colors">Privacy Charter</Link>
                <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
             </div>
             <div className="flex gap-8 lg:gap-12">
                <Link href="#" className="hover:text-white transition-all duration-500 hover:scale-110"><FaFacebookF size={18} /></Link>
                <Link href="#" className="hover:text-white transition-all duration-500 hover:scale-110"><FaXTwitter size={18} /></Link>
                <Link href="#" className="hover:text-white transition-all duration-500 hover:scale-110"><FaInstagram size={18} /></Link>
                <Link href="#" className="hover:text-white transition-all duration-500 hover:scale-110"><FaLinkedinIn size={18} /></Link>
             </div>
          </div>

          <div className="mt-16 lg:mt-24 text-[7px] lg:text-[8px] leading-[2] text-white/20 text-center max-w-5xl mx-auto tracking-[0.15em] lg:tracking-[0.2em] uppercase font-light px-4">
             <p className="mb-4">KAARA REALTY GROUP IS THE PREMIER BROKERAGE FOR VERTICAL LUXURY IN KENYA. ALL MATERIAL PRESENTED HEREIN IS INTENDED FOR INFORMATION PURPOSES ONLY. WHILE THIS INFORMATION IS BELIEVED TO BE CORRECT, IT IS REPRESENTED SUBJECT TO ERRORS, OMISSIONS, CHANGES, OR WITHDRAWAL WITHOUT NOTICE.</p>
             <p>© 2026 KAARA REALTY GROUP. THE PINNACLE OF KENYAN REAL ESTATE. EQUAL HOUSING OPPORTUNITY.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
