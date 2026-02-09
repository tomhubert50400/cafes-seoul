'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { UserMenu } from '@/components/auth/user-menu';
import { ROUTES } from '@/lib/constants/routes';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: ROUTES.CAFES, labelKey: 'nav.cafes' },
  { href: ROUTES.MAP, labelKey: 'nav.map' },
  { href: ROUTES.FOR_YOU, labelKey: 'nav.forYou' },
];

interface HeaderProps {
  user?: SupabaseUser | null;
}

export function Header({ user }: HeaderProps = {}) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:p-4 focus:bg-background focus:text-foreground focus:border focus:rounded-md focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
        {/* Logo - icon only on mobile, icon + name on desktop */}
        <Link href={ROUTES.HOME} className="flex items-center gap-2 min-h-[44px] shrink-0 md:flex-1 px-2.5" aria-label="Seoul Cafe Guide home">
          <CoffeeIcon className="h-6 w-6" aria-hidden="true" />
          <span className="font-semibold hidden md:inline">{t('site.name')}</span>
        </Link>

        {/* Navigation - centered on desktop, slightly left on mobile */}
        <nav aria-label="Main navigation" className="flex flex-1 items-center justify-center gap-2 md:flex-none md:gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] flex items-center',
                'text-foreground border-b-2',
                'hover:border-foreground',
                pathname === item.href ? 'border-foreground' : 'border-transparent'
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0 md:flex-1 md:justify-end">
          <LanguageSwitcher />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
                <Link href={ROUTES.LOGIN}>{t('nav.login')}</Link>
              </Button>
              <Button size="sm" asChild className="min-h-[44px]">
                <Link href={ROUTES.SIGNUP}>{t('nav.signup')}</Link>
              </Button>
            </div>
          )}
          {/* Mobile auth - single button */}
          {!user && (
            <Button size="sm" asChild className="md:hidden min-h-[44px]">
              <Link href={ROUTES.LOGIN}>{t('nav.login')}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}
