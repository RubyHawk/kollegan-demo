import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@platform/auth/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
]);

function extractToken(req: NextRequest): string {
  return (
    req.headers.get('authorization')?.slice(7) ??
    req.cookies.get('at')?.value ??
    req.cookies.get('token')?.value ??
    ''
  );
}

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ detail: 'Authentication required' }, { status: 401 });
    }

    const payload = await verifyToken(token).catch(() => null);
    if (!payload?.orgId) {
      return NextResponse.json({ detail: 'No organization context' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ detail: 'Ingen bildfil hittades i uppladdningen.' }, { status: 400 });
    }

    const extension = ALLOWED_TYPES.get(file.type);
    if (!extension) {
      return NextResponse.json({ detail: 'Bildformatet stöds inte. Använd JPG, PNG, WebP, AVIF eller GIF.' }, { status: 415 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ detail: 'Bilden är för stor. Max 8 MB.' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = path.join(process.cwd(), 'public', 'uploads', 'templates', payload.orgId);
    await mkdir(folder, { recursive: true });

    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const destination = path.join(folder, filename);
    await writeFile(destination, buffer);

    return NextResponse.json({
      url: `/uploads/templates/${payload.orgId}/${filename}`,
    });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Bilduppladdning misslyckades' },
      { status: 500 },
    );
  }
}
