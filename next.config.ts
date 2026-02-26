import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // instrumentation.ts is enabled by default in Next.js 15+
  async headers() {
    return [
      {
        source: '/api/sse',
        headers: [{ key: 'X-Accel-Buffering', value: 'no' }],
      },
    ];
  },
};

export default nextConfig;
