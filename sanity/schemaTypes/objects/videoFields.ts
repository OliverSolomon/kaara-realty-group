import { defineField } from 'sanity'

import { apiVersion } from '../../env'

/**
 * The three fields every homepage video section shares: source type, external
 * URL and uploaded file.
 *
 * Sanity keeps uploaded files byte-for-byte, so the quality on the website is
 * the quality of the file that was uploaded. These fields steer editors toward
 * files that browsers play well and flag the uploads that commonly look worse
 * or fail to play.
 */

const LARGE_FILE_BYTES = 60 * 1024 * 1024

const UPLOAD_GUIDANCE =
  'Upload the original export, not a copy sent through WhatsApp, email or a phone share sheet (those are recompressed). ' +
  'Best results: MP4 (H.264), 1920×1080 or 2560×1440, 8 to 15 Mbps, 10 to 30 seconds, no audio needed. ' +
  'iPhone .mov files are often HEVC and will not play in Chrome or on Android; export them as MP4 first.'

export function videoSourceFields(defaultType: 'file' | 'url') {
  return [
    defineField({
      name: 'type',
      title: 'Video Type',
      type: 'string',
      options: {
        list: [
          { title: 'File Upload (recommended)', value: 'file' },
          { title: 'External URL', value: 'url' },
        ],
        layout: 'radio',
      },
      initialValue: defaultType,
    }),
    defineField({
      name: 'videoUrl',
      title: 'External Video URL',
      description:
        'A direct link to an .mp4 or .webm file (for example a Cloudinary video URL). Cloudinary links are served at best quality automatically. Page links from Google Drive, YouTube or Vimeo are not video files and play at reduced quality or not at all.',
      type: 'url',
      hidden: ({ parent }) => parent?.type !== 'url',
      validation: (rule) =>
        rule
          .custom((value) => {
            if (!value) return true
            if (/drive\.google\.com/.test(value)) {
              return 'Google Drive only streams a compressed preview and blocks large files. Download the original and use File Upload instead.'
            }
            if (/(youtube\.com|youtu\.be|vimeo\.com)/.test(value)) {
              return 'YouTube and Vimeo links are web pages, not video files, so they cannot play as a background video. Use File Upload or a Cloudinary link.'
            }
            return true
          })
          .warning(),
    }),
    defineField({
      name: 'videoFile',
      title: 'Video File',
      description: UPLOAD_GUIDANCE,
      type: 'file',
      options: {
        accept: 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v',
        storeOriginalFilename: true,
      },
      hidden: ({ parent }) => parent?.type !== 'file',
      validation: (rule) =>
        rule
          .custom(async (value: { asset?: { _ref?: string } } | undefined, context) => {
            const ref = value?.asset?._ref
            if (!ref) return true
            const asset = await context
              .getClient({ apiVersion })
              .fetch<{ mimeType?: string; size?: number } | null>(
                `*[_id == $ref][0]{ mimeType, size }`,
                { ref }
              )
            if (!asset) return true
            if (asset.mimeType === 'video/quicktime') {
              return 'This is a .mov file. If it was recorded on an iPhone it is probably HEVC, which Chrome, Edge and Android cannot play. Export it as MP4 (H.264) and upload that instead.'
            }
            if (asset.mimeType && !/^video\/(mp4|webm)$/.test(asset.mimeType)) {
              return `This file is ${asset.mimeType}, which browsers may not play. Upload an MP4 (H.264) or WebM file.`
            }
            if (asset.size && asset.size > LARGE_FILE_BYTES) {
              return `This file is ${Math.round(asset.size / 1024 / 1024)} MB. Quality will be fine, but it will be slow to start on mobile data. Aim for under 60 MB by trimming length rather than lowering resolution.`
            }
            return true
          })
          .warning(),
    }),
  ]
}
