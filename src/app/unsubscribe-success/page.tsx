import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Unsubscribed | Cafes Seoul',
}

export default function UnsubscribeSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 text-6xl">
          <span role="img" aria-label="Check mark">&#10003;</span>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          You've been unsubscribed
        </h1>
        <p className="mb-8 text-gray-600">
          You will no longer receive email notifications from Cafes Seoul.
        </p>
        <div className="space-y-4">
          <Link
            href="/profile/settings?tab=notifications"
            className="block text-sm text-gray-500 hover:text-gray-700"
          >
            Change notification settings
          </Link>
          <Link
            href="/"
            className="block text-sm text-blue-600 hover:text-blue-700"
          >
            Return to Cafes Seoul
          </Link>
        </div>
      </div>
    </div>
  )
}
