import Script from "next/script";
import type { Metadata, Viewport } from "next";
import "@fontsource/space-grotesk/300.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "./globals.css";
import { JourneyTracker } from "@/components/JourneyTracker";
import { AffiliateTracker } from "@/components/affiliate/AffiliateTracker";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.riquezaoculta.click"),
  title: "Simulador de Riqueza",
  description: "Descobre os 5 pilares que determinam o teu potencial de riqueza. Faz o quiz gratuito e recebe o teu perfil financeiro personalizado.",
  openGraph: {
    title: "Simulador de Riqueza",
    description: "Descobre os 5 pilares que determinam o teu potencial de riqueza.",
    url: "https://www.riquezaoculta.click",
    siteName: "Riqueza Oculta",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Simulador de Riqueza" }],
    locale: "pt_PT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Simulador de Riqueza",
    description: "Descobre os 5 pilares que determinam o teu potencial de riqueza.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1657596105292926";

  return (
    <html lang="pt">
      <head>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <JourneyTracker />
        <AffiliateTracker />
        {children}
      </body>
    </html>
  );
}
