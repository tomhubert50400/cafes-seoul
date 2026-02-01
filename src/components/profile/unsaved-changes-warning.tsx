'use client';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * Warns user before leaving page with unsaved form changes
 * Uses browser's beforeunload event
 */
export function UnsavedChangesWarning() {
  const { formState: { isDirty } } = useFormContext();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome/Safari
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return null;
}
