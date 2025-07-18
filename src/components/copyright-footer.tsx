"use client";

import { useLanguage } from '@/context/language-context';

export const CopyrightFooter = () => {
    const { t } = useLanguage();
    return (
        <footer className="w-full text-center p-4 text-xs text-muted-foreground border-t">
            {t('global.copyright')}
        </footer>
    );
};
