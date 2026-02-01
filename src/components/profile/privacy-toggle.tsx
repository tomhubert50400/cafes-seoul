'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updatePrivacyAction } from '@/lib/actions/profile';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

interface PrivacyToggleProps {
  isPrivate: boolean;
  translations: {
    title: string;
    description: string;
    publicLabel: string;
    privateLabel: string;
    updating: string;
    updateSuccess: string;
    updateError: string;
  };
}

export function PrivacyToggle({ isPrivate, translations: t }: PrivacyToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [localIsPrivate, setLocalIsPrivate] = useState(isPrivate);

  const handleToggle = (checked: boolean) => {
    setLocalIsPrivate(checked);

    startTransition(async () => {
      const result = await updatePrivacyAction(checked);

      if (result.success) {
        toast.success(t.updateSuccess);
      } else {
        // Revert on error
        setLocalIsPrivate(!checked);
        toast.error(result.error || t.updateError);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {localIsPrivate ? (
            <EyeOff className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Eye className="h-5 w-5 text-muted-foreground" />
          )}
          <CardTitle>{t.title}</CardTitle>
        </div>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="privacy-toggle" className="flex flex-col gap-1">
            <span>{localIsPrivate ? t.privateLabel : t.publicLabel}</span>
          </Label>
          <Switch
            id="privacy-toggle"
            checked={localIsPrivate}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
