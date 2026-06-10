import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { FloorPlanSize } from "../types";

GlobalWorkerOptions.workerSrc = pdfWorker;

export interface RenderedPdfFloorPlan {
  image: string;
  size: FloorPlanSize;
}

export interface PdfBoothLabel {
  code: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
}

async function withPdfDocument<T>(
  source: string | Uint8Array,
  run: (
    pdf: any,
    loadingTask: ReturnType<typeof getDocument>,
  ) => Promise<T>,
): Promise<T> {
  const loadingTask =
    typeof source === "string"
      ? getDocument({ url: source })
      : getDocument({
          data: source,
        });

  const pdf = await loadingTask.promise;

  try {
    return await run(pdf, loadingTask);
  } finally {
    pdf.cleanup();
    await loadingTask.destroy();
  }
}

export async function renderPdfFloorPlan(
  source: string | Uint8Array,
): Promise<RenderedPdfFloorPlan> {
  return withPdfDocument(source, async (pdf) => {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create a 2D canvas context for PDF rendering.");
    }

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;

    return {
      image: canvas.toDataURL("image/png"),
      size: {
        width: canvas.width,
        height: canvas.height,
      },
    };
  });
}

export async function extractPdfBoothLabels(
  source: string | Uint8Array,
): Promise<PdfBoothLabel[]> {
  return withPdfDocument(source, async (pdf) => {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const text = await page.getTextContent();
    const boothPattern = /^(A\d+(?:\/\d+)?(?:,\s*A\d+(?:\/\d+)?)?|M\d+(?:\/\d+)?)$/i;

    return (text.items as Array<any>)
      .filter(
        (item): item is any =>
          "str" in item && typeof item.str === "string" && boothPattern.test(item.str.trim()),
      )
      .map((item: any) => {
        const [x, y] = viewport.convertToViewportPoint(
          item.transform[4],
          item.transform[5],
        );

        return {
          code: item.str.trim(),
          x,
          y,
          width: item.width,
          height: item.height,
          pageWidth: viewport.width,
          pageHeight: viewport.height,
        };
      })
      .sort(
        (left: PdfBoothLabel, right: PdfBoothLabel) =>
          left.x - right.x || left.y - right.y,
      );
  });
}
