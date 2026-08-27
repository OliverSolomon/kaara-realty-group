import { Zap, CheckCircle2 } from "lucide-react";

/**
 * TL;DR and Key Takeaways.
 *
 * Most readers of a long market piece want the conclusion before committing to
 * the argument. Giving it to them up front does not cost you the read — it
 * earns it, because they now know whether the detail below is worth their time.
 *
 * It also feeds answer engines: a tight summary directly under the headline is
 * the passage most likely to be lifted as a citation.
 */

interface ArticleSummaryProps {
  tldr?: string;
  keyTakeaways?: string[];
}

export default function ArticleSummary({ tldr, keyTakeaways }: ArticleSummaryProps) {
  const takeaways = (keyTakeaways ?? []).filter(Boolean);
  if (!tldr && takeaways.length === 0) return null;

  return (
    <div className="article-summary">
      {tldr && (
        <section className="summary-tldr" aria-label="Summary">
          <p className="summary-label summary-label-accent">
            <Zap size={12} aria-hidden="true" /> TL;DR
          </p>
          <p className="summary-tldr-text">{tldr}</p>
        </section>
      )}

      {takeaways.length > 0 && (
        <section className="summary-takeaways" aria-label="Key takeaways">
          <p className="summary-label">Key takeaways</p>
          <ul className="summary-takeaway-list">
            {takeaways.map((point, i) => (
              <li key={i}>
                <CheckCircle2 size={15} aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
