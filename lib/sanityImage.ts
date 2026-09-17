/**
 * Turns a Sanity image (asset URL plus the crop and hotspot an editor set in
 * the Studio) into a sized URL and a CSS object-position.
 *
 * Without this the site loaded the raw upload, so any crop or focal point
 * chosen in the Studio was ignored and wide banners cut through the middle of
 * the photo.
 */

export interface SanityCrop {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

export interface SanityHotspot {
  x?: number
  y?: number
}

export interface SanityDimensions {
  width?: number
  height?: number
}

export interface SanityImageInput {
  url?: string | null
  crop?: SanityCrop | null
  hotspot?: SanityHotspot | null
  dimensions?: SanityDimensions | null
}

const clamp = (n: number) => Math.min(1, Math.max(0, n))

export function sanityImage(
  image: SanityImageInput,
  { width = 2400, quality = 85 }: { width?: number; quality?: number } = {}
): { src: string; objectPosition: string } | null {
  const url = image.url
  if (!url) return null

  const crop = image.crop ?? {}
  const left = crop.left ?? 0
  const right = crop.right ?? 0
  const top = crop.top ?? 0
  const bottom = crop.bottom ?? 0
  const cropW = 1 - left - right
  const cropH = 1 - top - bottom

  // Focal point, expressed relative to the cropped area.
  const hx = image.hotspot?.x ?? 0.5
  const hy = image.hotspot?.y ?? 0.5
  const posX = cropW > 0 ? clamp((hx - left) / cropW) : 0.5
  const posY = cropH > 0 ? clamp((hy - top) / cropH) : 0.5
  const objectPosition = `${(posX * 100).toFixed(1)}% ${(posY * 100).toFixed(1)}%`

  // External URLs are used as they are.
  if (!url.includes('cdn.sanity.io/images/')) return { src: url, objectPosition }

  const params = new URLSearchParams({ auto: 'format', fit: 'max', q: String(quality), w: String(width) })
  const { width: pw, height: ph } = image.dimensions ?? {}
  if (pw && ph && (left || right || top || bottom)) {
    params.set(
      'rect',
      [
        Math.round(left * pw),
        Math.round(top * ph),
        Math.round(cropW * pw),
        Math.round(cropH * ph),
      ].join(',')
    )
  }

  // Commas in rect are left unencoded, the form Sanity's image API documents.
  return { src: `${url.split('?')[0]}?${params.toString().replace(/%2C/g, ',')}`, objectPosition }
}
