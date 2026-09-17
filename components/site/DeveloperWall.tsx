import Image from "next/image";

export interface Developer {
  _id: string;
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  /** "white" (default), "original" or "tile". Set per developer in the Studio. */
  logoStyle?: string | null;
  website?: string | null;
  summary?: string | null;
  projectsDelivered?: number | null;
}

interface DeveloperWallProps {
  developers: Developer[];
  className?: string;
}

/** Initials and name for partners who have not sent a logo yet. */
function NameMark({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-center">
      <span aria-hidden="true" className="font-serif text-xl tracking-[0.12em] text-[#efebe3]/80 sm:text-2xl">
        {initials}
      </span>
      <span className="line-clamp-2 text-[9px] font-bold uppercase leading-snug tracking-[0.18em] text-white/45 sm:text-[10px]">
        {name}
      </span>
    </span>
  );
}

/**
 * Logo wall for developer partners.
 *
 * The wall sits on a dark background, so each logo is shown in the style the
 * editor picked: a white mark (default, keeps dark logos visible and the wall
 * consistent), original colours, or the untouched logo on a white tile.
 *
 * Two columns on phones (one row of two even on folded cover screens), three
 * on tablets and four on desktop. Tiles are shorter and less padded on small
 * screens so logos stay a readable size.
 */
export default function DeveloperWall({ developers, className = "" }: DeveloperWallProps) {
  const list = (developers ?? []).filter((d) => d?._id && d?.name);
  if (!list.length) return null;

  return (
    <ul
      className={`grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-4 ${className}`}
    >
      {list.map((developer) => {
        const style = developer.logoStyle || "white";
        const tile = style === "tile" && developer.logoUrl;

        const inner = (
          <span
            className={`relative flex h-20 w-full items-center justify-center px-3 min-[400px]:h-24 sm:h-28 sm:px-6 ${
              tile ? "bg-white" : ""
            }`}
          >
            {developer.logoUrl ? (
              <Image
                src={developer.logoUrl}
                alt={developer.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-contain p-4 transition-opacity duration-300 sm:p-6 ${
                  style === "white"
                    ? "opacity-70 brightness-0 invert group-hover:opacity-100"
                    : tile
                      ? "opacity-100"
                      : "opacity-80 group-hover:opacity-100"
                }`}
              />
            ) : (
              <NameMark name={developer.name} />
            )}
          </span>
        );

        return (
          <li key={developer._id} className="group bg-[#100b28]">
            {developer.website ? (
              <a
                href={developer.website}
                target="_blank"
                rel="noopener noreferrer"
                title={developer.name}
                aria-label={`${developer.name} (opens in a new tab)`}
                className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4f9d8f]"
              >
                {inner}
              </a>
            ) : (
              <span title={developer.name} className="block">
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
