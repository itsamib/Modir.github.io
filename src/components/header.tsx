"use client";

import { Sun, Moon, Languages } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-card border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold font-headline text-primary tracking-tight">
            حسابدار ساختمانی
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Label htmlFor="language-toggle" className="font-semibold">FA / EN</Label>
              <Switch id="language-toggle" className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-gray-300"/>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
