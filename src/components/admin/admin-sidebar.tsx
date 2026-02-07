'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminNav } from './admin-nav';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile burger button */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-[4.5rem] z-50 bg-background shadow-md h-12 w-12"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background p-4 pt-14 transition-transform duration-200 ease-in-out',
          'md:relative md:top-0 md:h-auto md:min-h-[calc(100vh-4rem)] md:translate-x-0 md:pt-4',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <AdminNav onNavigate={() => setIsOpen(false)} />
      </aside>
    </>
  );
}

