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
import { useI18n, LanguageCode } from '@/lib/i18n';
import { Flag } from '@/components/ui/flag';
import { logout } from '@/app/actions/auth';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/client';
import { User as UserIcon, LogOut, FileText, Settings, LayoutDashboard, Shield, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
  user: SupabaseUser;
}

function getInitials(email: string): string {
  const localPart = email.split('@')[0];
  return localPart.slice(0, 2).toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  const { t, language, setLanguage, languages } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);

  const handleLanguageChange = (langCode: LanguageCode) => {
    setLanguage(langCode);
    router.refresh();
  };

  const email = user.email || '';
  const initials = getInitials(email);
  const avatarUrl = profileAvatarUrl || user.user_metadata?.avatar_url;
  const displayName = profileDisplayName || user.user_metadata?.name || user.user_metadata?.display_name || email;

  useEffect(() => {
    const loadProfileAndAdmin = async () => {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, display_name, username, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Use display_name or username from profiles table
        setProfileDisplayName(profile.display_name || profile.username || null);

        // Build avatar URL: OAuth users have full URLs, uploaded avatars have storage paths
        if (profile.avatar_url) {
          if (profile.avatar_url.startsWith('http')) {
            setProfileAvatarUrl(profile.avatar_url);
          } else {
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(profile.avatar_url);
            setProfileAvatarUrl(urlData.publicUrl);
          }
        }

        const admin = profile.role === 'admin';
        setIsAdmin(admin);

        if (admin) {
          const { count } = await supabase
            .from('contact_messages')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);
          setUnreadMessages(count ?? 0);
        }
      }
    };
    loadProfileAndAdmin();
  }, [user.id]);

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (!v) setLangOpen(false); }}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open user menu"
        >
          <Avatar>
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {unreadMessages > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User info header */}
        <DropdownMenuItem asChild>
          <Link href={ROUTES.PROFILE} className="flex items-center gap-3 p-3 cursor-pointer">
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
          </Link>
        </DropdownMenuItem>

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

        {/* Language switcher - mobile only, inline expand */}
        <div className="md:hidden">
          <DropdownMenuSeparator />
          <button
            type="button"
            onClick={() => setLangOpen(!langOpen)}
            className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
          >
            <Flag language={language} size={16} />
            <span>{languages[language].nativeName}</span>
            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>
          {langOpen && (
            <div className="py-1">
              {Object.values(languages).map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as LanguageCode)}
                  className={language === lang.code ? 'bg-accent' : ''}
                >
                  <Flag language={lang.code} size={16} className="mr-2" />
                  <span>{lang.nativeName}</span>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>

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
