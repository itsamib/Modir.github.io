"use client"

import { useLanguage } from "@/context/language-context";
import { useEffect } from "react";

export function AppBody({ children }: { children: React.ReactNode }) {
    const { language, direction } = useLanguage();

    useEffect(() => {
        // This effect runs on the client after hydration
        // and safely updates the document attributes.
        document.documentElement.lang = language;
        document.documentElement.dir = direction;
    }, [language, direction]);

    return <>{children}</>;
}
