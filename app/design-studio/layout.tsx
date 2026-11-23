import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { requireAdmin } from "@/lib/auth/admin";
import "./studio.css";

const inter = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kaara Design",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#7d2ae8", viewportFit: "cover" };

export default async function DesignStudioLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
