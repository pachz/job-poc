import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PNG } from "pngjs";
import { api } from "../convex/_generated/api.js";
import type { Id } from "../convex/_generated/dataModel";
import { getWorkerSecret } from "./auth.js";
import { getConvexHttpClient } from "./convex.js";
import { PNG_SIZE, PNG_SOURCES } from "./pngSources.js";

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

function scalePngToTarget(bytes: Uint8Array, size: number): Uint8Array {
  const source = PNG.sync.read(Buffer.from(bytes));
  const dest = new PNG({ width: size, height: size, fill: true });

  for (let y = 0; y < size; y += 1) {
    const srcY = Math.min(source.height - 1, Math.floor((y * source.height) / size));
    for (let x = 0; x < size; x += 1) {
      const srcX = Math.min(source.width - 1, Math.floor((x * source.width) / size));
      const srcIdx = (srcY * source.width + srcX) << 2;
      const dstIdx = (y * size + x) << 2;
      dest.data[dstIdx] = source.data[srcIdx] ?? 0;
      dest.data[dstIdx + 1] = source.data[srcIdx + 1] ?? 0;
      dest.data[dstIdx + 2] = source.data[srcIdx + 2] ?? 0;
      dest.data[dstIdx + 3] = source.data[srcIdx + 3] ?? 255;
    }
  }

  return PNG.sync.write(dest);
}

export async function processJob(jobId: Id<"jobs">): Promise<void> {
  const convex = getConvexHttpClient();
  const workerSecret = getWorkerSecret();

  try {
    await convex.mutation(api.jobs.markStarted, { workerSecret, jobId });

    const pdf = await PDFDocument.create();
    pdf.setTitle("Job POC image bundle");
    pdf.setAuthor("job-poc Vercel Function");
    pdf.setProducer("job-poc");
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    for (const [index, source] of PNG_SOURCES.entries()) {
      await convex.mutation(api.jobs.markDownloading, {
        workerSecret,
        jobId,
        downloadedCount: index + 1,
      });

      const downloaded = await downloadPng(source.url);
      const scaled = scalePngToTarget(downloaded, PNG_SIZE);
      const png = await pdf.embedPng(scaled);
      const page = pdf.addPage([PNG_SIZE, PNG_SIZE + 36]);
      page.drawImage(png, {
        x: 0,
        y: 36,
        width: PNG_SIZE,
        height: PNG_SIZE,
      });
      page.drawText(`${source.label} (${PNG_SIZE}x${PNG_SIZE})`, {
        x: 16,
        y: 14,
        size: 10,
        font,
        color: rgb(0.15, 0.16, 0.18),
      });
    }

    await convex.mutation(api.jobs.markBundling, { workerSecret, jobId });
    const pdfBytes = await pdf.save();

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
