'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface AuthPromptContextType {
  openPrompt: () => void;
}

const AuthPromptContext = createContext<AuthPromptContextType>({
  openPrompt: () => {},
});

/* ------------------------------------------------------------------ */
/*  Dialog                                                             */
/* ------------------------------------------------------------------ */

function AuthPromptDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('auth.prompt.title')}</DialogTitle>
          <DialogDescription>{t('auth.prompt.description')}</DialogDescription>
        </DialogHeader>

        <OAuthButtons next={pathname} showDivider={false} />

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('auth.oauth.divider')}
            </span>
          </div>
        </div>

        {/* Email login + signup links */}
        <div className="flex flex-col items-center gap-2 text-sm">
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className="text-primary underline-offset-4 hover:underline"
            onClick={() => onOpenChange(false)}
          >
            {t('auth.prompt.emailLink')}
          </Link>
          <Link
            href="/signup"
            className="text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => onOpenChange(false)}
          >
            {t('auth.prompt.signupLink')}
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openPrompt = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <AuthPromptContext.Provider value={{ openPrompt }}>
      {children}
      <AuthPromptDialog open={isOpen} onOpenChange={setIsOpen} />
    </AuthPromptContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const { openPrompt } = useContext(AuthPromptContext);

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (user) {
        callback();
      } else {
        openPrompt();
      }
    },
    [user, openPrompt],
  );

  return { user, isLoading, requireAuth };
}
