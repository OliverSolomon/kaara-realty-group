import ListingCard, { type Listing } from "./ListingCard";
import Reveal from "./Reveal";

interface ListingGridProps {
  listings: Listing[];
  emptyTitle: string;
  emptyBody: string;
  className?: string;
}

export default function ListingGrid({
  listings,
  emptyTitle,
  emptyBody,
  className = "",
}: ListingGridProps) {
  if (!listings?.length) {
    return (
      <div className={`border border-white/10 bg-[#171232] px-8 py-16 text-center ${className}`}>
        <h3 className="font-serif text-2xl text-[#efebe3]">{emptyTitle}</h3>
        <p className="mx-auto mt-4 max-w-[52ch] text-sm leading-relaxed text-white/55">{emptyBody}</p>
      </div>
    );
  }

  return (
    <ul className={`grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 xl:grid-cols-3 ${className}`}>
      {listings.map((listing, i) => (
        <Reveal as="li" key={listing._id} index={i} className="h-full">
          <ListingCard listing={listing} priority={i < 3} />
        </Reveal>
      ))}
    </ul>
  );
}
