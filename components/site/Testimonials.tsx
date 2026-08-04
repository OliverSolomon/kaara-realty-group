"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

export interface Testimonial {
  _id: string;
  quote: string;
  name: string;
  role: string;
  portraitUrl?: string;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
  className?: string;
}

const ROTATE_MS = 7000;

export default function Testimonials({ testimonials, className = "" }: TestimonialsProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = testimonials.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setActive(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (paused || count < 2) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = window.setInterval(() => setActive((i) => (i + 1) % count), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;

  const current = testimonials[active];

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div aria-live="polite" className="min-h-[220px]">
        <blockquote key={current._id} className="reveal" data-visible="true">
          <p className="max-w-[24ch] font-serif text-3xl leading-[1.25] text-[#efebe3] sm:max-w-[30ch] sm:text-4xl">
            “{current.quote}”
          </p>
          <footer className="mt-8 flex items-center gap-4">
            {current.portraitUrl && (
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={current.portraitUrl}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
            )}
            <span className="text-sm leading-relaxed text-white/60">
              <span className="block font-bold uppercase tracking-[0.2em] text-[#efebe3] text-[11px]">
                {current.name}
              </span>
              {current.role}
            </span>
          </footer>
        </blockquote>
      </div>

      {count > 1 && (
        <div className="mt-10 flex items-center gap-3">
          {testimonials.map((t, i) => (
            <button
              key={t._id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show the testimonial from ${t.name}`}
              aria-current={i === active}
              className="press h-8 w-10 pt-4"
            >
              <span
                className={`block h-px w-full transition-colors duration-300 ${
                  i === active ? "bg-[#4f9d8f]" : "bg-white/20 hover:bg-white/45"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
