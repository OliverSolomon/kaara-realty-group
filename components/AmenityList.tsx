import {
  AMENITY_GROUPS,
  AMENITY_GROUP_OF,
  amenityLabel,
  canonicalAmenity,
} from "@/sanity/schemaTypes/objects/amenityOptions";
import type { IconType } from "react-icons";
import {
  EXTRA_AMENITY_ICON,
  OTHER_AMENITY_GROUP,
  amenityIcon,
} from "@/lib/amenityIcons";

/**
 * Renders a property's amenities grouped by category, each with its icon.
 *
 * Handles three kinds of value at once, which matters because the vocabulary
 * was expanded after content already existed:
 *  · current values   — "security-manned" → grouped under Security
 *  · legacy values    — "pool", "sq"      → mapped to a readable label
 *  · free-text extras — whatever the agent typed → shown under "Also included"
 *
 * Nothing is dropped. An unrecognised value still renders using its raw text
 * rather than silently disappearing from the listing.
 */

interface AmenityListProps {
  amenities?: string[];
  otherAmenities?: string[];
  className?: string;
}

interface Entry {
  label: string;
  Icon: IconType;
}

export default function AmenityList({ amenities, otherAmenities, className }: AmenityListProps) {
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
    push(group, { label: amenityLabel(value), Icon: amenityIcon(value, group) });
  }
  for (const extra of extras) {
    push(OTHER_AMENITY_GROUP, { label: extra, Icon: EXTRA_AMENITY_ICON });
  }

  // Canonical schema order, with free-text extras always last.
  const orderedGroups = [
    ...AMENITY_GROUPS.map((g) => g.group).filter((g) => buckets.has(g)),
    ...(buckets.has(OTHER_AMENITY_GROUP) ? [OTHER_AMENITY_GROUP] : []),
  ];

  return (
    <div className={className}>
      <div className="amenity-groups">
        {orderedGroups.map((group) => (
          <div key={group} className="amenity-group">
            <p className="amenity-group-label">{group}</p>
            <div className="amenity-grid">
              {(buckets.get(group) ?? []).map(({ label, Icon }, i) => (
                <div key={`${group}-${i}`} className="amenity-item">
                  <Icon className="amenity-icon" aria-hidden="true" />
                  <span className="amenity-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
