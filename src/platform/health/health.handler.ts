import { NextResponse } from 'next/server';
import { getHealthCheck } from './health.service';

export async function handleHealthCheck() {
  const health = await getHealthCheck();

  return NextResponse.json(
    health,
    { status: health.status === 'ok' ? 200 : 503 }
  );
}
