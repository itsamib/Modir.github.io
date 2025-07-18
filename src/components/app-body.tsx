"use client"

import { useLanguage } from "@/context/language-context";
import { useEffect } from "react";

export function AppBody({ children }: { children: React.ReactNode }) {
    const { language, direction } = useLanguage();

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = language;
            document.documentElement.dir = direction;
        }
    }, [language, direction]);

    return (
        <>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
            </head>
            <body className="font-body antialiased bg-background text-foreground">
                {children}
            </body>
        </>
    )
}
