"use client";

import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/language-context';

export function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const isEn = language === 'en';

  return (
    <header className="bg-card border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold font-headline text-primary tracking-tight">
            {t('global.appName')}
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Label htmlFor="language-toggle" className="font-semibold">{t('header.languageToggle')}</Label>
              <Switch 
                id="language-toggle" 
                checked={isEn}
                onCheckedChange={toggleLanguage}
                className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-gray-300"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
