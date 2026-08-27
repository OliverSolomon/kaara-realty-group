import {
  PiSwimmingPool,
  PiBarbell,
  PiBuildings,
  PiPlant,
  PiElevator,
  PiLightning,
  PiDrop,
  PiSecurityCamera,
  PiBellRinging,
  PiCarSimple,
  PiHouseLine,
  PiCheck,
  PiShieldCheck,
  PiSun,
  PiWifiHigh,
  PiUsersThree,
  PiCouch,
  PiTree,
  PiWrench,
  PiSparkle,
} from "react-icons/pi";
import type { IconType } from "react-icons";
import {
  AMENITY_GROUPS,
  AMENITY_GROUP_OF,
  amenityLabel,
} from "@/sanity/schemaTypes/objects/amenityOptions";

/**
 * Amenities, grouped by category with an icon per item.
 *
 * Three kinds of value arrive here, because the vocabulary was expanded after
 * content already existed:
 *  · current values   — "utility-borehole" → grouped under Power, Water & Connectivity
 *  · legacy values    — "pool", "sq"       → mapped to a readable label
 *  · free-text extras — whatever the agent typed → shown under "Also included"
 *
 * Icons resolve most-specific first: an exact match, then the category icon,
 * then a tick. Nothing is ever dropped for being unrecognised.
 */

const OTHER_GROUP = "Also included";

/** Exact matches worth a distinctive icon. */
const ICONS: Record<string, IconType> = {
  // current vocabulary
  "leisure-pool": PiSwimmingPool,
  "leisure-kids-pool": PiSwimmingPool,
  "leisure-gym": PiBarbell,
  "community-rooftop": PiBuildings,
  "outdoor-private-garden": PiPlant,
  "access-lift": PiElevator,
  "access-service-lift": PiElevator,
  "utility-generator": PiLightning,
  "utility-three-phase": PiLightning,
  "utility-borehole": PiDrop,
  "utility-water-tanks": PiDrop,
  "utility-solar-power": PiSun,
  "utility-solar-water": PiSun,
  "utility-fibre": PiWifiHigh,
  "security-cctv": PiSecurityCamera,
  "security-manned": PiShieldCheck,
  "security-alarm": PiBellRinging,
  "service-concierge": PiBellRinging,
  "access-covered-parking": PiCarSimple,
  "access-ample-parking": PiCarSimple,
  "outdoor-dsq": PiHouseLine,
  // legacy vocabulary, kept so existing listings keep their icons
  pool: PiSwimmingPool,
  gym: PiBarbell,
  rooftop: PiBuildings,
  garden: PiPlant,
  elevator: PiElevator,
  generator: PiLightning,
  borehole: PiDrop,
  security: PiSecurityCamera,
  concierge: PiBellRinging,
  parking: PiCarSimple,
  sq: PiHouseLine,
};

/** Fallback by category, so a new amenity still gets a sensible glyph. */
const GROUP_ICONS: Record<string, IconType> = {
  Security: PiShieldCheck,
  "Power, Water & Connectivity": PiLightning,
  "Parking & Access": PiCarSimple,
  "Wellness & Leisure": PiBarbell,
  "Community & Family": PiUsersThree,
  "Inside the Home": PiCouch,
  "Grounds & Outbuildings": PiTree,
  Services: PiWrench,
  [OTHER_GROUP]: PiSparkle,
};

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
    const group = AMENITY_GROUP_OF[value] ?? OTHER_GROUP;
    push(group, {
      key: value,
      label: amenityLabel(value),
      Icon: ICONS[value] ?? GROUP_ICONS[group] ?? PiCheck,
    });
  }

  for (const [i, extra] of extras.entries()) {
    push(OTHER_GROUP, { key: `extra-${i}`, label: extra, Icon: PiSparkle });
  }

  const orderedGroups = [
    ...AMENITY_GROUPS.map((g) => g.group).filter((g) => buckets.has(g)),
    ...(buckets.has(OTHER_GROUP) ? [OTHER_GROUP] : []),
  ];

  return (
    <div className={className}>
      <div className="space-y-12">
        {orderedGroups.map((group) => (
          <div key={group}>
            <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
              {group}
            </p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {(buckets.get(group) ?? []).map(({ key, label, Icon }) => (
                <li key={key} className="flex flex-col gap-3">
                  <Icon size={26} className="text-[#4f9d8f]" aria-hidden="true" />
                  <span className="text-sm text-white/75">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
