// next.config.js

import type { NextConfig } from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [], // می‌توانید اینجا قوانین کشینگ خود را اضافه کنید
  buildExcludes: [/middleware-manifest.json$/],
});

const nextConfig: NextConfig = {
  output: 'export', // فعال سازی خروجی استاتیک

  // **اینجا اصلاح شد:** basePath باید دقیقاً با نام ریپازیتوری شما مطابقت داشته باشد.
  // نام ریپازیتوری شما: Modir.github.io
  basePath: process.env.NODE_ENV === 'production' ? '/Modir.github.io' : '',

  trailingSlash: true, // اضافه کردن اسلش انتهایی به URLها

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
    ignoreBuildErrors: true, // نادیده گرفتن خطاهای TypeScript در زمان Build
  },
  eslint: {
    ignoreDuringBuilds: true, // نادیده گرفتن خطاهای ESLint در زمان Build
  },
};

export default withPWA(nextConfig);
