import Image from "next/image";

export interface Developer {
  _id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  website?: string;
  summary?: string;
  projectsDelivered?: number;
}

interface DeveloperWallProps {
  developers: Developer[];
  className?: string;
}

/** Two letter monogram for partners who have not sent a logo yet. */
function Monogram({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center font-serif text-2xl tracking-[0.1em] text-[#efebe3]/70"
    >
      {initials}
    </span>
  );
}

export default function DeveloperWall({ developers, className = "" }: DeveloperWallProps) {
  if (!developers?.length) return null;

  return (
    <ul className={`grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {developers.map((developer) => {
        const inner = (
          <span className="relative flex h-24 w-full items-center justify-center px-6">
            {developer.logoUrl ? (
              <Image
                src={developer.logoUrl}
                alt={developer.name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-contain p-6 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
              />
            ) : (
              <Monogram name={developer.name} />
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
                className="block"
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
