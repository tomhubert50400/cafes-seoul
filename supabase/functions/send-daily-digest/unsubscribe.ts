// supabase/functions/send-daily-digest/unsubscribe.ts

const UNSUBSCRIBE_SECRET = Deno.env.get('UNSUBSCRIBE_SECRET')!

interface TokenPayload {
  userId: string
  exp: number
}

export async function generateUnsubscribeToken(userId: string): Promise<string> {
  const payload: TokenPayload = {
    userId,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days expiry
  }

  const payloadString = JSON.stringify(payload)
  const encoder = new TextEncoder()

  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(UNSUBSCRIBE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Sign the payload
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadString)
  )

  // Base64URL encode both parts
  const payloadB64 = btoa(payloadString)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${payloadB64}.${sigB64}`
}

export async function verifyUnsubscribeToken(token: string): Promise<{ userId: string } | null> {
  try {
    const [payloadB64, sigB64] = token.split('.')
    if (!payloadB64 || !sigB64) return null

    // Decode payload
    const payloadString = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    const payload: TokenPayload = JSON.parse(payloadString)

    // Check expiry
    if (payload.exp < Date.now()) return null

    // Verify signature
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(UNSUBSCRIBE_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // Decode signature
    const sigString = atob(sigB64.replace(/-/g, '+').replace(/_/g, '/'))
    const sigArray = new Uint8Array([...sigString].map(c => c.charCodeAt(0)))

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigArray,
      encoder.encode(payloadString)
    )

    if (!valid) return null

    return { userId: payload.userId }
  } catch {
    return null
  }
}
