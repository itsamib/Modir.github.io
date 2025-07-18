"use client";

import { useLanguage } from '@/context/language-context';
import { useState, useEffect } from 'react';

export const CopyrightFooter = () => {
    const { t } = useLanguage();
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return null;
    }

    return (
        <footer className="w-full text-center p-4 text-xs text-muted-foreground border-t">
            {t('global.copyright')}
        </footer>
    );
};
