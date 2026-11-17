import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Hide the Next.js "N" badge in the corner during `next dev`.
  // Compile/runtime errors still surface through the error overlay.
  devIndicators: false,
  // Cloud Agent / Cursor port-forwards often hit the app as 127.0.0.1:<random>.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  // Same-origin /api → Nest, so one forwarded port is enough in the browser.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig