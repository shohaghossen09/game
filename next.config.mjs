/** @type {import('next').NextConfig} */
const nextConfig = {
  // The engine owns a single-init imperative lifecycle; strict-mode
  // double-mounting the canvas in dev adds risk with no benefit here.
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true }
};

export default nextConfig;
