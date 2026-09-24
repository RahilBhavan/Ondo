/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporary until the home page is on real data (#25, reverted in #30).
  async redirects() {
    return [{ source: '/', destination: '/flows', permanent: false }];
  },
};

export default nextConfig;
