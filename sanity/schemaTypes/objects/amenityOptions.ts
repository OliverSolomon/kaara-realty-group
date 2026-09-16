/**
 * Amenity vocabulary.
 *
 * Built from how listings are described internationally (the RESO Data
 * Dictionary splits amenities into Security, Community, Interior, Exterior and
 * Utilities groups) combined with what actually sells property in East Africa —
 * where power, water and security resilience are headline features rather than
 * afterthoughts. Borehole, DSQ, backup generator, solar water heating and
 * electric fencing appear on nearly every serious Nairobi listing.
 *
 * Titles are prefixed with their group so the flat Studio checklist still reads
 * as grouped. Values stay short and stable — never rename a value once content
 * references it, or existing properties will silently lose that amenity.
 * Titles, on the other hand, are safe to reword: "Mini Mart" still stores the
 * original 'community-store' value, so older listings pick up the new label.
 */

export interface AmenityOption {
  title: string
  value: string
}

export const AMENITY_GROUPS: { group: string; items: AmenityOption[] }[] = [
  {
    group: 'Security',
    items: [
      { title: '24/7 Manned Security', value: 'security-manned' },
      { title: 'CCTV Surveillance', value: 'security-cctv' },
      { title: 'Electric Perimeter Fence', value: 'security-electric-fence' },
      { title: 'Gated Community', value: 'security-gated-community' },
      { title: 'Controlled Access / Boom Gate', value: 'security-controlled-access' },
      { title: 'Perimeter Wall', value: 'security-perimeter-wall' },
      { title: 'Video Intercom', value: 'security-intercom' },
      { title: 'Alarm & Panic Button', value: 'security-alarm' },
    ],
  },
  {
    group: 'Power, Water & Connectivity',
    items: [
      { title: 'Borehole', value: 'utility-borehole' },
      { title: 'Underground Water Storage Tanks', value: 'utility-water-tanks' },
      { title: 'Backup Generator', value: 'utility-generator' },
      { title: 'Solar Water Heating', value: 'utility-solar-water' },
      { title: 'Solar Power / Inverter', value: 'utility-solar-power' },
      { title: 'Three-Phase Power', value: 'utility-three-phase' },
      { title: 'Fibre Internet Ready', value: 'utility-fibre' },
      { title: 'Borehole Water Treatment', value: 'utility-water-treatment' },
      { title: 'Mains Sewer Connection', value: 'utility-sewer' },
      { title: 'Prepaid Utility Meters', value: 'utility-prepaid-meters' },
    ],
  },
  {
    group: 'Parking & Access',
    items: [
      { title: 'Covered Parking', value: 'access-covered-parking' },
      { title: 'Ample Parking', value: 'access-ample-parking' },
      { title: 'Visitor Parking', value: 'access-visitor-parking' },
      { title: 'EV Charging Point', value: 'access-ev-charging' },
      { title: 'Passenger Lift', value: 'access-lift' },
      { title: 'Service Lift', value: 'access-service-lift' },
      { title: 'Wheelchair Access', value: 'access-wheelchair' },
      { title: 'Paved Driveway', value: 'access-paved-driveway' },
    ],
  },
  {
    group: 'Wellness & Leisure',
    items: [
      { title: 'Swimming Pool', value: 'leisure-pool' },
      { title: "Children's Pool", value: 'leisure-kids-pool' },
      { title: 'Gym / Fitness Centre', value: 'leisure-gym' },
      { title: 'Sauna Room', value: 'leisure-sauna' },
      { title: 'Steam Room', value: 'leisure-steam' },
      { title: 'Jacuzzi', value: 'leisure-jacuzzi' },
      { title: 'Spa', value: 'leisure-spa' },
      { title: 'Tennis Court', value: 'leisure-tennis' },
      { title: 'Squash Court', value: 'leisure-squash' },
      { title: 'Basketball Court', value: 'leisure-basketball' },
      { title: 'Jogging Track', value: 'leisure-jogging-track' },
      { title: 'Cinema Room', value: 'leisure-cinema' },
      { title: 'Games Room', value: 'leisure-games-room' },
    ],
  },
  {
    group: 'Community & Family',
    items: [
      { title: 'Clubhouse', value: 'community-clubhouse' },
      { title: 'Kids Play Area', value: 'community-play-area' },
      { title: 'Daycare / Creche', value: 'community-daycare' },
      { title: 'Business Centre / Co-working', value: 'community-business-centre' },
      { title: 'Event & Function Room', value: 'community-event-room' },
      { title: 'Communal Gardens', value: 'community-gardens' },
      { title: 'Barbecue Area', value: 'community-bbq' },
      { title: 'Rooftop Terrace', value: 'community-rooftop' },
      { title: 'Restaurant', value: 'community-restaurant' },
      { title: 'Mini Mart', value: 'community-store' },
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
      { title: 'Fitted Kitchen', value: 'interior-fitted-kitchen' },
      { title: 'Kitchen Island', value: 'interior-kitchen-island' },
      { title: 'Pantry', value: 'interior-pantry' },
      { title: 'Granite / Quartz Worktops', value: 'interior-stone-worktops' },
      { title: 'Air Conditioning', value: 'interior-air-conditioning' },
      { title: 'Underfloor Heating', value: 'interior-underfloor-heating' },
      { title: 'Fireplace', value: 'interior-fireplace' },
      { title: 'High Ceilings', value: 'interior-high-ceilings' },
      { title: 'Balcony', value: 'interior-balcony' },
      { title: 'Study / Home Office', value: 'interior-study' },
      { title: 'Laundry Room', value: 'interior-laundry' },
      { title: 'Smart Home System', value: 'interior-smart-home' },
      { title: 'Fully Furnished', value: 'interior-furnished' },
    ],
  },
  {
    group: 'Grounds & Outbuildings',
    items: [
      { title: 'Private Garden', value: 'outdoor-private-garden' },
      { title: 'Mature Trees / Landscaped', value: 'outdoor-landscaped' },
      { title: 'DSQ / Staff Quarters', value: 'outdoor-dsq' },
      { title: 'Gazebo', value: 'outdoor-gazebo' },
      { title: 'Kitchen Garden / Greenhouse', value: 'outdoor-kitchen-garden' },
      { title: 'Borehole Pump House', value: 'outdoor-pump-house' },
      { title: 'Guard House', value: 'outdoor-guard-house' },
      { title: 'Detached Garage', value: 'outdoor-garage' },
    ],
  },
  {
    group: 'Services',
    items: [
      { title: 'Concierge', value: 'service-concierge' },
      { title: 'Professional Property Management', value: 'service-management' },
      { title: 'Housekeeping Available', value: 'service-housekeeping' },
      { title: 'On-Site Maintenance', value: 'service-maintenance' },
      { title: 'Garbage Collection', value: 'service-garbage' },
      { title: 'Standby Water Bowser', value: 'service-water-bowser' },
      { title: 'Shuttle Service', value: 'service-shuttle' },
    ],
  },
]

