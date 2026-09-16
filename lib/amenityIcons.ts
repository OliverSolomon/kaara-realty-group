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
  PiThermometerHot,
  PiPuzzlePiece,
  PiFilmSlate,
  PiForkKnife,
  PiStorefront,
  PiBathtub,
  PiFlowerLotus,
  PiTennisBall,
  PiCourtBasketball,
  PiSneakerMove,
  PiGameController,
  PiBaby,
  PiBriefcase,
  PiConfetti,
  PiFireSimple,
  PiPawPrint,
  PiPlug,
  PiWheelchair,
  PiGarage,
} from "react-icons/pi";
import type { IconType } from "react-icons";

/**
 * One icon per amenity, shared by every component that lists amenities so a
 * new entry only has to be added here once.
 *
 * Lookup order: exact value, then the amenity's category, then a plain tick.
 * An amenity without its own entry still renders with a sensible glyph.
 */

export const OTHER_AMENITY_GROUP = "Also included";

const ICONS: Record<string, IconType> = {
  // Wellness & Leisure
  "leisure-pool": PiSwimmingPool,
  "leisure-kids-pool": PiSwimmingPool,
  "leisure-gym": PiBarbell,
  "leisure-sauna": PiThermometerHot,
  "leisure-steam": PiThermometerHot,
  "leisure-jacuzzi": PiBathtub,
  "leisure-spa": PiFlowerLotus,
  "leisure-tennis": PiTennisBall,
  "leisure-squash": PiTennisBall,
  "leisure-basketball": PiCourtBasketball,
  "leisure-jogging-track": PiSneakerMove,
  "leisure-cinema": PiFilmSlate,
  "leisure-games-room": PiGameController,
  // Community & Family
  "community-play-area": PiPuzzlePiece,
  "community-daycare": PiBaby,
  "community-restaurant": PiForkKnife,
  "community-store": PiStorefront,
  "community-business-centre": PiBriefcase,
  "community-event-room": PiConfetti,
  "community-bbq": PiFireSimple,
  "community-pet-friendly": PiPawPrint,
  "community-rooftop": PiBuildings,
  "community-gardens": PiPlant,
  // Grounds
  "outdoor-private-garden": PiPlant,
  "outdoor-dsq": PiHouseLine,
  "outdoor-garage": PiGarage,
  // Parking & Access
  "access-lift": PiElevator,
  "access-service-lift": PiElevator,
  "access-covered-parking": PiCarSimple,
  "access-ample-parking": PiCarSimple,
  "access-visitor-parking": PiCarSimple,
  "access-ev-charging": PiPlug,
  "access-wheelchair": PiWheelchair,
  // Power, Water & Connectivity
  "utility-generator": PiLightning,
  "utility-three-phase": PiLightning,
  "utility-borehole": PiDrop,
  "utility-water-tanks": PiDrop,
  "utility-solar-power": PiSun,
  "utility-solar-water": PiSun,
  "utility-fibre": PiWifiHigh,
  // Security & Services
  "security-cctv": PiSecurityCamera,
  "security-manned": PiShieldCheck,
  "security-alarm": PiBellRinging,
  "service-concierge": PiBellRinging,
  // Legacy vocabulary, kept so older listings keep their icons
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

const GROUP_ICONS: Record<string, IconType> = {
  Security: PiShieldCheck,
  "Power, Water & Connectivity": PiLightning,
  "Parking & Access": PiCarSimple,
  "Wellness & Leisure": PiBarbell,
  "Community & Family": PiUsersThree,
  "Inside the Home": PiCouch,
  "Grounds & Outbuildings": PiTree,
  Services: PiWrench,
  [OTHER_AMENITY_GROUP]: PiSparkle,
};

/** Resolve the icon for a stored amenity value within its category. */
export function amenityIcon(value: string, group?: string): IconType {
  return ICONS[value] ?? (group ? GROUP_ICONS[group] : undefined) ?? PiCheck;
}

/** Icon used for free-text "Other Amenities" typed in by an agent. */
export const EXTRA_AMENITY_ICON: IconType = PiSparkle;
