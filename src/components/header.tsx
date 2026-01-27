'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LogoutButton } from '@/components/auth/logout-button';
import { ROUTES } from '@/lib/constants/routes';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: ROUTES.CAFES, labelKey: 'nav.cafes' },
  { href: ROUTES.MAP, labelKey: 'nav.map' },
  { href: ROUTES.DISTRICTS, labelKey: 'nav.districts' },
];

interface HeaderProps {
  user?: { email?: string } | null;
}

export function Header({ user }: HeaderProps = {}) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href={ROUTES.HOME} className="flex items-center gap-2">
          <CoffeeIcon className="h-6 w-6" />
          <span className="font-semibold">{t('site.name')}</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-foreground',
                pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <LogoutButton />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.LOGIN}>{t('nav.login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={ROUTES.SIGNUP}>{t('nav.signup')}</Link>
              </Button>
            </>
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
