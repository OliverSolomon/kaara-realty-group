import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import { SanityLive } from "@/sanity/lib/live";
import JsonLd from "@/components/JsonLd";
import { SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/live";
import {
  organizationSchema,
  websiteSchema,
  realEstateAgentSchema,
  graph,
  SITE_URL,
  DEFAULT_KEYWORDS,
} from "@/lib/seo";
import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LanguageProvider } from "@/context/LanguageContext";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kaara Realty Group | Luxury Real Estate & Homes for Sale",
  description: "Kaara Realty Group is the premier luxury real estate brokerage in Kenya, specializing in vertical luxury and exclusive estates.",
  metadataBase: new URL(SITE_URL),
  keywords: DEFAULT_KEYWORDS,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Kaara Realty Group | Luxury Real Estate & Homes for Sale',
    description: 'The premier luxury real estate brokerage in Kenya, specializing in vertical luxury and exclusive estates.',
    url: 'https://kaararealtygroup.com',
    siteName: 'Kaara Realty Group',
    images: [
      {
        url: 'https://kaararealtygroup.com/og-image.png',
        secureUrl: 'https://kaararealtygroup.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kaara Realty Group Luxury Real Estate',
        type: 'image/png',
      },
    ],
    locale: 'en_KE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kaara Realty Group | Luxury Real Estate',
    description: 'The premier luxury real estate brokerage in Kenya, specializing in vertical luxury.',
    images: ['https://kaararealtygroup.com/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/* Entity graph for the whole site: the organisation, the local business
   (RealEstateAgent, which is what location queries resolve against) and the
   website itself, all cross-referenced by @id. */

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Contact and social details feed the entity graph, so the business address
  // and profiles stay editable in Studio rather than hardcoded here.
  let siteSettings: unknown = undefined;
  try {
    const { data } = await sanityFetch({ query: SITE_SETTINGS_QUERY });
    siteSettings = data;
  } catch {
    // The graph degrades gracefully without settings.
  }

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${playfair.variable} ${montserrat.variable} font-sans bg-[#000B1D] text-white antialiased`} suppressHydrationWarning>
        <JsonLd
          data={graph(
            organizationSchema(siteSettings),
            websiteSchema(),
            realEstateAgentSchema(siteSettings)
          )}
        />
        <ServiceWorkerRegistration />
        <LanguageProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </LanguageProvider>
        <SanityLive />
        {(await draftMode()).isEnabled && <VisualEditing />}
      </body>
    </html>
  );
}
