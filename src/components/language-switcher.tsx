'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Flag } from '@/components/ui/flag';
import { useI18n, LanguageCode } from '@/lib/i18n';

export function LanguageSwitcher() {
  const router = useRouter();
  const { language, setLanguage, languages } = useI18n();
  const currentLanguage = languages[language];

  const handleLanguageChange = (langCode: LanguageCode) => {
    setLanguage(langCode);
    // Refresh to update server-rendered content with new language
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Flag language={language} size={20} />
          <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.values(languages).map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code as LanguageCode)}
            className={language === lang.code ? 'bg-accent' : ''}
          >
            <Flag language={lang.code} size={18} className="mr-2" />
            <span>{lang.nativeName}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
