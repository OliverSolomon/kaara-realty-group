import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { requireAdmin } from "@/lib/auth/admin";
import "./studio.css";

const montserrat = Montserrat({ variable: "--font-geist-sans", subsets: ["latin"] });

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kaara Design",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#0b0819", viewportFit: "cover" };

export default async function DesignStudioLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <html lang="en" className="dark">
      <body className={`${montserrat.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
