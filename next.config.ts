import type {NextConfig} from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // اضافه کردن این تنظیمات برای GitHub Pages
  runtimeCaching: [],
  buildExcludes: [/middleware-manifest.json$/],
});

const nextConfig: NextConfig = {
  output: 'export', // فعال سازی خروجی استاتیک
  basePath: process.env.NODE_ENV === 'production' ? '/my-firebase-app-' : '', // نام ریپوی شما
  trailingSlash: true,
  images: {
    unoptimized: true, // غیرفعال کردن بهینه‌سازی تصاویر برای خروجی استاتیک
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);
