/**
 * Visible FAQ block.
 *
 * This exists for two reasons and both require the text to actually render:
 *  · Google ignores FAQPage markup that has no visible counterpart on the page,
 *    and can issue a manual action for markup-only FAQs.
 *  · Answer engines quote visible prose. A clear question followed by a
 *    self-contained answer is close to the ideal shape for extraction — which
 *    is why each answer is written to stand alone, without needing the question
 *    or the surrounding page for context.
 *
 * Rendered with <details> so it is keyboard accessible and readable with
 * JavaScript disabled, which crawlers effectively are.
 */

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSectionProps {
  items: FaqItem[];
  heading?: string;
  eyebrow?: string;
  className?: string;
}

export default function FaqSection({
  items,
  heading = "Buying property in Kenya: common questions",
  eyebrow = "Questions",
  className = "",
}: FaqSectionProps) {
  if (!items?.length) return null;

  return (
    <section className={`border-t border-white/10 bg-[#0b0819] ${className}`}>
      <div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4f9d8f]">{eyebrow}</p>
        <h2 className="mt-6 max-w-[22ch] font-serif text-3xl leading-tight sm:text-4xl">
          {heading}
        </h2>

        <div className="mt-12 max-w-[80ch] divide-y divide-white/10 border-t border-white/10">
          {items.map(({ q, a }) => (
            <details key={q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-serif text-lg leading-snug text-[#efebe3] marker:hidden">
                <span>{q}</span>
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-[#4f9d8f] transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-white/70">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
