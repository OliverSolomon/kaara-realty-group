import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * AI / LLM crawlers we explicitly welcome.
 *
 * These are the agents that populate ChatGPT, Claude, Perplexity, Google AI
 * Overviews and Apple Intelligence. Many sites block them by default via CDN
 * rules or a blanket disallow; doing so removes the site from AI answers
 * entirely. Naming them with an explicit allow is the cheapest possible
 * generative-engine win.
 */
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User", // OpenAI
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web", // Anthropic
  "PerplexityBot",
  "Perplexity-User", // Perplexity
  "Google-Extended", // Google Gemini / AI Overviews
  "Applebot-Extended", // Apple Intelligence
  "Bingbot",
  "Amazonbot",
  "CCBot", // Common Crawl — feeds many models
  "cohere-ai",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  // The Studio and API routes carry no public value and would waste crawl budget.
  const disallow = ["/studio", "/studio/", "/api/"];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: AI_BOTS, allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
