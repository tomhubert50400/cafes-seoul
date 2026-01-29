'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface FormLoadingOverlayProps {
  isLoading: boolean
  message: string
  onCancel?: () => void
  cancelLabel?: string
}

export function FormLoadingOverlay({
  isLoading,
  message,
  onCancel,
  cancelLabel = 'Cancel',
}: FormLoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="mt-2"
          >
            {cancelLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
