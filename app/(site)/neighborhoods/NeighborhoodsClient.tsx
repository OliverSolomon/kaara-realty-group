"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { Map as MapIcon, Grid, List as ListIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { extractCoordsFromGoogleMapsUrl, getCoordsBySearch } from "@/lib/geocoding";

const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50 animate-pulse flex items-center justify-center text-gray-400 uppercase tracking-[0.3em] text-[10px]">Initializing Map...</div>
});

interface NeighborhoodsClientProps {
  neighborhoods: any[];
  settings: any;
}

export default function NeighborhoodsClient({ neighborhoods, settings }: NeighborhoodsClientProps) {
  const { t } = useLanguage();
  const [activeNeighborhoodId, setActiveNeighborhoodId] = useState<string | null>(null);

  const processedNeighborhoods = useMemo(() => {
    return neighborhoods.map(n => ({
      ...n,
      properties: n.properties.map((p: any) => {
        let coords = p.googleMapsUrl ? extractCoordsFromGoogleMapsUrl(p.googleMapsUrl) : null;
        if (!coords) coords = getCoordsBySearch(p.title, n.name, p.county);
        return {
          ...p,
          district: {
            name: n.name,
            boundary: n.boundary
          },
          coords
        };
      })
    }));
  }, [neighborhoods]);

  const allProperties = useMemo(() => {
    const flattened = processedNeighborhoods.flatMap(n => n.properties);
    console.log("🏙️ [Neighborhood Debug] Processed Neighborhoods:", processedNeighborhoods);
    console.log("🏠 [Neighborhood Debug] Flattened Properties:", flattened);
    return flattened;
  }, [processedNeighborhoods]);

  const displayedProperties = useMemo(() => {
    if (activeNeighborhoodId) {
      const activeDistrict = processedNeighborhoods.find(n => n._id === activeNeighborhoodId);
      return activeDistrict ? activeDistrict.properties : [];
    }
    return allProperties;
  }, [activeNeighborhoodId, processedNeighborhoods, allProperties]);

  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#100B28]">
      <Navbar settings={settings} />

      <div className="pt-20 flex flex-col lg:flex-row lg:h-[calc(100vh-80px)]">
        {/* Left Sidebar: Neighborhood List */}
        <div className="w-full lg:w-[400px] xl:w-[450px] border-r border-gray-100 flex flex-col h-full bg-white z-10 overflow-y-auto no-scrollbar">
          <div className="p-8 lg:p-12 space-y-12">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-serif tracking-tight uppercase leading-none">Districts</h1>
              <p className="text-[10px] font-bold tracking-[0.4em] text-gray-400 uppercase">A Curated Neighborhood Guide</p>
            </div>

            <div className="space-y-1">
              {processedNeighborhoods.map((n) => (
                <button 
                  key={n._id}
                  onClick={() => setActiveNeighborhoodId(activeNeighborhoodId === n._id ? null : n._id)}
                  className={cn(
                    "w-full group flex items-center justify-between py-6 border-b transition-all text-left",
                    activeNeighborhoodId === n._id ? "border-[#007EA7]" : "border-gray-50 hover:border-gray-200"
                  )}
                >
                  <div className="space-y-1">
                    <h3 className={cn(
                      "text-lg font-serif uppercase tracking-tight transition-colors",
                      activeNeighborhoodId === n._id ? "text-[#007EA7]" : "group-hover:text-[#007EA7]"
                    )}>{n.name}</h3>
                    <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">{n.properties.length} Active Listings</p>
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-full border flex items-center justify-center transition-all",
                    activeNeighborhoodId === n._id ? "bg-[#100B28] text-white border-[#100B28]" : "border-gray-100 group-hover:bg-[#100B28] group-hover:text-white"
                  )}>
                    <Grid size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Map View */}
        <div className="flex-grow h-[500px] lg:h-full relative bg-gray-50">
          <PropertyMap properties={displayedProperties} activePropertyId={activePropertyId} />
          
          {/* Map Overlay Controls */}
          <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
             <div className="bg-white p-4 shadow-xl border border-gray-100 space-y-3">
                <p className="text-[8px] font-bold tracking-widest text-gray-400 uppercase">Legend</p>
                <div className="space-y-2">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#007EA7] rounded-full" />
                      <span className="text-[9px] font-bold tracking-widest uppercase">Property Pin</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-4 h-1 border-t-2 border-dashed border-[#007EA7]" />
                      <span className="text-[9px] font-bold tracking-widest uppercase">District Boundary</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-marker { background: transparent !important; border: none !important; }
      `}</style>
    </div>
  );
}
