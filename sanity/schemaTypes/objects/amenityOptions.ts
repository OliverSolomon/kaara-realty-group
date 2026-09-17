/**
 * Amenity vocabulary.
 *
 * Covers what is advertised on residential and commercial listings across
 * Kenya and East Africa: the international RESO groupings (security,
 * community, interior, exterior, utilities) plus the features that sell
 * property here, where power, water and security resilience are headline
 * items. Borehole, DSQ, backup generator, solar water heating, electric
 * fencing and piped gas appear on nearly every serious Nairobi listing, and
 * coastal and lakeside stock is sold on views and beach access.
 *
 * The Studio shows this as a grouped checkbox matrix (see AmenitiesInput), so
 * titles are kept short and carry no group prefix.
 *
 * Values must never be renamed once content uses them, or listings silently
 * lose that amenity. Titles are safe to reword.
 */

export interface AmenityOption {
  title: string
  value: string
}

export interface AmenityGroup {
  group: string
  items: AmenityOption[]
}

export const AMENITY_GROUPS: AmenityGroup[] = [
  {
    group: 'Security & Safety',
    items: [
      { title: '24/7 Manned Security', value: 'security-manned' },
      { title: 'CCTV Surveillance', value: 'security-cctv' },
      { title: 'Electric Fence', value: 'security-electric-fence' },
      { title: 'Gated Community', value: 'security-gated-community' },
      { title: 'Controlled Access / Boom Gate', value: 'security-controlled-access' },
      { title: 'Perimeter Wall', value: 'security-perimeter-wall' },
      { title: 'Biometric / Card Access', value: 'security-biometric' },
      { title: 'Video Intercom', value: 'security-intercom' },
      { title: 'Alarm & Panic Button', value: 'security-alarm' },
      { title: 'Fire Alarm & Sprinklers', value: 'security-fire-system' },
      { title: 'Fire Extinguishers', value: 'security-fire-extinguishers' },
      { title: 'Smoke Detectors', value: 'security-smoke-detectors' },
      { title: 'Emergency Exits', value: 'security-emergency-exits' },
    ],
  },
  {
    group: 'Power, Water & Connectivity',
    items: [
      { title: 'Borehole', value: 'utility-borehole' },
      { title: 'Water Storage Tanks', value: 'utility-water-tanks' },
      { title: 'Borehole Water Treatment', value: 'utility-water-treatment' },
      { title: 'Rainwater Harvesting', value: 'utility-rainwater' },
      { title: 'Backup Generator', value: 'utility-generator' },
      { title: 'Solar Power / Inverter', value: 'utility-solar-power' },
      { title: 'Solar Water Heating', value: 'utility-solar-water' },
      { title: 'Three-Phase Power', value: 'utility-three-phase' },
      { title: 'Piped Gas', value: 'utility-piped-gas' },
      { title: 'Fibre Internet Ready', value: 'utility-fibre' },
      { title: 'Estate-Wide Wi-Fi', value: 'utility-wifi' },
      { title: 'DSTV / Satellite Ready', value: 'utility-satellite' },
      { title: 'Prepaid Utility Meters', value: 'utility-prepaid-meters' },
      { title: 'Mains Sewer Connection', value: 'utility-sewer' },
      { title: 'Septic Tank / Biodigester', value: 'utility-septic' },
    ],
  },
  {
    group: 'Parking & Access',
    items: [
      { title: 'Covered Parking', value: 'access-covered-parking' },
      { title: 'Basement Parking', value: 'access-basement-parking' },
      { title: 'Ample Parking', value: 'access-ample-parking' },
      { title: 'Visitor Parking', value: 'access-visitor-parking' },
      { title: 'EV Charging Point', value: 'access-ev-charging' },
      { title: 'Car Wash Bay', value: 'access-car-wash' },
      { title: 'Passenger Lift', value: 'access-lift' },
      { title: 'Service Lift', value: 'access-service-lift' },
      { title: 'Wheelchair Access', value: 'access-wheelchair' },
      { title: 'Paved Driveway', value: 'access-paved-driveway' },
      { title: 'Tarmac Access Road', value: 'access-tarmac-road' },
      { title: 'Street Lighting', value: 'access-street-lighting' },
    ],
  },
  {
    group: 'Wellness & Leisure',
    items: [
      { title: 'Swimming Pool', value: 'leisure-pool' },
      { title: 'Heated Pool', value: 'leisure-heated-pool' },
      { title: 'Rooftop / Infinity Pool', value: 'leisure-rooftop-pool' },
      { title: "Kids' Pool", value: 'leisure-kids-pool' },
      { title: 'Gym', value: 'leisure-gym' },
      { title: 'Yoga / Aerobics Studio', value: 'leisure-yoga' },
      { title: 'Sauna Room', value: 'leisure-sauna' },
      { title: 'Steam Room', value: 'leisure-steam' },
      { title: 'Jacuzzi', value: 'leisure-jacuzzi' },
      { title: 'Spa', value: 'leisure-spa' },
      { title: 'Cinema Room', value: 'leisure-cinema' },
      { title: 'Games Room', value: 'leisure-games-room' },
      { title: 'Tennis Court', value: 'leisure-tennis' },
      { title: 'Padel Court', value: 'leisure-padel' },
      { title: 'Squash Court', value: 'leisure-squash' },
      { title: 'Basketball Court', value: 'leisure-basketball' },
      { title: 'Football Pitch', value: 'leisure-football' },
      { title: 'Jogging / Cycling Track', value: 'leisure-jogging-track' },
      { title: 'Golf Course Access', value: 'leisure-golf' },
      { title: 'Sky Lounge / Bar', value: 'leisure-lounge' },
    ],
  },
  {
    group: 'Community & Family',
    items: [
      { title: 'Kids Play Area', value: 'community-play-area' },
      { title: 'Daycare / Creche', value: 'community-daycare' },
      { title: 'School Within Estate', value: 'community-school' },
      { title: 'Clubhouse', value: 'community-clubhouse' },
      { title: 'Restaurant', value: 'community-restaurant' },
      { title: 'Café', value: 'community-cafe' },
      { title: 'Mini Mart', value: 'community-store' },
      { title: 'Shopping Centre On Site', value: 'community-mall' },
      { title: 'Pharmacy / Clinic On Site', value: 'community-clinic' },
      { title: 'Co-working / Business Centre', value: 'community-business-centre' },
      { title: 'Event & Function Room', value: 'community-event-room' },
      { title: 'Communal Gardens', value: 'community-gardens' },
      { title: 'Barbecue Area', value: 'community-bbq' },
      { title: 'Rooftop Terrace', value: 'community-rooftop' },
      { title: 'Prayer Room', value: 'community-prayer-room' },
      { title: 'Pet Friendly', value: 'community-pet-friendly' },
    ],
  },
  {
    group: 'Inside the Home',
    items: [
      { title: 'All Bedrooms En-Suite', value: 'interior-all-ensuite' },
      { title: 'Master En-Suite', value: 'interior-master-ensuite' },
      { title: 'Walk-In Closet', value: 'interior-walk-in-closet' },
      { title: 'Built-In Wardrobes', value: 'interior-wardrobes' },
      { title: 'Open-Plan Living', value: 'interior-open-plan' },
      { title: 'Fitted Kitchen', value: 'interior-fitted-kitchen' },
      { title: 'Kitchen Island', value: 'interior-kitchen-island' },
      { title: 'Pantry', value: 'interior-pantry' },
      { title: 'Stone Worktops', value: 'interior-stone-worktops' },
      { title: 'Built-In Appliances', value: 'interior-appliances' },
      { title: 'Laundry Room', value: 'interior-laundry' },
      { title: 'Study / Home Office', value: 'interior-study' },
      { title: 'Family Room / TV Lounge', value: 'interior-family-room' },
      { title: 'Balcony', value: 'interior-balcony' },
      { title: 'Air Conditioning', value: 'interior-air-conditioning' },
      { title: 'Underfloor Heating', value: 'interior-underfloor-heating' },
      { title: 'Fireplace', value: 'interior-fireplace' },
      { title: 'High Ceilings', value: 'interior-high-ceilings' },
      { title: 'Floor-to-Ceiling Windows', value: 'interior-large-windows' },
      { title: 'Hardwood Floors', value: 'interior-hardwood-floors' },
      { title: 'Smart Home System', value: 'interior-smart-home' },
      { title: 'Instant Shower / Water Heater', value: 'interior-water-heater' },
      { title: 'Fully Furnished', value: 'interior-furnished' },
      { title: 'Serviced Apartment', value: 'interior-serviced' },
    ],
  },
  {
    group: 'Grounds, Outbuildings & Views',
    items: [
      { title: 'Private Garden', value: 'outdoor-private-garden' },
      { title: 'Landscaped Grounds', value: 'outdoor-landscaped' },
      { title: 'Private Pool', value: 'outdoor-private-pool' },
      { title: 'Outdoor Kitchen', value: 'outdoor-kitchen' },
      { title: 'Patio / Terrace', value: 'outdoor-patio' },
      { title: 'Gazebo', value: 'outdoor-gazebo' },
      { title: 'DSQ / Staff Quarters', value: 'outdoor-dsq' },
      { title: 'Guest House / Cottage', value: 'outdoor-guest-house' },
      { title: 'Kitchen Garden / Greenhouse', value: 'outdoor-kitchen-garden' },
      { title: 'Pump House', value: 'outdoor-pump-house' },
      { title: 'Guard House', value: 'outdoor-guard-house' },
      { title: 'Detached Garage', value: 'outdoor-garage' },
      { title: 'Store Room', value: 'outdoor-store-room' },
      { title: 'City View', value: 'view-city' },
      { title: 'Ocean / Lake View', value: 'view-water' },
      { title: 'Mountain / Valley View', value: 'view-mountain' },
      { title: 'Forest / Golf View', value: 'view-green' },
      { title: 'Beach Access', value: 'outdoor-beach-access' },
    ],
  },
  {
    group: 'Services & Terms',
    items: [
      { title: 'Concierge', value: 'service-concierge' },
      { title: 'Property Management', value: 'service-management' },
      { title: 'Housekeeping', value: 'service-housekeeping' },
      { title: 'On-Site Maintenance', value: 'service-maintenance' },
      { title: 'Garbage Collection', value: 'service-garbage' },
      { title: 'Water Bowser Standby', value: 'service-water-bowser' },
      { title: 'Shuttle Service', value: 'service-shuttle' },
      { title: 'Short-Let / Airbnb Allowed', value: 'service-short-let' },
      { title: 'Title Deed Ready', value: 'service-title-deed' },
      { title: 'Mortgage Approved', value: 'service-mortgage' },
    ],
  },
]

