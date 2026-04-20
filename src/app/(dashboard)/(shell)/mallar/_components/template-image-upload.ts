'use client';

import { uploadTemplateAsset } from '@shared/lib/api/templates.api';

const MAX_TEMPLATE_IMAGE_BYTES = 8 * 1024 * 1024;

function fileExtensionFor(type: string): string {
  switch (type) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
}

function dataUrlToFile(dataUrl: string, fallbackName = 'template-image'): File {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Ogiltigt bildformat. Ladda upp bilden igen.');
  }

  const [, mimeType, base64] = match;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], `${fallbackName}.${fileExtensionFor(mimeType)}`, { type: mimeType });
}

export async function uploadTemplateImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Endast bildfiler kan användas i mallar.');
  }
  if (file.size > MAX_TEMPLATE_IMAGE_BYTES) {
    throw new Error('Bilden är för stor. Använd en bild under 8 MB.');
  }

  return uploadTemplateAsset(file);
}

export async function normalizeTemplateImages<T>(value: T): Promise<T> {
  const cache = new Map<string, string>();

  async function normalizeImageUrl(src: string): Promise<string> {
    if (!src.startsWith('data:image/')) return src;

    let uploadedUrl = cache.get(src);
    if (!uploadedUrl) {
      uploadedUrl = await uploadTemplateImage(dataUrlToFile(src));
      cache.set(src, uploadedUrl);
    }
    return uploadedUrl;
  }

  async function walk(node: unknown): Promise<unknown> {
    if (Array.isArray(node)) {
      return Promise.all(node.map(walk));
    }

    if (!node || typeof node !== 'object') {
      return node;
    }

    const record = node as Record<string, unknown>;
    const cloned: Record<string, unknown> = {};

    for (const [key, rawValue] of Object.entries(record)) {
      if (
        key === 'attrs' &&
        rawValue &&
        typeof rawValue === 'object' &&
        typeof (rawValue as Record<string, unknown>).src === 'string'
      ) {
        const attrs = { ...(rawValue as Record<string, unknown>) };
        const src = attrs.src as string;
        attrs.src = await normalizeImageUrl(src);
        cloned[key] = attrs;
        continue;
      }

      if (
        key === 'backgroundImageSrc' &&
        typeof rawValue === 'string'
      ) {
        cloned[key] = await normalizeImageUrl(rawValue);
        continue;
      }

      cloned[key] = await walk(rawValue);
    }

    return cloned;
  }

  return walk(value) as Promise<T>;
}
