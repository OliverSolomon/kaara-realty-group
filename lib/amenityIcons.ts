import {
  PiSwimmingPool, PiBarbell, PiBuildings, PiPlant, PiElevator, PiLightning, PiDrop,
  PiSecurityCamera, PiBellRinging, PiCarSimple, PiHouseLine, PiCheck, PiShieldCheck,
  PiSun, PiWifiHigh, PiUsersThree, PiCouch, PiTree, PiWrench, PiSparkle, PiThermometerHot,
  PiPuzzlePiece, PiFilmSlate, PiForkKnife, PiStorefront, PiBathtub, PiFlowerLotus,
  PiTennisBall, PiCourtBasketball, PiSneakerMove, PiGameController, PiBaby, PiBriefcase,
  PiConfetti, PiFireSimple, PiPawPrint, PiPlug, PiWheelchair, PiGarage, PiCoffee, PiWine,
  PiFirstAidKit, PiGraduationCap, PiFireExtinguisher, PiFingerprint, PiCloudRain, PiFlame,
  PiWaves, PiMountains, PiGolf, PiWashingMachine, PiOven, PiSnowflake, PiTelevision,
  PiLockKey, PiVideoCamera, PiPersonSimpleTaiChi, PiSoccerBall, PiDesk, PiBroom, PiSiren,
  PiWall, PiKey, PiSolarPanel, PiShoppingCart, PiTreePalm, PiCampfire, PiTrash, PiBus,
  PiTruck, PiBuildingApartment, PiMartini, PiArmchair, PiShower, PiLightbulb, PiCalendarCheck,
  PiBinoculars, PiHouse, PiPath, PiStairs, PiCookingPot, PiWarehouse, PiHandCoins,
  PiScroll, PiFlowerTulip, PiUmbrella, PiSquaresFour, PiWindowsLogo, PiToilet,
} from "react-icons/pi";
import type { IconType } from "react-icons";
import { canonicalAmenity } from "@/sanity/schemaTypes/objects/amenityOptions";

/**
 * One icon per amenity, shared by every component that lists amenities so a
 * new entry only has to be added here once.
 *
 * Lookup order: exact value (legacy values resolve to their current value
 * first), then the amenity's category, then a plain tick.
 */

export const OTHER_AMENITY_GROUP = "Also included";

