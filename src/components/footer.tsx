'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CoffeeIcon className="h-5 w-5" />
              <span className="font-semibold">{t('site.name')}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Explore */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t('footer.explore')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/cafes" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.explore.cafes')}
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.explore.map')}
                </Link>
              </li>
              <li>
                <Link href="/roulette" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.explore.roulette')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t('footer.community')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/submit" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.community.submit')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.community.dashboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t('footer.legal')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.legal.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.legal.terms')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.legal.contact')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
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
