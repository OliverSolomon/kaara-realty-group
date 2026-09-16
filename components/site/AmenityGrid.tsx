import type { IconType } from "react-icons";
import {
  AMENITY_GROUPS,
  AMENITY_GROUP_OF,
  amenityLabel,
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
 * Layout: columns have a capped width (auto-fill, max 11rem) so a category
 * with three items sits together on the left instead of being stretched
 * across the full 1500px container.
 */

interface AmenityGridProps {
  amenities?: string[];
  otherAmenities?: string[];
  className?: string;
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

  for (const value of selected) {
    const group = AMENITY_GROUP_OF[value] ?? OTHER_AMENITY_GROUP;
    push(group, {
      key: value,
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

  return (
    <div className={className}>
      <div className="space-y-9">
        {orderedGroups.map((group) => (
          <div key={group}>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
              {group}
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(8.5rem,11rem))]">
              {(buckets.get(group) ?? []).map(({ key, label, Icon }) => (
                <li key={key} className="flex flex-col gap-2">
                  <Icon size={24} className="text-[#4f9d8f]" aria-hidden="true" />
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
