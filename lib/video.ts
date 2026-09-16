/**
 * Turns a homepage video setting from the Studio into something a <video>
 * element can play at full quality.
 *
 * Why this exists. Sanity stores uploaded files exactly as they were uploaded
 * and never re-encodes them, so quality was being lost around the upload:
 *  · Cloudinary links carried a `w_1870,h_947,c_fill` transformation with no
 *    quality flag, so Cloudinary re-encoded them at its default quality and
 *    capped the width below a 1440p / 4K screen.
 *  · Google Drive "view" links point at a web page, not at a video file, and
 *    Drive only ever streams a compressed preview.
 *  · Every source was declared as `video/mp4`, including .mov uploads. A wrong
 *    type makes some browsers skip the file or fall back to the default video.
 */

export interface VideoSource {
  title?: string;
  subtitle?: string;
  type?: "file" | "url";
  videoUrl?: string;
  fileUrl?: string;
  fileMime?: string;
}

export interface ResolvedVideo {
  src: string;
  /** MIME type for <source type>. Left undefined when the browser should sniff. */
  type?: string;
}

const CLOUDINARY_VIDEO = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.*)$/;

/**
 * Serve Cloudinary videos at their original resolution with the highest
 * automatic quality. Size-capping transformations (w_, h_, c_) are dropped,
 * because the players are full-screen and crop with `object-cover` anyway.
 * Any quality setting the editor chose on purpose is left alone.
 */
export function upgradeCloudinaryVideo(url: string): string {
  const match = url.match(CLOUDINARY_VIDEO);
  if (!match) return url;
  const [, base, rest] = match;

  const segments = rest.split("/");
  const kept: string[] = [];
  let i = 0;
  // Transformation segments come before the version (v123…) or the public id,
  // and are the ones made of comma-separated key_value pairs.
  for (; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (/^v\d+$/.test(seg) || !/^[a-z]{1,3}_[^/]*$/.test(seg)) break;
    const parts = seg.split(",").filter((p) => !/^(w|h|c)_/.test(p));
    if (parts.length) kept.push(parts.join(","));
  }
  const hasQuality = kept.some((seg) => /(^|,)q_/.test(seg));
  if (!hasQuality) kept.unshift("q_auto:best");

  return base + [...kept, ...segments.slice(i)].join("/");
}

/** Google Drive share links → the direct file URL. */
export function directDriveUrl(url: string): string {
  const id =
    url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)?.[1] ??
    url.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([^&#]+)/)?.[1];
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}

function mimeFor(src: string, declared?: string): string | undefined {
  const mime = declared?.toLowerCase();
  if (mime === "video/mp4" || mime === "video/webm") return mime;
  if (mime) return undefined; // e.g. video/quicktime: let the browser sniff it
  const ext = src.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  if (ext === "mp4" || ext === "m4v") return "video/mp4";
  if (ext === "webm") return "video/webm";
  return undefined;
}

/**
 * Page links (Google Drive, YouTube, Vimeo) cannot stream into a <video>
 * element. Safari on iPhone in particular needs byte-range requests, which
 * Drive does not serve, so the section rendered as an empty block.
 */
const NOT_STREAMABLE = /(drive\.google\.com|docs\.google\.com|youtube\.com|youtu\.be|vimeo\.com)/i;

export function resolveVideo(source: VideoSource | undefined, fallback: string): ResolvedVideo {
  const url = source?.videoUrl?.trim();
  const file = source?.fileUrl?.trim();

  // An uploaded file always beats a link that cannot play. This covers the
  // common case of uploading a file but leaving "Video Type" on External URL.
  if (source?.type === "url" && url && NOT_STREAMABLE.test(url) && file) {
    return { src: file, type: mimeFor(file, source?.fileMime) };
  }

  const fromCms = source?.type === "url" ? url : file;

  if (!fromCms) {
    const src = upgradeCloudinaryVideo(fallback);
    return { src, type: mimeFor(src) };
  }

  if (source?.type === "url") {
    // YouTube and Vimeo can never play here, so show the default video instead
    // of an empty section.
    if (/(youtube\.com|youtu\.be|vimeo\.com)/i.test(fromCms)) {
      const src = upgradeCloudinaryVideo(fallback);
      return { src, type: mimeFor(src) };
    }
    const src = upgradeCloudinaryVideo(directDriveUrl(fromCms));
    return { src, type: mimeFor(src) };
  }

  return { src: fromCms, type: mimeFor(fromCms, source?.fileMime) };
}
