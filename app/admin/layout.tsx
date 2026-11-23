import type { Metadata, Viewport } from "next";
import { DialogHost } from "@/components/admin/Dialogs";
import { Playfair_Display, Montserrat } from "next/font/google";
import "../(site)/globals.css";

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kaara Leads",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#100b28",
  viewportFit: "cover",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${montserrat.variable} min-h-dvh bg-[#100b28] font-sans text-[#efebe3] antialiased`}>
        {children}
        <DialogHost />
      </body>
    </html>
  );
}
