'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
  { href: ROUTES.FOR_YOU, labelKey: 'nav.forYou', authOnly: true },
];

interface HeaderProps {
  user?: SupabaseUser | null;
}

export function Header({ user }: HeaderProps = {}) {
  const pathname = usePathname();
  const { t, language } = useI18n();

  // Preload map chunk in background after initial page paint (works on mobile + desktop)
  useEffect(() => {
    const id = setTimeout(() => {
      import('@/components/map/cafe-map-dynamic').then(mod => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mod.CafeMapWrapperDynamic as any).preload?.();
      });
    }, 2000);
    return () => clearTimeout(id);
  }, []);

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
        <Link href={ROUTES.HOME} prefetch={false} className="flex items-center gap-2 min-h-[44px] shrink-0 md:flex-1 px-1 md:px-2.5" aria-label="Seoul Cafe Guide home">
          <CoffeeIcon className="h-6 w-6" aria-hidden="true" />
          <span className="font-semibold hidden md:inline">{t('site.name')}</span>
        </Link>

        {/* Navigation - centered on desktop, compact pills on mobile */}
        <nav aria-label="Main navigation" className="flex flex-1 min-w-0 items-center justify-center md:flex-none md:gap-6">
          <div className="flex items-center min-w-0 rounded-full bg-muted/50 p-0.5 md:bg-transparent md:p-0 md:gap-6">
            {NAV_ITEMS.filter((item) => !item.authOnly || !!user).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    'relative font-medium transition-colors flex items-center justify-center',
                    // Mobile: compact pill style, smaller for Vietnamese
                    language === 'vi'
                      ? 'text-[10px] px-1 py-1 rounded-full min-h-[30px] min-w-0 truncate'
                      : 'text-xs px-2.5 py-1.5 rounded-full min-h-[32px] min-w-0 truncate',
                    // Desktop: larger text with underline style (same for all)
                    'md:text-sm md:px-0 md:py-0 md:rounded-none md:min-h-[44px] md:border-b-2 md:whitespace-nowrap md:overflow-visible',
                    isActive
                      ? 'text-foreground md:bg-transparent md:shadow-none md:border-foreground'
                      : 'text-muted-foreground md:text-foreground md:border-transparent hover:text-foreground md:hover:border-foreground'
                  )}
                >
                  {/* Mobile sliding pill indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-background shadow-sm md:hidden"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0 md:flex-1 md:justify-end">
          {/* Language switcher: always on desktop, only when not logged in on mobile (logged-in users have it in their menu) */}
          <div className={cn(user ? 'hidden md:block' : '')}>
            <LanguageSwitcher />
          </div>
          {user ? (
            <UserMenu user={user} />
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
                <Link href={ROUTES.LOGIN} prefetch={false}>{t('nav.login')}</Link>
              </Button>
              <Button size="sm" asChild className="min-h-[44px]">
                <Link href={ROUTES.SIGNUP} prefetch={false}>{t('nav.signup')}</Link>
              </Button>
            </div>
          )}
          {/* Mobile auth - single button */}
          {!user && (
            <Button size="sm" asChild className="md:hidden min-h-[32px]">
              <Link href={ROUTES.LOGIN} prefetch={false}>{t('nav.login')}</Link>
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
