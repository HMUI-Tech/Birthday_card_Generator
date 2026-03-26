import { createHash } from "node:crypto";

import { resolveAutoFilterStyle } from "@/lib/media-presentation";

type SignatureParams = Record<string, string | number | undefined>;

function sha1Hex(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folderBase = process.env.CLOUDINARY_FOLDER_BASE || "digital-card-app";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  return { cloudName, apiKey, apiSecret, folderBase };
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function signCloudinaryParams(params: SignatureParams) {
  const { apiSecret } = getCloudinaryConfig();

  const serialized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return sha1Hex(`${serialized}${apiSecret}`);
}

export function verifyCloudinaryUploadResponse(publicId: string, version: string, signature: string) {
  const { apiSecret } = getCloudinaryConfig();
  const expected = sha1Hex(`public_id=${publicId}&version=${version}${apiSecret}`);
  return expected === signature;
}

export function getCloudinaryUploadUrl() {
  const { cloudName } = getCloudinaryConfig();
  return `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
}

export function buildCloudinaryDeliveryUrl({
  publicId,
  resourceType,
  placement = "inside-strip",
  filterStyle = "auto",
  occasion,
  theme,
}: {
  publicId: string;
  resourceType: string;
  placement?: string;
  filterStyle?: string;
  occasion?: string | null;
  theme?: string | null;
}) {
  const { cloudName } = getCloudinaryConfig();

  if (resourceType === "video") {
    return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto,f_auto:video/${publicId}`;
  }

  const resolvedFilterStyle = resolveAutoFilterStyle({
    filterStyle,
    occasion,
    theme,
  });
  const sizeTransform =
    placement === "cover"
      ? "c_fill,g_auto,w_1200,h_1500"
      : placement === "inside-feature"
        ? "c_fill,g_auto,w_1200,h_900"
        : placement === "back-accent"
          ? "c_fill,g_auto,w_720,h_720"
          : "c_fill,g_auto,w_900,h_700";

  const effectTransform =
    resolvedFilterStyle === "cinematic"
      ? "e_improve,e_contrast:18,e_saturation:-8"
      : resolvedFilterStyle === "vintage"
        ? "e_sepia:35,e_brightness:8,e_contrast:-5"
        : resolvedFilterStyle === "neon"
          ? "e_saturation:45,e_contrast:20"
          : resolvedFilterStyle === "minimalist"
            ? "e_grayscale,e_contrast:12,e_brightness:10"
            : "e_brightness:8,e_saturation:6";

  return `https://res.cloudinary.com/${cloudName}/image/upload/${sizeTransform},${effectTransform},q_auto,f_auto/${publicId}`;
}
