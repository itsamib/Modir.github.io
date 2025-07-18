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
      <AppBody>
        {children}
        <Toaster />
      </AppBody>
    </LanguageProvider>
  );
}
