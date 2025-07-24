// next.config.js

import type { NextConfig } from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // این تنظیمات برای GitHub Pages و PWA ضروری هستند
  runtimeCaching: [], // می‌توانید اینجا قوانین کشینگ خود را اضافه کنید
  buildExcludes: [/middleware-manifest.json$/],
});

const nextConfig: NextConfig = {
  // فعال سازی خروجی استاتیک برای GitHub Pages
  output: 'export',

  // این خط برای GitHub Pages که پروژه در یک ساب‌دایرکتوری میزبانی می‌شود، حیاتی است.
  // 'Modir.github.io' باید دقیقاً با نام ریپازیتوری شما مطابقت داشته باشد.
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
