import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import { SanityLive } from "@/sanity/lib/live";
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
  metadataBase: new URL('https://kaararealtygroup.com'),
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Kaara Realty Group",
  "url": "https://kaararealtygroup.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://kaararealtygroup.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${playfair.variable} ${montserrat.variable} font-sans bg-[#000B1D] text-white antialiased`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ServiceWorkerRegistration />
        <CurrencyProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </CurrencyProvider>
        <SanityLive />
        {(await draftMode()).isEnabled && <VisualEditing />}
      </body>
    </html>
  );
}
