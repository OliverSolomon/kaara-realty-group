import type { IconType } from "react-icons";
import {
  AMENITY_GROUPS,
  AMENITY_GROUP_OF,
  amenityLabel,
  canonicalAmenity,
} from "@/sanity/schemaTypes/objects/amenityOptions";
import {
  EXTRA_AMENITY_ICON,
  OTHER_AMENITY_GROUP,
  amenityIcon,
} from "@/lib/amenityIcons";

/**
 * Amenities, grouped by category with an icon per item.
 *
 * Three kinds of value arrive here, because the vocabulary was expanded after
 * content already existed:
 *  · current values   — "utility-borehole" → grouped under Power, Water & Connectivity
 *  · legacy values    — "pool", "sq"       → mapped to a readable label
 *  · free-text extras — whatever the agent typed → shown under "Also included"
 *
 * Icons live in lib/amenityIcons.ts. Nothing is ever dropped for being
 * unrecognised.
 *
 * Two layouts:
 *  · "grouped" (default, listing pages): category headings with compact rows
 *    in columns capped at 13rem.
 *  · "flow" (Buy and Stay overview sections): one ungrouped run of icon
 *    tiles that fills the width and wraps, so a handful of amenities reads
 *    across the page instead of down it. Tiles size to their label, so the
 *    run works on folded cover screens, phones, tablets and desktop alike.
 */

interface AmenityGridProps {
  amenities?: string[];
  otherAmenities?: string[];
  className?: string;
  variant?: "grouped" | "flow";
}

interface Entry {
  key: string;
  label: string;
  Icon: IconType;
}

export default function AmenityGrid({
  amenities,
  otherAmenities,
  className = "",
  variant = "grouped",
}: AmenityGridProps) {
  const selected = (amenities ?? []).filter(Boolean);
  const extras = (otherAmenities ?? []).filter(Boolean);
  if (selected.length === 0 && extras.length === 0) return null;

  const buckets = new Map<string, Entry[]>();
  const push = (group: string, entry: Entry) => {
    const list = buckets.get(group);
    if (list) list.push(entry);
    else buckets.set(group, [entry]);
  };

  // Legacy and current values can both be stored for the same amenity.
  const seen = new Set<string>();
  for (const value of selected) {
    const canonical = canonicalAmenity(value);
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    const group = AMENITY_GROUP_OF[value] ?? OTHER_AMENITY_GROUP;
    push(group, {
      key: canonical,
      label: amenityLabel(value),
      Icon: amenityIcon(value, group),
    });
  }

  for (const [i, extra] of extras.entries()) {
    push(OTHER_AMENITY_GROUP, { key: `extra-${i}`, label: extra, Icon: EXTRA_AMENITY_ICON });
  }

  const orderedGroups = [
    ...AMENITY_GROUPS.map((g) => g.group).filter((g) => buckets.has(g)),
    ...(buckets.has(OTHER_AMENITY_GROUP) ? [OTHER_AMENITY_GROUP] : []),
  ];

  if (variant === "flow") {
    const entries = orderedGroups.flatMap((group) => buckets.get(group) ?? []);
    return (
      <ul className={`flex flex-wrap gap-2 sm:gap-3 ${className}`}>
        {entries.map(({ key, label, Icon }) => (
          <li
            key={key}
            className="flex min-w-0 max-w-full items-center gap-2.5 border border-white/10 bg-white/[0.03] px-3.5 py-2.5 sm:gap-3 sm:px-5 sm:py-3.5"
          >
            <Icon className="h-[18px] w-[18px] shrink-0 text-[#4f9d8f] sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="text-[13px] leading-snug text-white/80 sm:text-sm">{label}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {orderedGroups.map((group) => (
          <div key={group}>
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
              {group}
            </p>
            <ul className="grid grid-cols-1 gap-x-3 gap-y-2 min-[360px]:grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(10rem,13rem))]">
              {(buckets.get(group) ?? []).map(({ key, label, Icon }) => (
                <li key={key} className="flex items-center gap-2.5 py-1">
                  <Icon size={20} className="shrink-0 text-[#4f9d8f]" aria-hidden="true" />
                  <span className="text-sm leading-snug text-white/75">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
