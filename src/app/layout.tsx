import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from '@/context/language-context';
import { AppBody } from '@/components/app-body';

export const metadata: Metadata = {
  title: 'حسابدار ساختمانی',
  description: 'اپلیکیشن مدیریت ساختمان',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <html lang="fa" dir="rtl">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
        </head>
        <body className="font-body antialiased bg-background text-foreground flex flex-col min-h-screen">
            <AppBody>
              <div className="flex-grow">
                {children}
              </div>
              <Toaster />
            </AppBody>
        </body>
      </html>
    </LanguageProvider>
  );
}
