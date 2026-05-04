"use client";

import { useEffect, useState, useId, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Property {
  _id: string;
  title: string;
  slug: string;
  price: any;
  imageUrl: string;
  district: string;
  coords?: { lat: number; lng: number } | null;
}

interface Neighborhood {
  _id: string;
  name: string;
  slug: string;
  boundary?: { lat: number; lng: number }[];
  properties: Property[];
}

interface NeighborhoodMapProps {
  neighborhoods: Neighborhood[];
  activeId?: string | null;
}

function MapLayers({ neighborhoods, activeId }: { neighborhoods: Neighborhood[]; activeId?: string | null }) {
  const map = useMap();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!map) return;
    
    let timer: NodeJS.Timeout;
    const verifyPanes = () => {
      if (!map) return;
      try {
        // Strict verification of Leaflet internal state
        const panes = (map as any)._panes;
        const container = map.getContainer();
        
        if (panes?.tilePane && panes?.markerPane && container && document.body.contains(container)) {
          // Double check with a small delay for extra stability in Next.js 16
          setTimeout(() => {
            setIsReady(true);
            map.invalidateSize();
          }, 100);
        } else {
          timer = setTimeout(verifyPanes, 100);
        }
      } catch (e) {
        timer = setTimeout(verifyPanes, 100);
      }
    };

    verifyPanes();
    return () => clearTimeout(timer);
  }, [map]);

  // Fit bounds on initial load if no activeId
  useEffect(() => {
    if (isReady && !activeId && map && neighborhoods.length > 0) {
      const allPoints: [number, number][] = [];
      neighborhoods.forEach(n => {
        if (n.boundary) n.boundary.forEach(b => allPoints.push([b.lat, b.lng]));
        n.properties.forEach(p => {
          if (p.coords) allPoints.push([p.coords.lat, p.coords.lng]);
        });
      });

      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    }
  }, [isReady, activeId, map, neighborhoods]);

  // Center on active neighborhood boundary
  useEffect(() => {
    if (activeId && map) {
      const activeN = neighborhoods.find(n => n._id === activeId);
      if (activeN?.boundary && activeN.boundary.length > 0) {
        const bounds = L.latLngBounds(activeN.boundary.map(b => [b.lat, b.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    }
  }, [activeId, map, neighborhoods]);

  const formatShortPrice = (price: any) => {
    try {
      if (!price) return "TBD";
      const amountStr = typeof price === 'object' ? price.amount : String(price);
      if (!amountStr) return "TBD";
      
      const amount = parseFloat(amountStr.replace(/[^0-9.]/g, ""));
      if (isNaN(amount)) return "TBD";
      
      if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K';
      return amount.toString();
    } catch (e) {
      return "TBD";
    }
  };

  const createPriceIcon = (price: any, isActive: boolean) => {
    const formatted = formatShortPrice(price);
    return L.divIcon({
      className: 'custom-price-marker',
      html: `
        <div style="
          min-width: 44px;
          height: 44px;
          background: #100B28;
          border: 2px solid ${isActive ? '#007EA7' : 'rgba(255,255,255,0.2)'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: sans-serif;
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 8px 16px rgba(0,0,0,0.4);
          transform: ${isActive ? 'scale(1.2)' : 'scale(1)'};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: ${isActive ? '9999' : '100'};
        ">
          ${formatted}
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  };

  if (!isReady) return null;

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {neighborhoods.map((n) => (
        <div key={n._id}>
          {/* Boundary Polygon */}
          {n.boundary && n.boundary.length > 2 && (
            <Polygon 
              positions={n.boundary.map(b => [b.lat, b.lng] as [number, number])}
              pathOptions={{
                color: '#100B28',
                fillColor: '#100B28',
                fillOpacity: activeId === n._id ? 0.15 : 0.05,
                weight: activeId === n._id ? 3 : 1.5,
                dashArray: activeId === n._id ? '' : '5, 10'
              }}
            >
              <Popup>
                <div className="p-3 font-serif uppercase tracking-widest text-[10px]">
                   <p className="text-gray-400 mb-1">DISTRICT</p>
                   <h4 className="text-lg tracking-tight mb-2">{n.name}</h4>
                   <p className="text-[#007EA7] font-bold">{n.properties.length} EXCLUSIVE ASSETS</p>
                </div>
              </Popup>
            </Polygon>
          )}

          {/* Property Pins - Show all if no activeId, or only active district's pins if selected */}
          {(!activeId || activeId === n._id) && n.properties.map((p) => {
            if (!p.coords) return null;
            return (
              <Marker 
                key={p._id} 
                position={[p.coords.lat, p.coords.lng]}
                icon={createPriceIcon(p.price, activeId === n._id)}
                zIndexOffset={activeId === n._id ? 1000 : 0}
              >
                <Popup>
                  <div className="w-56 font-sans">
                    <div className="relative h-32 mb-3 overflow-hidden">
                       <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.title} />
                       <div className="absolute top-2 left-2 bg-[#100B28] text-white px-2 py-1 text-[8px] font-bold tracking-widest uppercase">
                          {p.district}
                       </div>
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest leading-tight mb-2">{p.title}</h3>
                    <p className="text-[12px] text-[#007EA7] font-bold">
                       {typeof p.price === 'object' ? p.price.amount : p.price} {typeof p.price === 'object' ? p.price.currency : ''}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </div>
      ))}
    </>
  );
}

export default function NeighborhoodMap({ neighborhoods, activeId }: NeighborhoodMapProps) {
  const mapId = useId();
  
  return (
    <div className="w-full h-full relative" id={`neigh-map-${mapId}`}>
      <MapContainer
        center={[-1.2921, 36.8219]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <MapLayers neighborhoods={neighborhoods} activeId={activeId} />
      </MapContainer>

      <style jsx global>{`
        .custom-price-marker { background: transparent !important; border: none !important; }
      `}</style>
    </div>
  );
}
