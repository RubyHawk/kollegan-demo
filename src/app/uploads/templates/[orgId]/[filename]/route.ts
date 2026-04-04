import { readFile } from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTENT_TYPES = new Map<string, string>([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.avif', 'image/avif'],
  ['.gif', 'image/gif'],
]);

function isSafeSegment(value: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(value);
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<unknown> },
) {
  const { orgId, filename } = (await context.params) as { orgId: string; filename: string };

  if (!isSafeSegment(orgId) || !isSafeSegment(filename)) {
    return new Response('Invalid path', { status: 400 });
  }

  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads', 'templates');
  const absolutePath = path.join(uploadsRoot, orgId, filename);
  const resolvedPath = path.resolve(absolutePath);
  const resolvedRoot = path.resolve(uploadsRoot);

  if (!resolvedPath.startsWith(resolvedRoot)) {
    return new Response('Invalid path', { status: 400 });
  }

  try {
    const buffer = await readFile(resolvedPath);
    const extension = path.extname(filename).toLowerCase();
    const contentType = CONTENT_TYPES.get(extension) ?? 'application/octet-stream';
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
