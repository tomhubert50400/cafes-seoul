'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createContactMessageSchema } from '@/lib/validations/contact';
import { sendContactMessage } from '@/lib/actions/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';
import type { ContactMessageFormData } from '@/lib/validations/contact';

interface ContactFormProps {
  translations: Record<string, string>;
  defaultName?: string;
  defaultEmail?: string;
  isLoggedIn?: boolean;
}

export function ContactForm({
  translations: t,
  defaultName = '',
  defaultEmail = '',
  isLoggedIn = false,
}: ContactFormProps) {
  const [isPending, startTransition] = useTransition();

  const schema = createContactMessageSchema((key: string) => t[key] || key);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactMessageFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      senderName: defaultName,
      senderEmail: defaultEmail,
      subject: '',
      message: '',
    },
  });

  const onSubmit = (data: ContactMessageFormData) => {
    startTransition(async () => {
      const result = await sendContactMessage(data);

      if (result.success) {
        toast.success(t['contact.success']);
        reset({
          senderName: defaultName,
          senderEmail: defaultEmail,
          subject: '',
          message: '',
        });
      } else {
        toast.error(result.error || t['contact.error']);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t['contact.title']}</CardTitle>
        <CardDescription>{t['contact.description']}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="senderName">{t['contact.name']}</Label>
            <Input
              id="senderName"
              {...register('senderName')}
              placeholder={t['contact.namePlaceholder']}
              disabled={isPending}
            />
            {errors.senderName && (
              <p className="text-sm text-destructive">{errors.senderName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="senderEmail">{t['contact.email']}</Label>
            <Input
              id="senderEmail"
              type="email"
              {...register('senderEmail')}
              placeholder={t['contact.emailPlaceholder']}
              disabled={isPending}
            />
            {errors.senderEmail && (
              <p className="text-sm text-destructive">{errors.senderEmail.message}</p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">{t['contact.subject']}</Label>
            <Input
              id="subject"
              {...register('subject')}
              placeholder={t['contact.subjectPlaceholder']}
              disabled={isPending}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">{t['contact.message']}</Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder={t['contact.messagePlaceholder']}
              rows={6}
              disabled={isPending}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" disabled={isPending} className="w-full min-h-[44px]">
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            {isPending ? t['contact.sending'] : t['contact.send']}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
