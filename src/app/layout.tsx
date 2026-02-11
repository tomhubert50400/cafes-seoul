import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { I18nProvider } from "@/lib/i18n";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME, SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";
import type { LanguageCode } from "@/lib/i18n/languages";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Seoul Cafe Guide | 서울 카페 가이드",
    template: "%s | Seoul Cafe",
  },
  description: "Discover the best cafes in Seoul. 서울의 베스트 카페를 찾아보세요.",
  openGraph: {
    type: 'website',
    siteName: 'Seoul Cafe Guide',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;
  const initialLanguage: LanguageCode =
    langCookie && langCookie in SUPPORTED_LANGUAGES ? (langCookie as LanguageCode) : DEFAULT_LANGUAGE;

  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="//dapi.kakao.com" />
        <link rel="preconnect" href="//dapi.kakao.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} font-sans antialiased overflow-x-hidden`}
      >
        <I18nProvider initialLanguage={initialLanguage}>
          <div id="main-content">
            {children}
          </div>
          <Toaster position="top-right" richColors closeButton />
          <CookieConsent />
        </I18nProvider>
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAPS_API_KEY}&libraries=clusterer,services&autoload=false`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
