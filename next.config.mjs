/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  transpilePackages: ['remark-math', 'rehype-katex'],
}

export default nextConfig
