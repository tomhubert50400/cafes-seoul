'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n';
import { logout } from '@/app/actions/auth';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/client';
import { User as UserIcon, LogOut, FileText, Settings, LayoutDashboard, Shield } from 'lucide-react';

interface UserMenuProps {
  user: SupabaseUser;
}

function getInitials(email: string): string {
  const localPart = email.split('@')[0];
  return localPart.slice(0, 2).toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const email = user.email || '';
  const initials = getInitials(email);
  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = user.user_metadata?.name || email;

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setIsAdmin(profile?.role === 'admin');
    };
    checkAdmin();
  }, [user.id]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open user menu"
        >
          <Avatar size="sm">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User info header */}
        <div className="flex items-center gap-3 p-3">
          <Avatar size="sm">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu items */}
        <DropdownMenuItem asChild>
          <Link
            href={ROUTES.PROFILE}
            className="flex cursor-pointer items-center gap-2"
          >
            <UserIcon className="h-4 w-4" />
            {t('nav.profile')}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href={ROUTES.DASHBOARD}
            className="flex cursor-pointer items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t('nav.contributions')}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href={ROUTES.PROFILE_REVIEWS}
            className="flex cursor-pointer items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {t('nav.myReviews')}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href={ROUTES.PROFILE_SETTINGS}
            className="flex cursor-pointer items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {t('nav.settings')}
          </Link>
        </DropdownMenuItem>

        {/* Admin link (conditionally rendered) */}
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link
              href={ROUTES.ADMIN}
              className="flex cursor-pointer items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              {t('nav.admin')}
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem asChild>
          <form action={logout} className="w-full">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2 text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {t('auth.logout')}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
