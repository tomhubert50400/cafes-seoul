import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Seoul Cafe Guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Coffee cup icon */}
        <div
          style={{
            fontSize: 80,
            marginBottom: 24,
            display: 'flex',
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e8d5b7"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
            <line x1="6" x2="6" y1="2" y2="4" />
            <line x1="10" x2="10" y1="2" y2="4" />
            <line x1="14" x2="14" y1="2" y2="4" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 8,
            display: 'flex',
          }}
        >
          Seoul Cafe Guide
        </div>

        {/* Korean subtitle */}
        <div
          style={{
            fontSize: 32,
            color: '#e8d5b7',
            marginBottom: 32,
            display: 'flex',
          }}
        >
          서울 카페 가이드
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
          }}
        >
          Discover the best cafes in Seoul
        </div>
      </div>
    ),
    { ...size }
  );
}
