"use client";

import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/language-context';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const isEn = language === 'en';

  return (
    <header className="bg-card border-b shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold font-headline text-primary tracking-tight">
            {t('global.appName')}
          </Link>
          <div className="flex items-center gap-4">
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Label htmlFor="language-toggle" className="font-semibold text-xs sm:text-sm">{t('header.languageToggle')}</Label>
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
