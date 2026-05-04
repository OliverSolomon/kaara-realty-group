"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useState } from "react";

interface FooterProps {
  settings?: {
    general?: any;
    brand?: any;
    contact?: any;
    socials?: any;
  };
}

export default function Footer({ settings }: FooterProps) {
  const [email, setEmail] = useState("");
  const agencyEmail = settings?.contact?.email || "kaara@kaararealtygroup.com";
  const siteName = settings?.general?.siteName || "KAARA REALTY GROUP";
  const footerText = settings?.general?.footerText || "THE PINNACLE OF KENYAN REAL ESTATE. EQUAL HOUSING OPPORTUNITY.";
  const socials = settings?.socials;

  return (
    <footer className="bg-[#100B28] text-white pt-20 lg:pt-32 pb-12 lg:pb-16 px-6 lg:px-20 border-t border-white/5 print:hidden">
      <div className="max-w-[1700px] mx-auto">
        <div className="flex flex-col items-center gap-4 mb-16 lg:mb-24 text-center">
          <span className="text-xl lg:text-[2.5rem] tracking-[0.4em] lg:tracking-[0.6em] font-serif uppercase text-white inline-block">{siteName}</span>
          <div className="h-px w-20 bg-white/20"></div>
          <p className="text-[10px] tracking-[0.3em] text-white/40 mt-4 uppercase font-bold">{agencyEmail}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16 mb-20 font-sans text-[9px] lg:text-[10px] tracking-[0.3em] lg:tracking-[0.4em] uppercase font-bold text-center sm:text-left">
          <div className="space-y-6">
            <h4 className="text-white/40 mb-6 lg:mb-10 font-bold tracking-[0.5em]">The Agency</h4>
            <ul className="space-y-4 lg:space-y-6 text-white/70">
              <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Leadership</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Vertical Experts</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Press Center</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-white/40 mb-6 lg:mb-10 font-bold tracking-[0.5em]">Intelligence</h4>
            <ul className="space-y-4 lg:space-y-6 text-white/70">
              <li><Link href="#" className="hover:text-white transition-colors">Market Reports</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Vertical Insights</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">The Journal</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Global Search</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-white/40 mb-6 lg:mb-10 font-bold tracking-[0.5em]">Districts</h4>
            <ul className="space-y-4 lg:space-y-6 text-white/70">
              <li><Link href="#" className="hover:text-white transition-colors">Upper Hill</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Westlands</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Kilimani</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Muthaiga</Link></li>
            </ul>
          </div>
          <div className="space-y-10 sm:col-span-2 lg:col-span-2 text-center sm:text-left">
            <h4 className="text-white/40 mb-6 lg:mb-10 font-bold tracking-[0.5em]">The Collective</h4>
            <p className="text-white/30 normal-case tracking-normal mb-8 leading-relaxed max-w-sm mx-auto sm:mx-0 text-xs font-light uppercase">
              Join our exclusive network for curated updates on vertical developments and luxury estates across Nairobi.
            </p>
            <div className="flex max-w-md border-b border-white/10 pb-3 group mx-auto sm:mx-0">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="SUBSCRIBE" 
                className="bg-transparent border-none outline-none flex-grow text-[10px] tracking-[0.4em] font-sans placeholder:text-white/10 text-white font-bold uppercase"
              />
              <button className="text-white/20 group-hover:text-white transition-all duration-500 group-hover:translate-x-1">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-12 text-[8px] lg:text-[9px] tracking-[0.3em] lg:tracking-[0.5em] text-white/30 uppercase text-center">
           <div className="flex flex-wrap justify-center gap-8 lg:gap-10">
              <Link href="#" className="hover:text-white transition-colors">Digital Site Map</Link>
              <Link href="#" className="hover:text-white transition-colors">Legal Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacy Charter</Link>
              <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
           </div>
           <div className="flex gap-10">
              {socials?.facebook && <Link href={socials.facebook} target="_blank" className="hover:text-white transition-all duration-500 hover:scale-110"><FaFacebookF size={18} /></Link>}
              {socials?.twitter && <Link href={socials.twitter} target="_blank" className="hover:text-white transition-all duration-500 hover:scale-110"><FaXTwitter size={18} /></Link>}
              {socials?.instagram && <Link href={socials.instagram} target="_blank" className="hover:text-white transition-all duration-500 hover:scale-110"><FaInstagram size={18} /></Link>}
              {socials?.linkedin && <Link href={socials.linkedin} target="_blank" className="hover:text-white transition-all duration-500 hover:scale-110"><FaLinkedinIn size={18} /></Link>}
           </div>
        </div>

        <div className="mt-12 text-[7px] lg:text-[8px] leading-[2] text-white/20 text-center max-w-5xl mx-auto tracking-[0.15em] uppercase font-light">
           <p className="mb-4">{siteName} IS THE PREMIER BROKERAGE FOR VERTICAL LUXURY IN KENYA. ALL MATERIAL PRESENTED HEREIN IS INTENDED FOR INFORMATION PURPOSES ONLY.</p>
           <p>© {new Date().getFullYear()} {siteName}. {footerText}</p>
        </div>
      </div>
    </footer>
  );
}
