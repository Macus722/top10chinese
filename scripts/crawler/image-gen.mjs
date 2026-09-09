// Resolves a featured image for a crawled article, ported from mcn-singapore's
// src/lib/crawler/image-gen.ts. Same three-tier fallback (source photo -> Gemini illustration ->
// kie.ai illustration), same non-fatal/never-throws contract. The illustration prompt's palette
// and art direction match 全球十大华人 (top10chinese) -- vermilion red #BB0002 / warm off-white
// #FAF9F6 / near-black #1B1C1A / muted gold #C5A059, a serious Chinese-editorial register.


import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "node:crypto";
import { supabase } from "./lib/supabase.mjs";
import { getErrorMessage } from "./lib/errors.mjs";

const IMAGE_MODEL = "gemini-3.1-flash-image-preview";
const BUCKET = "article-images";

const EXTENSION_BY_CONTENT_TYPE = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** @param {string} contentType @returns {string} */
function extensionFor(contentType) {
  const normalized = contentType.split(";")[0].trim().toLowerCase();
  return EXTENSION_BY_CONTENT_TYPE[normalized] ?? "jpg";
}

/** @param {Buffer} buffer @param {string} contentType @returns {Promise<string|null>} */
async function uploadBufferToStorage(buffer, contentType) {
  if (!supabase) return null;
  const objectPath = `${randomUUID()}.${extensionFor(contentType)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, { contentType, upsert: false });
  if (error) {
    console.error("[crawler] Supabase Storage upload failed:", error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

/**
 * Fetches the source article's own photo and re-uploads it to Supabase Storage. Returns null on
 * any failure -- non-fatal, caller falls back to AI generation. Only a real raster photo
 * content-type is accepted (not svg/html/etc) -- same bug-fix as Singapore's version, where a
 * source page's reported "main image" turned out to be a small logo graphic.
 * @param {string} sourceImageUrl
 */
export async function fetchAndUploadSourceImage(sourceImageUrl) {
  try {
    const res = await fetch(sourceImageUrl);
    if (!res.ok) return null;

    const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!(contentType in EXTENSION_BY_CONTENT_TYPE)) {
      console.log(
        `[crawler] source image at ${sourceImageUrl} is not a real photo (content-type: "${contentType || "none"}") — falling back to AI illustration`,
      );
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    return await uploadBufferToStorage(Buffer.from(arrayBuffer), contentType);
  } catch (err) {
    console.error("[crawler] fetchAndUploadSourceImage failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** @param {string} title @param {string} imageAlt @returns {string} */
function buildIllustrationPrompt(title, imageAlt) {
  return (
    `A restrained, abstract editorial illustration for a Chinese-language analysis article about ` +
    `the global Chinese business world (全球十大华人) titled "${title}". Visual concept: ${imageAlt}. ` +
    `Style: serious business-editorial illustration, archival/index aesthetic, no text or logos ` +
    `anywhere in the image, no photorealism, no recognizable human faces (silhouettes or abstract ` +
    `figures only), no cartoons, no neon, no glossy 3D, no glitter, no lens flare. ` +
    `Color palette strictly limited to: warm off-white (#F5F4F0) as the dominant ground, ` +
    `near-black (#1B1C1A) for forms and linework, vermilion red (#BB0002) as a deliberate accent, ` +
    `and a small amount of muted gold (#C5A059). Flat matte finish, subtle grain acceptable. ` +
    `Wide 16:9 composition suitable for a website article header.`
  );
}

/**
 * Generates an abstract brand-palette illustration directly via Gemini and uploads it to
 * Supabase Storage. First AI fallback tier.
 * @param {string} title
 * @param {string} imageAlt
 */
