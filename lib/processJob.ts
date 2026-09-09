import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { getWorkerSecret } from "./auth";
import { getConvexHttpClient } from "./convex";
import { PNG_SOURCES } from "./pngSources";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

async function downloadPng(url: string): Promise<Uint8Array> {
  const response = await fetch(url, {
    headers: { Accept: "image/png" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to download PNG (${response.status}): ${url}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const isPng = PNG_MAGIC.every((value, index) => bytes[index] === value);
  if (!isPng) {
    throw new Error(`Downloaded file is not a PNG: ${url}`);
  }

  return bytes;
}

async function bundlePdf(
  images: Array<{ label: string; bytes: Uint8Array }>,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Job POC image bundle");
  pdf.setAuthor("job-poc Vercel Function");
  pdf.setProducer("job-poc");

  const font = await pdf.embedFont(StandardFonts.Helvetica);

  for (const image of images) {
    const png = await pdf.embedPng(image.bytes);
    const maxWidth = 720;
    const scale = png.width > maxWidth ? maxWidth / png.width : 1;
    const width = png.width * scale;
    const height = png.height * scale;
    const page = pdf.addPage([width, height + 36]);

    page.drawImage(png, {
      x: 0,
      y: 36,
      width,
      height,
    });
    page.drawText(image.label, {
      x: 16,
      y: 14,
      size: 10,
      font,
      color: rgb(0.15, 0.16, 0.18),
    });
  }

  return await pdf.save();
}

export async function processJob(jobId: Id<"jobs">): Promise<void> {
  const convex = getConvexHttpClient();
  const workerSecret = getWorkerSecret();

  try {
    await convex.mutation(api.jobs.markStarted, { workerSecret, jobId });

    const images: Array<{ label: string; bytes: Uint8Array }> = [];
    for (const [index, source] of PNG_SOURCES.entries()) {
      await convex.mutation(api.jobs.markDownloading, {
        workerSecret,
        jobId,
        downloadedCount: index + 1,
      });
      images.push({
        label: source.label,
        bytes: await downloadPng(source.url),
      });
    }

    await convex.mutation(api.jobs.markBundling, { workerSecret, jobId });
    const pdfBytes = await bundlePdf(images);

    await convex.mutation(api.jobs.markUploading, { workerSecret, jobId });
    const uploadUrl = await convex.mutation(api.jobs.generateUploadUrl, {
      workerSecret,
    });

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: Buffer.from(pdfBytes),
    });

    if (!uploadResponse.ok) {
      throw new Error(`PDF upload failed (${uploadResponse.status})`);
    }

    const uploaded = (await uploadResponse.json()) as { storageId: Id<"_storage"> };

    await convex.mutation(api.jobs.complete, {
      workerSecret,
      jobId,
      pdfStorageId: uploaded.storageId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await convex.mutation(api.jobs.fail, {
      workerSecret,
      jobId,
      error: message,
    });
  }
}
