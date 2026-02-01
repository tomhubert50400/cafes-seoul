// Token verification utility for unsubscribe links in Next.js
// Mirrors the Edge Function logic but uses Node.js crypto

interface TokenPayload {
  userId: string
  exp: number
}

export async function verifyUnsubscribeToken(token: string): Promise<{ userId: string } | null> {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) {
    console.error('UNSUBSCRIBE_SECRET not configured')
    return null
  }

  try {
    const [payloadB64, sigB64] = token.split('.')
    if (!payloadB64 || !sigB64) return null

    // Decode payload (handle URL-safe base64)
    const payloadPadded = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
    const payloadString = Buffer.from(payloadPadded, 'base64').toString('utf-8')
    const payload: TokenPayload = JSON.parse(payloadString)

    // Check expiry
    if (payload.exp < Date.now()) return null

    // Verify signature using Node.js crypto
    const crypto = await import('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payloadString)
    const expectedSig = hmac.digest()

    // Decode received signature
    const sigPadded = sigB64.replace(/-/g, '+').replace(/_/g, '/')
    const receivedSig = Buffer.from(sigPadded, 'base64')

    // Timing-safe comparison
    if (!crypto.timingSafeEqual(expectedSig, receivedSig)) {
      return null
    }

    return { userId: payload.userId }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}
