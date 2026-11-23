import type { IconType } from "react-icons";
import {
  PiBed,
  PiCheckCircle,
  PiDoorOpen,
  PiFacebookLogo,
  PiFileText,
  PiFrameCorners,
  PiHandshake,
  PiIdentificationCard,
  PiInstagramLogo,
  PiKey,
  PiLinkedinLogo,
  PiPinterestLogo,
  PiPresentationChart,
  PiSparkle,
  PiSquaresFour,
  PiTag,
  PiTrendDown,
  PiWhatsappLogo,
  PiYoutubeLogo,
} from "react-icons/pi";
import type { CampaignId, FormatId } from "@/lib/design/estateTemplates";

const FORMAT_ICONS: Record<FormatId, IconType[]> = {
  post: [PiInstagramLogo],
  portrait: [PiInstagramLogo],
  story: [PiInstagramLogo, PiWhatsappLogo],
  pin: [PiPinterestLogo],
  wide: [PiFacebookLogo, PiLinkedinLogo],
  thumb: [PiYoutubeLogo],
  slide: [PiPresentationChart],
  flyer: [PiFileText],
  poster: [PiFrameCorners],
  card: [PiIdentificationCard],
  banner: [PiLinkedinLogo],
};

const CAMPAIGN_ICONS: Record<CampaignId | "all", IconType> = {
  all: PiSquaresFour,
  sale: PiTag,
  let: PiKey,
  stay: PiBed,
  new: PiSparkle,
  drop: PiTrendDown,
  open: PiDoorOpen,
  sold: PiHandshake,
  rented: PiCheckCircle,
};

export function FormatIcons({ id, size = 15 }: { id: FormatId; size?: number }) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-0.5">
      {FORMAT_ICONS[id].map((Icon, index) => <Icon key={index} size={size} />)}
    </span>
  );
}

export function CampaignIcon({ id, size = 15 }: { id: CampaignId | "all"; size?: number }) {
  const Icon = CAMPAIGN_ICONS[id];
  return <Icon size={size} aria-hidden="true" className="shrink-0" />;
}
