import { defaultFloorPlanSize } from "../data/defaultFloorPlan";
import type { FloorPlanSize } from "../types";

export function readImageSize(file: File): Promise<FloorPlanSize> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      resolve({
        width: image.naturalWidth || defaultFloorPlanSize.width,
        height: image.naturalHeight || defaultFloorPlanSize.height,
      });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read image size"));
    };

    image.src = objectUrl;
  });
}

export async function fileToDataUrl(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return `data:${file.type};base64,${btoa(binary)}`;
}
