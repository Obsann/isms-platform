import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Hide the Next.js "N" badge in the corner during `next dev`.
  // Compile/runtime errors still surface through the error overlay.
  devIndicators: false,
};

export default nextConfig