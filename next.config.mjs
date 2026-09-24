/** @type {import('next').NextConfig} */
const nextConfig = {
  // Weekly flows may wait up to 60s on Blockscout 429s before falling back to mock data
  // (src/lib/flowEvents.ts); at the 60s default the build would fail instead.
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
