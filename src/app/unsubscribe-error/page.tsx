import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Unsubscribe Error | Cafes Seoul',
}

export default function UnsubscribeErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string }
}) {
  const reason = searchParams.reason

  let message = 'Something went wrong while processing your request.'
  if (reason === 'missing') {
    message = 'The unsubscribe link is missing required information.'
  } else if (reason === 'invalid') {
    message = 'This unsubscribe link has expired or is invalid.'
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 text-6xl text-red-500">
          <span role="img" aria-label="Warning">&#9888;</span>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          Unsubscribe Failed
        </h1>
        <p className="mb-8 text-gray-600">{message}</p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            To manage your notifications, please log in and visit your settings.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
