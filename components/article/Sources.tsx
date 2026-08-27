import { ArrowUpRight } from "lucide-react";
import type { Citation } from "@/lib/article";

/**
 * Sources and further reading.
 *
 * The numbered list is assembled from citations the writer applied inline, so
 * it can never drift out of step with the article. Each entry links back to the
 * sentence that cited it, which is what makes footnotes usable on screen rather
 * than a formality.
 *
 * Visible, linked sources are also the strongest trust signal available to both
 * search engines and answer engines assessing whether a page is worth citing.
 */

export interface FurtherReadingItem {
  title?: string;
  publisher?: string;
  url?: string;
  year?: string;
}

interface SourcesProps {
  citations: Citation[];
  furtherReading?: FurtherReadingItem[];
}

function hostOf(url?: string) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function SourceLink({ title, url }: { title?: string; url?: string }) {
  if (!url) return <span className="source-title">{title}</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="source-title source-link">
      {title}
      <ArrowUpRight size={11} aria-hidden="true" />
    </a>
  );
}

export default function Sources({ citations, furtherReading }: SourcesProps) {
  const extra = (furtherReading ?? []).filter((s) => s?.title);
  if (citations.length === 0 && extra.length === 0) return null;

  return (
    <section id="sources" aria-labelledby="sources-heading" className="article-sources">
      <h2 id="sources-heading" className="sources-heading">
        Sources
      </h2>

      {citations.length > 0 && (
        <ol className="sources-list">
          {citations.map((c) => {
            const host = hostOf(c.url);
            return (
              <li key={c.number} id={`source-${c.number}`} className="source-item">
                <span className="source-number">{c.number}.</span>
                <div className="source-body">
                  <SourceLink title={c.title} url={c.url} />
                  <span className="source-meta">
                    {c.publisher ? ` · ${c.publisher}` : ""}
                    {c.year ? ` · ${c.year}` : ""}
                    {host ? ` · ${host}` : ""}
                  </span>
                  {c.note && <p className="source-note">{c.note}</p>}
                  <a
                    href={`#cite-${c.number}`}
                    className="source-backlink"
                    aria-label={`Back to citation ${c.number} in the article`}
                  >
                    ↩
                  </a>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {extra.length > 0 && (
        <>
          <h3 className="sources-heading sources-subheading">Further reading</h3>
          <ul className="sources-list sources-list-plain">
            {extra.map((s, i) => {
              const host = hostOf(s.url);
              return (
                <li key={i} className="source-body">
                  <SourceLink title={s.title} url={s.url} />
                  <span className="source-meta">
                    {s.publisher ? ` · ${s.publisher}` : ""}
                    {s.year ? ` · ${s.year}` : ""}
                    {host ? ` · ${host}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
