import { z } from 'zod'

// Factory function for client-side validation with i18n
export const createContactMessageSchema = (t: (key: string) => string) =>
  z.object({
    senderName: z
      .string()
      .min(2, t('contact.error.nameMin'))
      .max(100, t('contact.error.nameMax')),
    senderEmail: z
      .string()
      .min(1, t('contact.error.emailRequired'))
      .email(t('contact.error.emailInvalid')),
    subject: z
      .string()
      .min(5, t('contact.error.subjectMin'))
      .max(200, t('contact.error.subjectMax')),
    message: z
      .string()
      .min(20, t('contact.error.messageMin'))
      .max(2000, t('contact.error.messageMax')),
  })

// Static schema for server-side validation (English messages)
export const contactMessageSchema = z.object({
  senderName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  senderEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be at most 200 characters'),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must be at most 2000 characters'),
})

export type ContactMessageFormData = z.infer<typeof contactMessageSchema>
