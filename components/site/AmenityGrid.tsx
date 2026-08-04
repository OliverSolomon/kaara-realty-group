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
} from "react-icons/pi";
import type { IconType } from "react-icons";
import { AMENITY_LABELS } from "@/lib/site";

const ICONS: Record<string, IconType> = {
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

interface AmenityGridProps {
  amenities?: string[];
  className?: string;
}

export default function AmenityGrid({ amenities, className = "" }: AmenityGridProps) {
  if (!amenities?.length) return null;

  return (
    <ul
      className={`grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 ${className}`}
    >
      {amenities.map((key) => {
        const Icon = ICONS[key] ?? PiCheck;
        return (
          <li key={key} className="flex flex-col gap-3">
            <Icon size={26} className="text-[#4f9d8f]" aria-hidden="true" />
            <span className="text-sm text-white/75">{AMENITY_LABELS[key] ?? key}</span>
          </li>
        );
      })}
    </ul>
  );
}
