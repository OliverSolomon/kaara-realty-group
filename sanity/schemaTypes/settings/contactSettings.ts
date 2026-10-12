import { defineField, defineType } from 'sanity'

export const contactSettings = defineType({
  name: 'contactSettings',
  title: 'Contact Details',
  type: 'document',
  fields: [
    defineField({
      name: 'enquiryRecipients',
      title: 'Enquiry Emails Go To',
      description:
        'Every website enquiry (buy, viewing, short stay, virtual tour) and newsletter sign-up is emailed here through Mailtrap. Add more than one address to copy colleagues in. If this is left empty, emails go to info@kaararealtygroup.com.',
      type: 'array',
      of: [
        {
          type: 'string',
          validation: (rule) =>
            rule.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { name: 'email' }).error('Enter a valid email address'),
        },
      ],
      initialValue: ['info@kaararealtygroup.com'],
      validation: (rule) =>
        rule.min(1).warning('With no address here, enquiries go to info@kaararealtygroup.com.'),
    }),
    defineField({
      name: 'email',
      title: 'Contact Email',
      description: 'The public address shown on the website. Enquiry forms use the list above.',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Office Address',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp Number',
      description: 'International format without spaces or a plus sign, e.g., 254712345678',
      type: 'string',
    }),
    defineField({
      name: 'callingHours',
      title: 'Calling Hours',
      description: 'Shown next to the preferred calling time field on enquiry forms',
      type: 'string',
    }),
    defineField({
      name: 'mapUrl',
      title: 'Google Maps Embed URL',
      type: 'url',
    }),
    defineField({
      name: 'registrationName',
      title: 'Registered Company Name',
      type: 'string',
    }),
    defineField({
      name: 'registrationNumber',
      title: 'Company Registration Number',
      description: 'Displayed in the footer alongside the verification QR code',
      type: 'string',
    }),
    defineField({
      name: 'registrationQr',
      title: 'Registration QR Code',
      description:
        'QR image linking to the company registration record. Shown in the footer as a trust builder.',
      type: 'image',
    }),
    defineField({
      name: 'registrationUrl',
      title: 'Registration Verification Link',
      description: 'Where the QR code points. Used as the link target under the code.',
      type: 'url',
    }),
  ],
})