export async function generateArticleImage(title, imageAlt) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[crawler] GEMINI_API_KEY not set — skipping Gemini illustration generation.");
    return null;
  }
  if (!supabase) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: buildIllustrationPrompt(title, imageAlt),
      config: { imageConfig: { aspectRatio: "16:9" } },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      console.error("[crawler] generateArticleImage: no image data in Gemini response");
      return null;
    }

    const mimeType = imagePart.inlineData.mimeType || "image/png";
    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    return await uploadBufferToStorage(buffer, mimeType);
  } catch (err) {
    console.error("[crawler] generateArticleImage failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

// --- kie.ai fallback (Nano Banana 2) --------------------------------------
const KIE_API_BASE = "https://api.kie.ai";
const KIE_MODEL = "nano-banana-2";
const KIE_POLL_INTERVAL_MS = 3000;
const KIE_MAX_POLL_ATTEMPTS = 20;

/** @param {string} path @param {RequestInit} [init] */
async function kieRequest(path, init) {
  const res = await fetch(`${KIE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.KIE_API_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  return res.json();
}

/** @param {number} ms */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @param {string} taskId @returns {Promise<string|null>} */
async function pollKieTask(taskId) {
  for (let attempt = 0; attempt < KIE_MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(KIE_POLL_INTERVAL_MS);

    const detail = await kieRequest(`/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`);
    const state = detail.data?.state;

    if (state === "success") {
      const resultUrls = JSON.parse(detail.data?.resultJson ?? "{}").resultUrls;
      return resultUrls?.[0] ?? null;
    }
    if (state === "fail") {
      console.error(`[crawler] kie.ai task ${taskId} failed: ${detail.data?.failMsg ?? detail.msg}`);
      return null;
    }
  }

  console.error(`[crawler] kie.ai task ${taskId} timed out after ${KIE_MAX_POLL_ATTEMPTS} polls`);
  return null;
}

/**
 * Generates an abstract brand-palette illustration via kie.ai's Nano Banana 2 API. Second AI
 * fallback tier, only reached when direct Gemini generation fails.
 * @param {string} title
 * @param {string} imageAlt
 */
export async function generateArticleImageViaKie(title, imageAlt) {
  if (!process.env.KIE_API_KEY) {
    console.warn("[crawler] KIE_API_KEY not set — skipping kie.ai illustration generation.");
    return null;
  }
  if (!supabase) return null;

  try {
    const created = await kieRequest("/api/v1/jobs/createTask", {
      method: "POST",
      body: JSON.stringify({
        model: KIE_MODEL,
        input: {
          prompt: buildIllustrationPrompt(title, imageAlt),
          aspect_ratio: "16:9",
          resolution: "1K",
          output_format: "jpg",
        },
      }),
    });

    const taskId = created.data?.taskId;
    if (created.code !== 200 || !taskId) {
      console.error(`[crawler] kie.ai createTask failed (code ${created.code}): ${created.msg}`);
      return null;
    }

    const resultUrl = await pollKieTask(taskId);
    if (!resultUrl) return null;

    const imageRes = await fetch(resultUrl);
    if (!imageRes.ok) {
      console.error(`[crawler] failed to download kie.ai result image: HTTP ${imageRes.status}`);
      return null;
    }
    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    return await uploadBufferToStorage(buffer, contentType);
  } catch (err) {
    console.error("[crawler] generateArticleImageViaKie failed:", getErrorMessage(err));
    return null;
  }
}

/**
 * Resolves the featured image for a crawled article, in order: the source article's own photo, a
 * direct Gemini illustration, then a kie.ai illustration. Never throws.
 * @param {string|null} sourceImageUrl
 * @param {string} title
 * @param {string} imageAlt
 */
export async function resolveArticleImage(sourceImageUrl, title, imageAlt) {
  if (sourceImageUrl) {
    const uploaded = await fetchAndUploadSourceImage(sourceImageUrl);
    if (uploaded) return uploaded;
    console.log("[crawler] source image fetch/upload failed, falling back to AI illustration");
  }

  const viaGemini = await generateArticleImage(title, imageAlt);
  if (viaGemini) return viaGemini;

  console.log("[crawler] Gemini illustration failed, falling back to kie.ai");
  return generateArticleImageViaKie(title, imageAlt);
}
