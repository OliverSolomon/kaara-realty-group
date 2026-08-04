import { defineField, defineType } from 'sanity'

export const contactSettings = defineType({
  name: 'contactSettings',
  title: 'Contact Details',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Contact Email',
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
