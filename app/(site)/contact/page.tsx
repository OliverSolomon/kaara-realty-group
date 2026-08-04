import type { Metadata } from "next";
import { PiEnvelopeSimple, PiPhone, PiMapPin, PiClock } from "react-icons/pi";
import { sanityFetch } from "@/sanity/lib/live";
import { SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EnquiryForm from "@/components/site/EnquiryForm";
import ContactActions from "@/components/site/ContactActions";
import { DEFAULT_CONTACT, telLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact | Kaara & Co Realty Group",
  description:
    "Speak to a Kaara advisor about buying, selling or staying in Nairobi. WhatsApp, phone and email, with a reply inside one working day.",
};

export default async function ContactPage() {
  const { data: settings } = await sanityFetch({ query: SITE_SETTINGS_QUERY });
  const contact = settings?.contact;

  const details = [
    {
      Icon: PiEnvelopeSimple,
      label: "Email",
      value: contact?.email || DEFAULT_CONTACT.email,
      href: `mailto:${contact?.email || DEFAULT_CONTACT.email}`,
    },
    {
      Icon: PiPhone,
      label: "Phone",
      value: contact?.phone || DEFAULT_CONTACT.phone,
      href: telLink(contact?.phone),
    },
    {
      Icon: PiClock,
      label: "When we call",
      value: contact?.callingHours || DEFAULT_CONTACT.callingHours,
    },
    {
      Icon: PiMapPin,
      label: "Office",
      value: contact?.address || "Nairobi, Kenya",
    },
  ];

  return (
    <>
      <Navbar settings={settings} />

      <main className="bg-[#100b28] pt-[72px] text-[#efebe3]">
        <section className="mx-auto max-w-[1500px] px-5 pb-16 pt-16 lg:px-10 lg:pb-20 lg:pt-24">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4f9d8f]">Contact</p>
          <h1 className="mt-6 max-w-[18ch] font-serif text-4xl leading-[1.08] md:text-5xl lg:text-6xl">
            Tell us what you are trying to do.
          </h1>
          <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-white/65">
            An advisor replies within one working day. WhatsApp is fastest if your question is
            simple.
          </p>
          <ContactActions contact={contact} className="mt-9" />
        </section>

        <section className="mx-auto max-w-[1500px] border-t border-white/10 px-5 py-16 lg:px-10 lg:py-20">
          <dl className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {details.map(({ Icon, label, value, href }) => (
              <div key={label}>
                <dt className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-3 text-sm leading-relaxed text-white/75">
                  {href ? (
                    <a href={href} className="transition-colors duration-200 hover:text-[#4f9d8f]">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-t border-white/10 bg-[#0b0819]">
          <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-14 px-5 py-20 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28">
            <div className="lg:col-span-5">
              <h2 className="max-w-[18ch] font-serif text-3xl leading-tight sm:text-4xl">
                A virtual tour or a straight conversation
              </h2>
              <p className="mt-5 max-w-[48ch] text-sm leading-relaxed text-white/60">
                Walk a building with an advisor over video, or book a consultation if you are still
                weighing districts, timing and price. Neither carries an obligation to buy.
              </p>
            </div>
            <div className="lg:col-span-7">
              <EnquiryForm kind="tour" />
            </div>
          </div>
        </section>

        {contact?.mapUrl && (
          <section className="border-t border-white/10">
            <iframe
              src={contact.mapUrl}
              title="Kaara & Co Realty Group office location"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[420px] w-full border-0 grayscale"
            />
          </section>
        )}
      </main>

      <Footer settings={settings} />
    </>
  );
}
