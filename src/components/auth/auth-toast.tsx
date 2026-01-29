"use client"

import { toast } from "sonner"
import { LanguageCode } from "@/lib/i18n/languages"
import { getTranslation } from "@/lib/i18n/translations"

/**
 * Translation function type
 */
type TranslationFn = (key: string, params?: Record<string, string>) => string

/**
 * Create a translation function for a specific language
 */
export function createTranslationFn(lang: LanguageCode): TranslationFn {
  return (key: string, params?: Record<string, string>) => {
    let text = getTranslation(lang, key)
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value))
      })
    }
    return text
  }
}

/**
 * Show an authentication error toast
 * @param message - The error message to display
 * @param t - Translation function
 */
export function showAuthError(message: string, t: TranslationFn): void {
  toast.error(message, {
    duration: 6000,
    icon: undefined, // Use default error icon from Sonner
  })
}

/**
 * Show an authentication success toast
 * @param message - The success message to display
 * @param t - Translation function
 */
export function showAuthSuccess(message: string, t: TranslationFn): void {
  toast.success(message, {
    duration: 4000,
    icon: undefined, // Use default success icon from Sonner
  })
}

/**
 * Show a loading toast for authentication operations
 * @param message - The loading message to display
 * @param t - Translation function
 * @returns The toast ID for later dismissal
 */
export function showAuthLoading(message: string, t: TranslationFn): string {
  const toastId = toast.loading(message, {
    duration: Infinity, // Loading toasts don't auto-dismiss
    icon: undefined, // Use default loading icon from Sonner
  })
  return String(toastId)
}

/**
 * Dismiss a specific toast by ID
 * @param toastId - The ID of the toast to dismiss
 */
export function dismissAuthToast(toastId: string): void {
  toast.dismiss(toastId)
}

/**
 * Show multiple validation errors in a single toast
 * @param errors - Object mapping field names to arrays of error messages
 * @param t - Translation function
 */
export function showAuthErrors(errors: Record<string, string[]>, t: TranslationFn): void {
  const errorCount = Object.values(errors).reduce((sum, msgs) => sum + msgs.length, 0)
  
  if (errorCount === 0) return
  
  const title = errorCount === 1 
    ? t('auth.toast.error.title')
    : t('auth.toast.error.multiple', { count: String(errorCount) })
  
  const description = Object.entries(errors)
    .flatMap(([, messages]) => messages)
    .join('\n')
  
  toast.error(title, {
    description,
    duration: 8000,
  })
}

/**
 * Update an existing loading toast to show success
 * @param toastId - The ID of the loading toast
 * @param message - The success message
 * @param t - Translation function
 */
export function updateAuthToastToSuccess(toastId: string, message: string, t: TranslationFn): void {
  toast.success(message, {
    id: toastId,
    duration: 4000,
  })
}

/**
 * Update an existing loading toast to show error
 * @param toastId - The ID of the loading toast
 * @param message - The error message
 * @param t - Translation function
 */
export function updateAuthToastToError(toastId: string, message: string, t: TranslationFn): void {
  toast.error(message, {
    id: toastId,
    duration: 6000,
  })
}
