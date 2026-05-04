"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Search, 
  Map as MapIcon, 
  List as ListIcon, 
  SlidersHorizontal, 
  ChevronDown, 
  X, 
  Heart,
  Maximize2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { extractCoordsFromGoogleMapsUrl, getCoordsBySearch } from "@/lib/geocoding";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";

const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#100B28]/5 animate-pulse flex items-center justify-center text-white/20 uppercase tracking-widest text-[10px]">LOADING MAP...</div>
});

interface Property {
  _id: string;
  title: string;
  slug: string;
  buildingName?: string;
  price: {
    amount: string;
    currency: string;
  } | string;
  imageUrl: string;
  county: string;
  district: {
    name: string;
    boundary?: { lat: number; lng: number }[];
  } | string;
  details?: string;
  propertyType?: string[];
  shortDescription?: string;
  googleMapsUrl?: string;
  amenities?: string[];
  size?: string;
  yearBuilt?: string;
  media?: any[];
}

interface PropertiesClientProps {
  initialProperties: Property[];
  settings?: {
    general?: any;
    brand?: any;
    contact?: any;
    socials?: any;
  };
}

const PropertyCard = ({ 
  property, 
  isActive, 
  onMouseEnter, 
  isCompareEnabled,
  isSelected,
  onToggleSelection 
}: { 
  property: Property, 
  isActive: boolean, 
  onMouseEnter: () => void, 
  isCompareEnabled: boolean,
  isSelected: boolean,
  onToggleSelection: () => void
}) => {
  const { t } = useLanguage();
  const { formatPrice: globalFormatPrice } = useCurrency();
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);
  
  const images = useMemo(() => {
    const mediaImages = property.media?.filter(m => m.url).map(m => m.url) || [];
    if (property.imageUrl && !mediaImages.includes(property.imageUrl)) {
      return [property.imageUrl, ...mediaImages];
    }
    return mediaImages.length > 0 ? mediaImages : [property.imageUrl];
  }, [property.media, property.imageUrl]);

  const formatPrice = (price: any) => {
    if (!price) return "Price on Request";
    const amount = typeof price === 'object' ? price.amount : price;
    const currency = typeof price === 'object' ? price.currency : "USD";
    return globalFormatPrice(amount, currency);
  };

  return (
    <div 
      className={cn(
        "bg-white group cursor-pointer border-b border-gray-100 transition-colors duration-300 relative",
        isActive ? "bg-gray-50" : "hover:bg-gray-50/50"
      )}
      onMouseEnter={onMouseEnter}
    >
      {isCompareEnabled && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelection(); }}
          className="absolute top-4 left-4 z-40"
        >
           <div className={cn(
             "w-6 h-6 border-2 flex items-center justify-center transition-all",
             isSelected ? "bg-[#007EA7] border-[#007EA7]" : "bg-white/20 border-white backdrop-blur-md hover:bg-white/40"
           )}>
              <div className={cn("w-2.5 h-2.5 bg-white transition-all", isSelected ? "scale-100" : "scale-0")} />
           </div>
        </button>
      )}

      <Link href={`/properties/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] lg:aspect-video overflow-hidden">
          <Image 
            src={images[currentMediaIdx]} 
            alt={property.title} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-4 right-4 z-10">
            <button className="p-2 bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-[#100B28] transition-all">
              <Heart size={16} />
            </button>
          </div>
          <div className="absolute top-0 left-0 bg-[#100B28] text-white px-3 py-1.5 text-[8px] font-bold tracking-[0.2em] uppercase">
            {property.propertyType?.[0] || 'Exclusive'}
          </div>
        </div>
        
        <div className="p-6 lg:p-8">
          <h3 className="text-xl lg:text-2xl font-serif tracking-tight mb-2">
            {formatPrice(property.price)}
          </h3>
          <h4 className="text-xs lg:text-sm font-bold uppercase tracking-[0.1em] mb-1 line-clamp-1">{property.title}</h4>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-4">
            {typeof property.district === 'object' ? property.district.name : property.district}
          </p>
          
          <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-gray-400 border-t border-gray-50 pt-4">
            {property.details?.split('|').map((detail, idx) => (
              <span key={idx}>{detail.trim()}</span>
            ))}
          </div>
          
          <div className="mt-6 flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] text-[#007EA7] uppercase">
            <div className="w-4 h-4 bg-[#007EA7] flex items-center justify-center text-[6px] text-white">K</div>
            KAARA {t('exclusive')}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default function PropertiesClient({ initialProperties, settings }: PropertiesClientProps) {
  const { t } = useLanguage();
  const { formatPrice: globalFormatPrice } = useCurrency();
  const [viewMode, setViewMode] = useState<"map-list" | "list" | "map">("map-list");
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCompareEnabled, setIsCompareEnabled] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Auto-switch viewMode based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        if (viewMode === "map-list") setViewMode("list");
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const togglePropertySelection = (property: Property) => {
    setSelectedProperties(prev => 
      prev.some(p => p._id === property._id)
        ? prev.filter(p => p._id !== property._id)
        : prev.length < 4 ? [...prev, property] : prev
    );
  };

  const processedProperties = useMemo(() => {
    return (initialProperties || []).map(p => {
      let coords = p.googleMapsUrl ? extractCoordsFromGoogleMapsUrl(p.googleMapsUrl) : null;
      const districtName = typeof p.district === 'object' ? p.district.name : p.district;
      if (!coords) coords = getCoordsBySearch(p.title, districtName, p.county);
      return { ...p, coords };
    });
  }, [initialProperties]);

  const filteredProperties = useMemo(() => {
    return processedProperties.filter(p => {
      const districtName = typeof p.district === 'object' ? p.district.name : p.district;
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           districtName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [processedProperties, searchQuery]);

  const activeProperty = useMemo(() => filteredProperties.find(p => p._id === activePropertyId) || null, [filteredProperties, activePropertyId]);
  const mapCenter: [number, number] = useMemo(() => activeProperty?.coords ? [activeProperty.coords.lat, activeProperty.coords.lng] : [-1.2921, 36.8219], [activeProperty]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#100B28]">
      <Navbar settings={settings} />

      <div className="flex flex-col pt-20">
        
        {/* Filter Bar */}
        <div className="h-16 lg:h-14 border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 shrink-0 bg-white z-40">
          <div className="flex items-center gap-4 lg:gap-8 overflow-x-auto no-scrollbar flex-grow mr-4">
            <div className="relative min-w-[150px] lg:min-w-[300px]">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Search by District or Building..." 
                className="w-full bg-transparent border-none text-[10px] font-bold tracking-widest uppercase pl-6 focus:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="hidden sm:flex items-center gap-4 lg:gap-6">
              {['Price', 'Bed / Bath', 'Type'].map((filter) => (
                <button key={filter} className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase hover:text-gray-400 transition-colors whitespace-nowrap">
                  {filter} <ChevronDown size={14} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-200 text-[#100B28] h-9 text-[10px] font-bold tracking-widest uppercase"
              onClick={() => setIsFilterModalOpen(true)}
            >
              <span className="hidden sm:inline mr-2">ALL FILTERS</span>
              <SlidersHorizontal size={14} />
            </Button>
            
            <div className="h-8 w-px bg-gray-100 hidden lg:block mx-2" />
            
            <button 
              onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
              className="lg:hidden w-9 h-9 border border-gray-100 flex items-center justify-center text-gray-400"
            >
              {viewMode === "list" ? <MapIcon size={18} /> : <ListIcon size={18} />}
            </button>
          </div>
        </div>

        {/* Discovery Hub Container */}
        <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-140px)] relative">
          {/* List Section */}
          <div className={cn(
            "transition-all duration-500 bg-white custom-scrollbar",
            viewMode === "map-list" ? "w-full lg:w-[45%] xl:w-[40%] lg:h-full lg:overflow-y-auto" : 
            viewMode === "list" ? "w-full h-auto" : "hidden lg:block lg:w-0 lg:opacity-0 lg:overflow-hidden"
          )}>
            <div className="px-6 py-8 lg:px-10 space-y-6">
               <div className="space-y-1">
                  <h1 className="text-2xl lg:text-4xl font-serif tracking-tight text-gray-900 uppercase">Luxury listings</h1>
                  <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                    {filteredProperties.length} Homes for sale
                  </p>
               </div>

               <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                     <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">{t('compare')}</span>
                     <button 
                        onClick={() => setIsCompareEnabled(!isCompareEnabled)}
                        className={cn("w-9 h-4.5 rounded-full relative transition-all duration-500", isCompareEnabled ? "bg-[#007EA7]" : "bg-gray-200")}
                     >
                        <div className={cn("absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all", isCompareEnabled ? "left-5" : "left-0.5")} />
                     </button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100 border-t border-gray-100">
              {filteredProperties.map((property) => (
                <PropertyCard 
                  key={property._id} 
                  property={property} 
                  isActive={activePropertyId === property._id}
                  onMouseEnter={() => setActivePropertyId(property._id)}
                  isCompareEnabled={isCompareEnabled}
                  isSelected={selectedProperties.some(p => p._id === property._id)}
                  onToggleSelection={() => togglePropertySelection(property)}
                />
              ))}
            </div>
          </div>

          {/* Map Section */}
          <div className={cn(
            "transition-all duration-500 relative",
            viewMode === "map-list" ? "hidden lg:block lg:flex-grow lg:h-full" : 
            viewMode === "map" ? "w-full h-[60vh] lg:h-full" : "hidden lg:block lg:w-0 lg:opacity-0 lg:overflow-hidden"
          )}>
            <PropertyMap 
              properties={filteredProperties.map(p => ({
                ...p,
                price: globalFormatPrice(typeof p.price === 'object' ? p.price.amount : p.price, typeof p.price === 'object' ? p.price.currency : "USD")
              }))} 
              activePropertyId={activePropertyId}
              center={mapCenter}
              zoom={activePropertyId ? 14 : 12}
            />
          </div>
        </div>

        {/* Global Footer - Fixed at the bottom of the page */}
        <Footer settings={settings} />
      </div>

      {/* Comparison Floating Bar */}
      {selectedProperties.length > 0 && (
        <div className="fixed bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] lg:max-w-2xl">
           <div className="bg-[#000B1D] text-white p-4 flex flex-col sm:flex-row items-center justify-between shadow-2xl border border-white/10 gap-4 sm:gap-0">
              <div className="flex items-center gap-4">
                 <div className="flex -space-x-4">
                    {selectedProperties.map((p) => (
                       <div key={p._id} className="w-10 h-10 border border-[#000B1D] relative overflow-hidden bg-gray-900 group">
                          <Image src={p.imageUrl} alt={p.title} fill className="object-cover opacity-80" />
                          <button 
                            onClick={() => togglePropertySelection(p)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X size={14} className="text-white" />
                          </button>
                       </div>
                    ))}
                 </div>
                 <div className="flex flex-col">
                   <p className="text-[9px] font-bold tracking-widest uppercase">{selectedProperties.length} Selected</p>
                   <button 
                    onClick={() => setSelectedProperties([])}
                    className="text-[7px] font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors text-left"
                   >
                     CLEAR ALL
                   </button>
                 </div>
              </div>
              <button 
                onClick={() => setIsCompareModalOpen(true)}
                disabled={selectedProperties.length < 2}
                className={cn(
                  "w-full sm:w-auto px-8 py-3 text-[10px] font-bold tracking-[0.3em] uppercase transition-all",
                  selectedProperties.length < 2 ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-[#007EA7] text-white hover:bg-white hover:text-[#000B1D]"
                )}
              >
                COMPARE {selectedProperties.length > 0 ? `(${selectedProperties.length}/4)` : ""}
              </button>
           </div>
        </div>
      )}

      {/* Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
           <div className="min-h-screen p-6 lg:p-12 xl:p-20">
              <div className="flex justify-between items-start mb-12 lg:mb-20">
                 <div className="space-y-2">
                    <h2 className="text-3xl lg:text-5xl xl:text-6xl font-serif tracking-tight uppercase">Comparison</h2>
                    <p className="text-[10px] font-bold tracking-[0.5em] text-gray-400 uppercase">Portfolio Analysis • {selectedProperties.length} Units</p>
                 </div>
                 <button onClick={() => setIsCompareModalOpen(false)} className="p-4 border border-gray-100 hover:bg-gray-50 transition-colors"><X size={20} /></button>
              </div>

              <div className={cn(
                "grid gap-8 lg:gap-10 xl:gap-12",
                selectedProperties.length === 2 ? "grid-cols-1 md:grid-cols-3" : 
                selectedProperties.length === 3 ? "grid-cols-1 md:grid-cols-4" : 
                "grid-cols-1 md:grid-cols-5"
              )}>
                 <div className="hidden md:block space-y-16 pt-[300px] lg:pt-[400px]">
                    {[
                      'ESTIMATED COST', 
                      'DISTRICT / AREA', 
                      'PROPERTY TYPE', 
                      'SPACE & SPECS',
                      'AMENITIES',
                      'COMPLETION',
                      'STATUS'
                    ].map(spec => (
                      <div key={spec} className="h-20 flex items-center border-b border-gray-100 text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">{spec}</div>
                    ))}
                 </div>

                 {selectedProperties.map((p) => (
                   <div key={p._id} className="space-y-8 lg:space-y-16">
                      <div className="relative aspect-square lg:aspect-[4/5] overflow-hidden group shadow-2xl">
                         <Image src={p.imageUrl} alt={p.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                         <div className="absolute top-0 left-0 bg-[#100B28] text-white px-4 py-2 text-[9px] font-bold tracking-widest uppercase">
                            {p.propertyType?.[0] || 'Exclusive'}
                         </div>
                      </div>
                      
                      <div className="space-y-4 text-center md:text-left">
                        <h3 className="text-2xl lg:text-3xl font-serif uppercase tracking-tight">{p.title}</h3>
                        <p className="text-[10px] tracking-[0.4em] text-gray-400 uppercase font-bold">{p.buildingName || 'Signature Collection'}</p>
                      </div>

                      <div className="space-y-0 border-t border-gray-100">
                        {/* COST */}
                        <div className="md:hidden flex justify-between py-6 border-b text-[10px] uppercase tracking-widest text-gray-400"><span>Cost</span><span className="text-gray-900 font-bold">{globalFormatPrice(typeof p.price === 'object' ? p.price.amount : p.price, typeof p.price === 'object' ? p.price.currency : "USD")}</span></div>
                        <div className="hidden md:block h-20 flex items-center border-b border-gray-100 text-xl lg:text-2xl font-serif">
                          {globalFormatPrice(typeof p.price === 'object' ? p.price.amount : p.price, typeof p.price === 'object' ? p.price.currency : "USD")}
                        </div>

                        {/* DISTRICT */}
                        <div className="md:hidden flex justify-between py-6 border-b text-[10px] uppercase tracking-widest text-gray-400"><span>District</span><span className="text-gray-900 font-bold">{typeof p.district === 'object' ? p.district.name : p.district}</span></div>
                        <div className="hidden md:block h-20 flex items-center border-b border-gray-100 text-[11px] font-bold tracking-widest uppercase text-gray-600">
                          {typeof p.district === 'object' ? p.district.name : p.district}
                        </div>

                        {/* TYPE */}
                        <div className="md:hidden flex justify-between py-6 border-b text-[10px] uppercase tracking-widest text-gray-400"><span>Type</span><span className="text-gray-900 font-bold">{p.propertyType?.join(', ') || 'Residential'}</span></div>
                        <div className="hidden md:block h-20 flex items-center border-b border-gray-100 text-[11px] font-bold tracking-widest uppercase text-gray-600">
                          {p.propertyType?.slice(0, 2).join(' / ') || 'Residential'}
                        </div>

                        {/* SPACE & SPECS */}
                        <div className="md:hidden flex justify-between py-6 border-b text-[10px] uppercase tracking-widest text-gray-400"><span>Space</span><span className="text-gray-900 font-bold">{p.details} / {p.size || 'N/A'}</span></div>
                        <div className="hidden md:block h-20 flex items-center border-b border-gray-100 text-[11px] font-bold tracking-widest uppercase text-gray-600">
                           {p.details} <span className="mx-2 opacity-30">|</span> {p.size || 'TBD'}
                        </div>

                        {/* AMENITIES */}
                        <div className="md:hidden flex flex-col py-6 border-b gap-4">
                           <span className="text-[10px] uppercase tracking-widest text-gray-400">Amenities</span>
                           <div className="flex flex-wrap gap-2">
                              {p.amenities?.slice(0, 4).map(a => <span key={a} className="px-2 py-1 bg-gray-50 text-[8px] font-bold uppercase tracking-widest">{a}</span>)}
                           </div>
                        </div>
                        <div className="hidden md:block h-20 flex items-center border-b border-gray-100">
                           <div className="flex flex-wrap gap-2">
                              {p.amenities?.slice(0, 3).map(a => (
                                 <span key={a} className="text-[9px] font-bold uppercase tracking-widest text-gray-400 px-2 py-1 border border-gray-100">{a}</span>
                              ))}
                              {p.amenities && p.amenities.length > 3 && <span className="text-[9px] font-bold text-[#007EA7]">+{p.amenities.length - 3}</span>}
                           </div>
                        </div>

                        {/* COMPLETION */}
                        <div className="md:hidden flex justify-between py-6 border-b text-[10px] uppercase tracking-widest text-gray-400"><span>Completion</span><span className="text-gray-900 font-bold">{p.yearBuilt || 'TBD'}</span></div>
                        <div className="hidden md:block h-20 flex items-center border-b border-gray-100 text-[11px] font-bold tracking-widest uppercase text-gray-600">
                          {p.yearBuilt || 'Ready to Move'}
                        </div>

                        {/* STATUS */}
                        <div className="md:hidden flex justify-between py-6 border-b text-[10px] uppercase tracking-widest text-gray-400"><span>Status</span><span className="text-gray-900 font-bold">AVAILABLE</span></div>
                        <div className="hidden md:block h-20 flex items-center border-b border-gray-100 text-[11px] font-bold tracking-widest uppercase text-[#007EA7]">
                          AVAILABLE FOR VIEWING
                        </div>
                      </div>

                      <div className="pt-8">
                         <Link href={`/properties/${p.slug}`} className="block w-full py-5 bg-[#100B28] text-white text-center text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-[#007EA7] transition-all">
                            {t('view_details')}
                         </Link>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #100B28; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        * { border-radius: 0 !important; }
      `}</style>
    </div>
  );
}