const ICONS: Record<string, IconType> = {
  // Security & Safety
  "security-manned": PiShieldCheck,
  "security-cctv": PiSecurityCamera,
  "security-electric-fence": PiLightning,
  "security-gated-community": PiLockKey,
  "security-controlled-access": PiKey,
  "security-perimeter-wall": PiWall,
  "security-biometric": PiFingerprint,
  "security-intercom": PiVideoCamera,
  "security-alarm": PiSiren,
  "security-fire-system": PiFireExtinguisher,
  "security-fire-extinguishers": PiFireExtinguisher,
  "security-smoke-detectors": PiBellRinging,
  "security-emergency-exits": PiStairs,
  // Power, Water & Connectivity
  "utility-borehole": PiDrop,
  "utility-water-tanks": PiDrop,
  "utility-water-treatment": PiDrop,
  "utility-rainwater": PiCloudRain,
  "utility-generator": PiLightning,
  "utility-solar-power": PiSolarPanel,
  "utility-solar-water": PiSun,
  "utility-three-phase": PiLightning,
  "utility-piped-gas": PiFlame,
  "utility-fibre": PiWifiHigh,
  "utility-wifi": PiWifiHigh,
  "utility-satellite": PiTelevision,
  "utility-prepaid-meters": PiLightbulb,
  "utility-sewer": PiToilet,
  "utility-septic": PiToilet,
  // Parking & Access
  "access-covered-parking": PiCarSimple,
  "access-basement-parking": PiCarSimple,
  "access-ample-parking": PiCarSimple,
  "access-visitor-parking": PiCarSimple,
  "access-ev-charging": PiPlug,
  "access-car-wash": PiDrop,
  "access-lift": PiElevator,
  "access-service-lift": PiElevator,
  "access-wheelchair": PiWheelchair,
  "access-paved-driveway": PiPath,
  "access-tarmac-road": PiPath,
  "access-street-lighting": PiLightbulb,
  // Wellness & Leisure
  "leisure-pool": PiSwimmingPool,
  "leisure-heated-pool": PiSwimmingPool,
  "leisure-rooftop-pool": PiSwimmingPool,
  "leisure-kids-pool": PiSwimmingPool,
  "leisure-gym": PiBarbell,
  "leisure-yoga": PiPersonSimpleTaiChi,
  "leisure-sauna": PiThermometerHot,
  "leisure-steam": PiThermometerHot,
  "leisure-jacuzzi": PiBathtub,
  "leisure-spa": PiFlowerLotus,
  "leisure-cinema": PiFilmSlate,
  "leisure-games-room": PiGameController,
  "leisure-tennis": PiTennisBall,
  "leisure-padel": PiTennisBall,
  "leisure-squash": PiTennisBall,
  "leisure-basketball": PiCourtBasketball,
  "leisure-football": PiSoccerBall,
  "leisure-jogging-track": PiSneakerMove,
  "leisure-golf": PiGolf,
  "leisure-lounge": PiMartini,
  // Community & Family
  "community-play-area": PiPuzzlePiece,
  "community-daycare": PiBaby,
  "community-school": PiGraduationCap,
  "community-clubhouse": PiHouse,
  "community-restaurant": PiForkKnife,
  "community-cafe": PiCoffee,
  "community-store": PiStorefront,
  "community-mall": PiShoppingCart,
  "community-clinic": PiFirstAidKit,
  "community-business-centre": PiBriefcase,
  "community-event-room": PiConfetti,
  "community-gardens": PiPlant,
  "community-bbq": PiFireSimple,
  "community-rooftop": PiBuildings,
  "community-prayer-room": PiUsersThree,
  "community-pet-friendly": PiPawPrint,
  // Inside the Home
  "interior-all-ensuite": PiShower,
  "interior-master-ensuite": PiShower,
  "interior-walk-in-closet": PiSquaresFour,
  "interior-wardrobes": PiSquaresFour,
  "interior-open-plan": PiCouch,
  "interior-fitted-kitchen": PiCookingPot,
  "interior-kitchen-island": PiCookingPot,
  "interior-pantry": PiWarehouse,
  "interior-stone-worktops": PiSquaresFour,
  "interior-appliances": PiOven,
  "interior-laundry": PiWashingMachine,
  "interior-study": PiDesk,
  "interior-family-room": PiArmchair,
  "interior-balcony": PiBuildingApartment,
  "interior-air-conditioning": PiSnowflake,
  "interior-underfloor-heating": PiThermometerHot,
  "interior-fireplace": PiFlame,
  "interior-high-ceilings": PiBuildingApartment,
  "interior-large-windows": PiWindowsLogo,
  "interior-hardwood-floors": PiSquaresFour,
  "interior-smart-home": PiLightbulb,
  "interior-water-heater": PiShower,
  "interior-furnished": PiCouch,
  "interior-serviced": PiBroom,
  // Grounds, Outbuildings & Views
  "outdoor-private-garden": PiFlowerTulip,
  "outdoor-landscaped": PiTree,
  "outdoor-private-pool": PiSwimmingPool,
  "outdoor-kitchen": PiCampfire,
  "outdoor-patio": PiUmbrella,
  "outdoor-gazebo": PiUmbrella,
  "outdoor-dsq": PiHouseLine,
  "outdoor-guest-house": PiHouseLine,
  "outdoor-kitchen-garden": PiPlant,
  "outdoor-pump-house": PiDrop,
  "outdoor-guard-house": PiShieldCheck,
  "outdoor-garage": PiGarage,
  "outdoor-store-room": PiWarehouse,
  "outdoor-beach-access": PiTreePalm,
  "view-city": PiBuildings,
  "view-water": PiWaves,
  "view-mountain": PiMountains,
  "view-green": PiBinoculars,
  // Services & Terms
  "service-concierge": PiBellRinging,
  "service-management": PiBriefcase,
  "service-housekeeping": PiBroom,
  "service-maintenance": PiWrench,
  "service-garbage": PiTrash,
  "service-water-bowser": PiTruck,
  "service-shuttle": PiBus,
  "service-short-let": PiCalendarCheck,
  "service-title-deed": PiScroll,
  "service-mortgage": PiHandCoins,
};

const GROUP_ICONS: Record<string, IconType> = {
  "Security & Safety": PiShieldCheck,
  "Power, Water & Connectivity": PiLightning,
  "Parking & Access": PiCarSimple,
  "Wellness & Leisure": PiBarbell,
  "Community & Family": PiUsersThree,
  "Inside the Home": PiCouch,
  "Grounds, Outbuildings & Views": PiTree,
  "Services & Terms": PiWrench,
  [OTHER_AMENITY_GROUP]: PiSparkle,
};

/** Resolve the icon for a stored amenity value within its category. */
export function amenityIcon(value: string, group?: string): IconType {
  return ICONS[canonicalAmenity(value)] ?? (group ? GROUP_ICONS[group] : undefined) ?? PiCheck;
}

/** Icon used for free-text "Other Amenities" typed in by an agent. */
export const EXTRA_AMENITY_ICON: IconType = PiSparkle;

/** Kept for tooling that checks every vocabulary value has an icon. */
export const AMENITY_ICON_VALUES = Object.keys(ICONS);
