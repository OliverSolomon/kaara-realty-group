import { createImageElement, createPage, type PageData } from "@canvix/lib/types";

export interface DesignImage {
  url: string;
  width: number;
  height: number;
  name?: string | null;
}

export type DesignLayout = "pages" | "grid";

const editorUrl = (url: string) => `${url}?w=2400&fit=max&auto=format`;

/** Fits a photo whole inside a box, centred. */
function placed(image: DesignImage, x: number, y: number, boxWidth: number, boxHeight: number) {
  const scale = Math.min(boxWidth / image.width, boxHeight / image.height);
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  return createImageElement(editorUrl(image.url), image.width, image.height, {
    x: Math.round(x + (boxWidth - width) / 2),
    y: Math.round(y + (boxHeight - height) / 2),
    width,
    height,
    radius: 0,
    name: image.name ?? "Photo",
  });
}

/** One photo per page, or all of them arranged on a single page. */
export function pagesFromImages(images: DesignImage[], width: number, height: number, layout: DesignLayout): PageData[] {
  const background = { type: "solid", color: "#100b28" } as const;
  if (layout === "pages" || images.length === 1) {
    return images.map((image) => {
      const page = createPage(background);
      page.elements = [placed(image, 0, 0, width, height)];
      return page;
    });
  }
  const columns = Math.ceil(Math.sqrt(images.length * (width / height)));
  const rows = Math.ceil(images.length / columns);
  const gap = Math.round(Math.min(width, height) * 0.015);
  const cellWidth = (width - gap * (columns + 1)) / columns;
  const cellHeight = (height - gap * (rows + 1)) / rows;
  const page = createPage(background);
  page.elements = images.map((image, index) =>
    placed(
      image,
      gap + (index % columns) * (cellWidth + gap),
      gap + Math.floor(index / columns) * (cellHeight + gap),
      cellWidth,
      cellHeight
    )
  );
  return [page];
}