/** Flat list for Sanity's `options.list` and validation. */
export const AMENITY_OPTIONS: AmenityOption[] = AMENITY_GROUPS.flatMap(({ items }) => items)

/** value → plain title, for rendering on the website. */
export const AMENITY_LABELS: Record<string, string> = Object.fromEntries(
  AMENITY_OPTIONS.map(({ title, value }) => [value, title])
)

/**
 * Values used before the vocabulary was expanded, mapped to the current value
 * they mean. Existing listings still store these; the Studio shows them ticked
 * under the current item and replaces them the next time that box is changed.
 */
export const LEGACY_AMENITY_ALIASES: Record<string, string> = {
  pool: 'leisure-pool',
  gym: 'leisure-gym',
  rooftop: 'community-rooftop',
  garden: 'outdoor-private-garden',
  elevator: 'access-lift',
  generator: 'utility-generator',
  borehole: 'utility-borehole',
  security: 'security-manned',
  concierge: 'service-concierge',
  parking: 'access-ample-parking',
  sq: 'outdoor-dsq',
}

/** Resolve any stored value (current or legacy) to its current value. */
export function canonicalAmenity(value: string): string {
  return LEGACY_AMENITY_ALIASES[value] ?? value
}

/** value → group name, so the website can render amenities grouped. */
export const AMENITY_GROUP_OF: Record<string, string> = Object.fromEntries([
  ...AMENITY_GROUPS.flatMap(({ group, items }) => items.map(({ value }) => [value, group])),
  ...Object.entries(LEGACY_AMENITY_ALIASES).map(([legacy, current]) => [
    legacy,
    AMENITY_GROUPS.find((g) => g.items.some((i) => i.value === current))?.group,
  ]),
])

/** Legacy labels kept for code that still imports them. */
export const LEGACY_AMENITY_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY_AMENITY_ALIASES).map(([legacy, current]) => [legacy, AMENITY_LABELS[current]])
)

/** Resolve any stored amenity value to a human label, old, new or unknown. */
export function amenityLabel(value: string): string {
  const known = AMENITY_LABELS[canonicalAmenity(value)]
  if (known) return known
  return value
    .replace(/^(security|utility|access|leisure|community|interior|outdoor|service|view)-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
