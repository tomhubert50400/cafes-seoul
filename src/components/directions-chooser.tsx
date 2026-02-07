'use client';

import { Navigation } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { EXTERNAL_URLS } from '@/lib/constants/routes';

interface DirectionsChooserProps {
  address: string;
  latitude: number;
  longitude: number;
  trigger: React.ReactNode;
}

export function DirectionsChooser({
  address,
  latitude,
  longitude,
  trigger,
}: DirectionsChooserProps) {
  const { t } = useI18n();

  const encodedAddress = encodeURIComponent(address);

  const mapOptions = [
    {
      name: t('cafe.googleMaps'),
      href: `${EXTERNAL_URLS.GOOGLE_MAPS}/dir/?api=1&destination=${latitude},${longitude}`,
      icon: '/icons/google-maps.svg',
    },
    {
      name: t('cafe.naverMap'),
      href: `${EXTERNAL_URLS.NAVER_MAP}/p/search/${encodedAddress}`,
      icon: '/icons/naver-map.svg',
    },
    {
      name: t('cafe.kakaoMap'),
      href: `${EXTERNAL_URLS.KAKAO_MAP}/link/to/${encodedAddress},${latitude},${longitude}`,
      icon: '/icons/kakao-map.svg',
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            {t('directions.chooseApp')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {mapOptions.map((option) => (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
