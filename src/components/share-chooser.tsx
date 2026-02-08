'use client';

import { Share2, Copy, Mail, MessageCircle, Check } from 'lucide-react';
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
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(message)}`,
      icon: <MessageCircle className="h-5 w-5 text-[#25D366]" />,
    },
    {
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(cafeName)}`,
      icon: <MessageCircle className="h-5 w-5 text-[#0088cc]" />,
    },
    {
      name: 'KakaoTalk',
      href: `https://story.kakao.com/share?url=${encodeURIComponent(url)}`,
      icon: <MessageCircle className="h-5 w-5 text-[#FEE500]" />,
    },
    {
      name: t('share.email'),
      href: `mailto:?subject=${encodeURIComponent(cafeName)}&body=${encodeURIComponent(message)}`,
      icon: <Mail className="h-5 w-5 text-muted-foreground" />,
    },
  ];

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('share.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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
              {option.icon}
              <span className="text-sm font-medium">{option.name}</span>
            </a>
          ))}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent text-left"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{t('share.copyLink')}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
