'use client';

import { Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

interface ShareChooserProps {
  cafeName: string;
  cafeSlug: string;
  trigger: React.ReactNode;
}

export function ShareChooser({ cafeName, cafeSlug, trigger }: ShareChooserProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/cafes/${cafeSlug}`
    : '';
  const message = `${cafeName} — ${url}`;

  const shareOptions = [
    {
      name: t('share.whatsapp'),
      href: `https://wa.me/?text=${encodeURIComponent(message)}`,
      icon: '/icons/whatsapp.svg',
    },
    {
      name: t('share.telegram'),
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(cafeName)}`,
      icon: '/icons/telegram.svg',
    },
    {
      name: t('share.x'),
      href: `https://x.com/intent/tweet?text=${encodeURIComponent(message)}`,
      icon: '/icons/x.svg',
    },
  ];

  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  async function handleNativeShare() {
    try {
      await navigator.share({ title: cafeName, url });
    } catch {
      // User cancelled or share failed silently
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('share.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success(t('share.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            {t('share.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {shareOptions.map((option) => (
            <a
              key={option.name}
              href={option.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <img
                src={option.icon}
                alt=""
                width={24}
                height={24}
                className="shrink-0"
              />
              <span className="text-sm font-medium">{option.name}</span>
            </a>
          ))}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent text-left"
          >
            {copied ? (
              <Check className="h-6 w-6 text-green-500" />
            ) : (
              <Copy className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{t('share.copyLink')}</span>
          </button>
          {supportsNativeShare && (
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent text-left"
            >
              <Share2 className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">{t('share.more')}</span>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
