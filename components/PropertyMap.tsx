"use client";

import { useEffect, useState, useId, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Property {
  _id: string;
  title: string;
  price: string;
  coords?: { lat: number; lng: number } | null;
  imageUrl?: string;
  district?: {
    name: string;
    boundary?: { lat: number; lng: number }[];
  } | string;
}

const BOUNDARY_FALLBACKS: Record<string, { lat: number; lng: number }[]> = {
  "KILELESHWA": [
    { lat: -1.275, lng: 36.775 }, { lat: -1.275, lng: 36.795 }, { lat: -1.290, lng: 36.795 }, { lat: -1.290, lng: 36.775 }
  ],
  "KILLESHWA": [
    { lat: -1.275, lng: 36.775 }, { lat: -1.275, lng: 36.795 }, { lat: -1.290, lng: 36.795 }, { lat: -1.290, lng: 36.775 }
  ],
  "UPPER HILL": [
    { lat: -1.290, lng: 36.810 }, { lat: -1.290, lng: 36.830 }, { lat: -1.310, lng: 36.830 }, { lat: -1.310, lng: 36.810 }
  ],
  "KILIMANI": [
    { lat: -1.285, lng: 36.775 }, { lat: -1.285, lng: 36.795 }, { lat: -1.305, lng: 36.795 }, { lat: -1.305, lng: 36.775 }
  ],
  "WESTLANDS": [
    { lat: -1.255, lng: 36.790 }, { lat: -1.255, lng: 36.810 }, { lat: -1.275, lng: 36.810 }, { lat: -1.275, lng: 36.790 }
  ],
  "LAVINGTON": [
    { lat: -1.270, lng: 36.760 }, { lat: -1.270, lng: 36.780 }, { lat: -1.285, lng: 36.780 }, { lat: -1.285, lng: 36.760 }
  ],
  "KAREN": [
    { lat: -1.300, lng: 36.680 }, { lat: -1.300, lng: 36.720 }, { lat: -1.340, lng: 36.720 }, { lat: -1.340, lng: 36.680 }
  ],
  "MUTHAIGA": [
    { lat: -1.240, lng: 36.820 }, { lat: -1.240, lng: 36.845 }, { lat: -1.260, lng: 36.845 }, { lat: -1.260, lng: 36.820 }
  ],
  "GIGIRI": [
    { lat: -1.220, lng: 36.800 }, { lat: -1.220, lng: 36.830 }, { lat: -1.245, lng: 36.830 }, { lat: -1.245, lng: 36.800 }
  ]
};

interface PropertyMapProps {
  properties: Property[];
  activePropertyId?: string | null;
  center?: [number, number];
  zoom?: number;
}

// Inner component to access map instance via useMap hook
function MapLayers({ properties, center, zoom, activePropertyId }: { properties: Property[]; center: [number, number]; zoom: number; activePropertyId?: string | null }) {
  const map = useMap();
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    if (isReady && map && properties.length > 0) {
      const allPoints: [number, number][] = [];
      properties.forEach(p => {
        if (p.coords) allPoints.push([p.coords.lat, p.coords.lng]);
        if (typeof p.district === 'object' && p.district.boundary) {
          p.district.boundary.forEach(b => allPoints.push([b.lat, b.lng]));
        }
      });

      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        console.log("📍 [Map Debug] Calculated Bounds:", bounds.toBBoxString());
        console.log("📍 [Map Debug] Total Points:", allPoints.length);
        console.log("📍 [Map Debug] Active Points:", allPoints);
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      } else {
        console.warn("📍 [Map Debug] No valid coordinates found for the current properties.");
      }
    }
  }, [isReady, map, properties]);

  useEffect(() => {
    mountedRef.current = true;
    if (!map) return;

    const checkMapState = () => {
      if (!mountedRef.current) return;
      
      try {
        // LEAFLET PANES CHECK: This is the critical step to prevent "getPane is undefined"
        const tilePane = map.getPane('tilePane');
        const markerPane = map.getPane('markerPane');
        const container = map.getContainer();

        if (!tilePane || !markerPane || !container || !document.body.contains(container)) {
          requestAnimationFrame(checkMapState);
          return;
        }

        // Camera Update
        if (center) {
          map.setView(center, zoom, { animate: false });
        }
        
        // Final Stabilizer
        setTimeout(() => {
          if (!mountedRef.current) return;
          map.invalidateSize();
          setIsReady(true);
        }, 400);

      } catch (err) {
        requestAnimationFrame(checkMapState);
      }
    };

    map.whenReady(checkMapState);

    return () => {
      mountedRef.current = false;
    };
  }, [center, zoom, map]);

  // Editorial Blue Circular Marker
  const createEditorialIcon = (index: number, isActive: boolean) => {
    const bgColor = "#007EA7"; 
    const scale = isActive ? "scale(1.25)" : "scale(1)";
    const shadow = isActive ? "0 0 25px rgba(0, 126, 167, 0.6)" : "0 4px 12px rgba(0,0,0,0.4)";
    const border = isActive ? "3px solid white" : "2px solid white";
    
    return L.divIcon({
      className: 'editorial-marker-container',
      html: `
        <div style="
          width: 32px; 
          height: 32px; 
          background-color: ${bgColor}; 
          border: ${border}; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          box-shadow: ${shadow}; 
          transform: ${scale};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 99999;
          position: relative;
        ">
          <span style="
            color: white; 
            font-family: sans-serif; 
            font-size: 11px; 
            font-weight: 900; 
            letter-spacing: -0.05em;
          ">${index + 1}</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Critical check for Leaflet panes to prevent "appendChild of undefined"
  useEffect(() => {
    if (!map) return;
    
    let timer: NodeJS.Timeout;
    const verifyPanes = () => {
      try {
        const panes = (map as any)._panes;
        if (panes && panes.tilePane && panes.markerPane) {
          setIsReady(true);
        } else {
          timer = setTimeout(verifyPanes, 50);
        }
      } catch (e) {
        timer = setTimeout(verifyPanes, 50);
      }
    };

    verifyPanes();
    return () => clearTimeout(timer);
  }, [map]);

  if (!isReady) return null;

  return (
    <>
      {/* District Boundaries */}
      {Array.from(new Set(properties.map(p => typeof p.district === 'object' ? p.district.name : p.district))).map(districtName => {
        const propWithDistrict = properties.find(p => typeof p.district === 'object' && p.district.name === districtName);
        const districtObj = propWithDistrict?.district as any;
        
        // Use Sanity boundary or fallback to hardcoded boundaries
        let boundary = (districtObj?.boundary && districtObj.boundary.length >= 3) 
          ? districtObj.boundary 
          : (districtName ? BOUNDARY_FALLBACKS[districtName.toUpperCase()] : null);
          
        // Dynamic Bounding Polygon Fallback
        if (!boundary || boundary.length < 3) {
          const districtProps = properties.filter(p => {
             const dName = typeof p.district === 'object' ? p.district.name : p.district;
             return dName === districtName && p.coords;
          });
          
          if (districtProps.length > 0) {
            const lats = districtProps.map(p => p.coords!.lat);
            const lngs = districtProps.map(p => p.coords!.lng);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            
            // Add ~500m padding (0.005 degrees)
            const pad = 0.005;
            boundary = [
              { lat: minLat - pad, lng: minLng - pad },
              { lat: maxLat + pad, lng: minLng - pad },
              { lat: maxLat + pad, lng: maxLng + pad },
              { lat: minLat - pad, lng: maxLng + pad }
            ];
          }
        }
        
        if (!boundary || boundary.length < 3) return null;
        
        return (
          <Polygon
            key={`boundary-${districtName}`}
            positions={boundary.map((b: any) => [b.lat, b.lng] as [number, number])}
            pathOptions={{
              color: '#1A1A2E',
              fillColor: '#8E94A3',
              fillOpacity: 0.15,
              weight: 2,
            }}
          >
            <Popup>
              <div className="p-2 font-serif uppercase tracking-widest text-[9px]">
                <strong>{districtName}</strong>
              </div>
            </Popup>
          </Polygon>
        );
      })}

      {properties.map((property, idx) => {
        if (!property.coords) return null;
        const isActive = property._id === activePropertyId;
        const districtName = typeof property.district === 'object' ? property.district.name : property.district;
        
        return (
          <Marker 
            key={`${property._id}-${idx}`} 
            position={[property.coords.lat, property.coords.lng]}
            icon={createEditorialIcon(idx, isActive)}
            zIndexOffset={isActive ? 15000 : 10000}
          >
            <Popup className="property-popup">
              <div style={{ padding: '12px', minWidth: '220px', fontFamily: 'serif' }}>
                {property.imageUrl && property.imageUrl !== "" && (
                  <div style={{ position: 'relative', height: '112px', width: '100%', marginBottom: '12px', overflow: 'hidden' }}>
                    <img src={property.imageUrl} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <h3 style={{ textTransform: 'uppercase', fontSize: '14px', marginBottom: '4px', letterSpacing: '-0.02em' }}>{property.title}</h3>
                <p style={{ textTransform: 'uppercase', fontSize: '9px', color: '#666', letterSpacing: '0.1em', marginBottom: '8px' }}>{districtName}</p>
                <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#007EA7', fontFamily: 'sans-serif' }}>{property.price}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function PropertyMap({ properties, activePropertyId, center = [-1.2921, 36.8219], zoom = 12 }: PropertyMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const mapId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    
    return () => {
      setIsMounted(false);
      // Clean up Leaflet metadata from DOM element to prevent "Map container is being reused"
      if (containerRef.current) {
        const containers = containerRef.current.querySelectorAll('.leaflet-container');
        containers.forEach(c => {
          (c as any)._leaflet_id = null;
        });
      }
    };
  }, []);

  if (!isMounted) return <div className="w-full h-full bg-[#100B28]/10 animate-pulse" />;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden" id={`map-frame-${mapId}`}>
      <MapContainer
        key={`map-v1-${mapId}`} 
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapLayers properties={properties} center={center} zoom={zoom} activePropertyId={activePropertyId} />
      </MapContainer>

      <style jsx global>{`
        .editorial-marker-container {
          background: transparent !important;
          border: none !important;
          z-index: 99999 !important;
          overflow: visible !important;
        }
        .property-popup .leaflet-popup-content-wrapper {
          border-radius: 0 !important;
          padding: 0 !important;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
        }
        .property-popup .leaflet-popup-tip {
          background: white;
        }
        .leaflet-marker-pane {
          z-index: 6000 !important;
        }
        .leaflet-tile-pane {
          z-index: 2000 !important;
        }
      `}</style>
    </div>
  );
}