/** Flat list for Sanity's `options.list`, group name kept as a visual prefix. */
export const AMENITY_OPTIONS: AmenityOption[] = AMENITY_GROUPS.flatMap(({ group, items }) =>
  items.map(({ title, value }) => ({ title: `${group} · ${title}`, value }))
)

/** value → plain title, for rendering on the website. */
export const AMENITY_LABELS: Record<string, string> = Object.fromEntries(
  AMENITY_GROUPS.flatMap(({ items }) => items.map(({ title, value }) => [value, title]))
)

/** value → group name, so the website can render amenities grouped. */
export const AMENITY_GROUP_OF: Record<string, string> = Object.fromEntries(
  AMENITY_GROUPS.flatMap(({ group, items }) => items.map(({ value }) => [value, group]))
)

/**
 * Legacy values used before the vocabulary was expanded. Kept so properties
 * saved under the old list keep rendering correctly without a data migration.
 */
export const LEGACY_AMENITY_LABELS: Record<string, string> = {
  pool: 'Swimming Pool',
  gym: 'Gym / Fitness Centre',
  rooftop: 'Rooftop Terrace',
  garden: 'Private Garden',
  elevator: 'Passenger Lift',
  generator: 'Backup Generator',
  borehole: 'Borehole',
  security: 'CCTV & Security',
  concierge: 'Concierge',
  parking: 'Parking',
  sq: 'DSQ / Staff Quarters',
}

/** Resolve any stored amenity value to a human label, old or new. */
export function amenityLabel(value: string): string {
  return AMENITY_LABELS[value] || LEGACY_AMENITY_LABELS[value] || value
}
