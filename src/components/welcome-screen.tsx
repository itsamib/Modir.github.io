
"use client"

import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

interface WelcomeScreenProps {
    isFading: boolean;
}

export function WelcomeScreen({ isFading }: WelcomeScreenProps) {
    const { t } = useLanguage();
    
    return (
        <div className={cn(
            "fixed inset-0 flex flex-col items-center justify-center bg-background z-50 transition-opacity duration-500",
            isFading ? "opacity-0" : "opacity-100"
        )}>
            <div className="flex flex-col items-center gap-6 animate-fade-in-slow">
                <Building2 className="w-24 h-24 text-primary" />
                <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">
                    {t('global.appName')}
                </h1>
            </div>
        </div>
    );
}
