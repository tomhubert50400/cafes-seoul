'use client'

import { useEffect, useRef } from 'react'

interface FieldConfig {
  id: string
  name: string
}

interface UseAutofillDetectionOptions {
  fields: FieldConfig[]
  onAutofill: (fieldName: string, value: string) => void
  enabled?: boolean
}

/**
 * Hook to detect password manager autofill (Dashlane, 1Password, etc.)
 * and trigger callbacks to update form state.
 * 
 * Uses multiple detection strategies:
 * 1. onInput event (fires for autofill in modern browsers)
 * 2. Polling for first 3 seconds (catches delayed autofill)
 * 3. Animation events (Chrome/Edge autofill detection)
 * 
 * Usage:
 * const { hasDetected } = useAutofillDetection({
 *   fields: [
 *     { id: 'email', name: 'email' },
 *     { id: 'password', name: 'password' }
 *   ],
 *   onAutofill: (field, value) => {
 *     setValue(field, value, { shouldValidate: true })
 *   }
 * })
 */
export function useAutofillDetection({
  fields,
  onAutofill,
  enabled = true,
}: UseAutofillDetectionOptions) {
  const hasDetectedRef = useRef<Record<string, boolean>>({})
  const lastValuesRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Strategy 1: onInput event (most reliable for modern browsers)
    const handleInput = (fieldName: string) => (e: Event) => {
      const input = e.target as HTMLInputElement
      
      if (input.value && input.value !== lastValuesRef.current[fieldName]) {
        lastValuesRef.current[fieldName] = input.value
        onAutofill(fieldName, input.value)
        hasDetectedRef.current[fieldName] = true
      }
    }

    // Strategy 2: Check for values via polling (for delayed autofill)
    const checkAutofill = () => {
      fields.forEach(({ id, name }) => {
        // Skip if already detected for this field
        if (hasDetectedRef.current[name]) return

        const input = document.getElementById(id) as HTMLInputElement | null
        if (!input) return

        const domValue = input.value

        // If DOM has value and it's different from last known, sync it
        if (domValue && domValue !== lastValuesRef.current[name]) {
          lastValuesRef.current[name] = domValue
          onAutofill(name, domValue)
          hasDetectedRef.current[name] = true
        }
      })
    }

    // Strategy 3: Animation events (Chrome/Edge specific)
    const handleAnimationStart = (fieldName: string) => (e: AnimationEvent) => {
      if (e.animationName === 'onAutoFillStart') {
        // Small delay to let the value be filled
        setTimeout(() => {
          const input = e.target as HTMLInputElement
          if (input.value && input.value !== lastValuesRef.current[fieldName]) {
            lastValuesRef.current[fieldName] = input.value
            onAutofill(fieldName, input.value)
            hasDetectedRef.current[fieldName] = true
          }
        }, 10)
      }
    }

    // Set up event listeners
    const cleanupFns: Array<() => void> = []

    fields.forEach(({ id, name }) => {
      const input = document.getElementById(id)
      if (!input) return

      // onInput event
      const inputHandler = handleInput(name)
      input.addEventListener('input', inputHandler)
      cleanupFns.push(() => input.removeEventListener('input', inputHandler))

      // Animation event (Chrome/Edge)
      const animHandler = handleAnimationStart(name)
      input.addEventListener('animationstart', animHandler)
      cleanupFns.push(() => input.removeEventListener('animationstart', animHandler))
    })

    // Polling for first 3 seconds (for delayed autofill)
    const intervalId = setInterval(checkAutofill, 50)
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId)
    }, 3000)

    // Initial check
    requestAnimationFrame(checkAutofill)

    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
      cleanupFns.forEach(fn => fn())
    }
  }, [fields, onAutofill, enabled])

  return {
    hasDetected: hasDetectedRef.current,
  }
}

// CSS keyframes for Chrome/Edge autofill detection
// Add this to your global CSS (e.g., app/globals.css):
/*
@keyframes onAutoFillStart {
  from { opacity: 0.99; }
  to { opacity: 1; }
}

input:-webkit-autofill {
  animation-name: onAutoFillStart;
  animation-duration: 1ms;
}
*/
