import { toBlob } from "html-to-image";

/** Captures the rendered group card locally, so the PNG always matches the UI. */
export async function createGroupShareImage(element: HTMLElement): Promise<Blob> {
  const blob = await toBlob(element, {
    backgroundColor: "#fffbf4",
    cacheBust: true,
    pixelRatio: 2,
  });
  if (!blob) throw new Error("Could not create the share image.");
  return blob;
}

export function downloadGroupShareImage(blob: Blob, filename = "pokomatch-group.png"): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
