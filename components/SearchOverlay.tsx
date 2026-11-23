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
    bedrooms?: number | null;
    slug: string;
    imageUrl: string;
  }[];
}

/** The CMS holds some districts twice, so one place must not appear as two. */
function mergeDistricts(districts: DistrictData[]) {
  const byName = new Map<string, DistrictData>();
  for (const district of districts) {
    const key = district.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (existing) existing.properties = [...existing.properties, ...district.properties];
    else byName.set(key, { ...district, properties: [...district.properties] });
  }
  return [...byName.values()]
    .filter((district) => district.properties.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

const unitLabel = (property: DistrictData["properties"][number]) =>
  property.bedrooms ? `${property.title} · ${property.bedrooms} bed` : property.title;

export default function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [data, setData] = useState<DistrictData[]>([]);
  const [activeDistrictIdx, setActiveDistrictIdx] = useState(0);
  const [activePropertyIdx, setActivePropertyIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    client.fetch(SEARCH_QUERY).then((rows) => setData(mergeDistricts(rows as DistrictData[])));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeDistrict = data[activeDistrictIdx];
  const activeProperty = activeDistrict?.properties[activePropertyIdx];
  const selectDistrict = (idx: number) => {
    setActiveDistrictIdx(idx);
    setActivePropertyIdx(0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("search")}
      className="fixed inset-0 z-[3000] flex items-center justify-center lg:p-4"
    >
      <div
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-500"
        onClick={onClose}
      />

      <div className="relative flex h-dvh w-full max-w-5xl flex-col overflow-y-auto overscroll-contain border-white/5 bg-[#100b28] pb-[env(safe-area-inset-bottom)] shadow-2xl animate-in zoom-in-95 duration-300 lg:block lg:h-auto lg:overflow-hidden lg:border lg:bg-[#000B1D]/95 lg:pb-0">
        <div className="sticky top-0 z-40 flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 bg-[#100b28] px-5 lg:hidden">
          <span className="font-serif text-lg text-[#efebe3]">{t("search")}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="press fixed right-2 top-3.5 z-50 flex h-11 w-11 items-center justify-center text-white/70 transition-colors hover:text-white lg:absolute lg:right-4 lg:top-4"
        >
          <X size={24} />
        </button>

        <div className="grid flex-1 grid-cols-1 content-start lg:min-h-[600px] lg:grid-cols-12 lg:content-stretch">
          {/* Districts: a swipeable row on phones, a column on desktop */}
          <div className="min-w-0 border-white/5 px-5 pb-2 pt-6 lg:col-span-4 lg:space-y-8 lg:border-r lg:p-12">
            <div className="mb-4 space-y-2 lg:mb-0">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 lg:tracking-[0.4em]">
                {t("discover")} DISTRICTS
              </h3>
              <div className="h-px w-8 bg-[#4f9d8f]" />
            </div>

            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:block lg:space-y-4 lg:overflow-visible lg:px-0">
              {data.map((district, idx) => (
                <button
                  key={district._id}
                  type="button"
                  onClick={() => selectDistrict(idx)}
                  onMouseEnter={() => selectDistrict(idx)}
                  aria-pressed={activeDistrictIdx === idx}
                  className={cn(
                    "group flex min-h-11 shrink-0 items-center justify-between border px-4 text-left transition-colors lg:min-h-0 lg:w-full lg:border-0 lg:px-0",
                    activeDistrictIdx === idx
                      ? "border-[#4f9d8f] bg-[#2e7d6f]/15 text-white lg:bg-transparent"
                      : "border-white/15 text-white/60 hover:text-white/80"
                  )}
                >
                  <span className="whitespace-nowrap font-serif text-xs uppercase tracking-widest lg:text-sm">
                    {district.name}
                  </span>
                  <ChevronRight
                    size={14}
                    className={cn(
                      "hidden transition-transform lg:block",
                      activeDistrictIdx === idx
                        ? "translate-x-0"
                        : "-translate-x-2 opacity-0 group-hover:opacity-100"
                    )}
                  />
                </button>
              ))}
            </div>

            <div className="hidden border-t border-white/5 pt-8 lg:block">
              <Link
                href="/properties"
                onClick={onClose}
                className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#4f9d8f] hover:underline"
              >
                VIEW ALL {t("properties")}
              </Link>
            </div>
          </div>

          {/* Property names */}
          <div className="min-w-0 border-white/5 px-5 py-6 lg:col-span-4 lg:space-y-8 lg:border-r lg:bg-black/20 lg:p-12">
            <div className="mb-3 space-y-2 lg:mb-0">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 lg:tracking-[0.4em]">
                PREMIER ASSETS
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-white/40">
                {activeDistrict?.name}
              </p>
            </div>

            <div className="no-scrollbar lg:max-h-[400px] lg:space-y-4 lg:overflow-y-auto">
              {activeDistrict?.properties.map((property, idx) => (
                <Link
                  key={property._id}
                  href={`/properties/${encodeURIComponent(property.slug)}`}
                  onClick={onClose}
                  onMouseEnter={() => setActivePropertyIdx(idx)}
                  className={cn(
                    "flex items-center gap-4 border-b border-white/10 py-3 text-left transition-colors lg:block lg:border-0 lg:py-0",
                    activePropertyIdx === idx
                      ? "lg:text-white"
                      : "lg:text-white/40 lg:hover:text-white/60"
                  )}
                >
                  <span className="relative h-14 w-20 shrink-0 overflow-hidden bg-[#171232] lg:hidden">
                    {property.imageUrl && (
                      <Image
                        src={property.imageUrl}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 text-xs font-bold uppercase leading-relaxed tracking-widest">
                    {unitLabel(property)}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-white/35 lg:hidden" />
                </Link>
              ))}

              {activeDistrict && (
                <Link
                  href={`/properties?search=${encodeURIComponent(activeDistrict.name)}`}
                  onClick={onClose}
                  className="block py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-[#4f9d8f] hover:underline lg:pb-0 lg:text-[9px] lg:tracking-[0.3em]"
                >
                  ALL {activeDistrict.name} LISTINGS
                </Link>
              )}

              <Link
                href="/properties"
                onClick={onClose}
                className="mt-2 flex min-h-12 items-center justify-center border border-white/20 text-[10px] font-bold uppercase tracking-[0.25em] text-[#efebe3] lg:hidden"
              >
                VIEW ALL {t("properties")}
              </Link>
            </div>
          </div>

          {/* Property photo: desktop preview only, phones get row thumbnails */}
          <div className="group relative hidden overflow-hidden lg:col-span-4 lg:block">
            {activeProperty ? (
              <>
                <Image
                  src={activeProperty.imageUrl}
                  alt={activeProperty.title}
                  fill
                  sizes="340px"
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000B1D] via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-8 left-8 right-8 space-y-2">
                  <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/60">FEATURED RESIDENCE</p>
                  <h4 className="font-serif text-xl uppercase tracking-tight text-white">{activeProperty.title}</h4>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#000B1D]">
                <SearchIcon size={48} className="text-white/5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
