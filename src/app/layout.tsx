// src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/context/language-context';
import { AppBody } from '@/components/app-body';
import { ThemeProvider } from '@/context/theme-provider';
import { CopyrightFooter } from '@/components/copyright-footer';
import { Inter, Space_Grotesk } from 'next/font/google'; // Import fonts using next/font

const APP_NAME = "مدیریت ساختمان";
const APP_DESCRIPTION = "اپلیکیشن مدیریت ساختمان";

// Define fonts using next/font for optimized loading
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Define CSS variable for Inter font
  display: 'swap', // Ensures text remains visible during font load
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk', // Define CSS variable for Space Grotesk font
  weight: ['500', '700'], // Specify weights used
  display: 'swap',
});

// تعریف متادیتا برای PWA شما
// Next.js اینها را به صورت بهینه در تگ <head> قرار می‌دهد.
export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json", // مسیر manifest.json نسبت به basePath
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  // **اضافه کردن صریح آیکون‌ها برای حل مشکل favicon.ico**
  // Next.js basePath را به این مسیر اضافه می‌کند.
  icons: {
    icon: '/favicon.ico', // فرض بر این است که favicon.ico در پوشه `public` شما قرار دارد
    // اگر apple-touch-icon.png دارید، آن را نیز اینجا اضافه کنید
    // apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      {/* حذف تگ <head> و استفاده از next/font برای مدیریت فونت‌ها */}
      {/* کلاس‌های فونت به body اضافه می‌شوند */}
      <html lang="fa" dir="rtl" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <body className="font-body antialiased bg-background text-foreground flex flex-col min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppBody>
              <div className="flex-grow">
                {children}
              </div>
              <Toaster />
              <CopyrightFooter />
            </AppBody>
          </ThemeProvider>
        </body>
      </html>
    </LanguageProvider>
  );
}
