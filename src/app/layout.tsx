import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import SiteShell from '@/components/SiteShell'
import { FB_PIXEL_ID } from '@/lib/pixel'
import { bigShoulders, barlow, barlowCondensed } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Muscle Meals | Comida preparada saludable en Monterrey',
  description: 'Comida preparada, porcionada y cocinada con los macros exactos para tus metas fitness. Elige tus porciones, arma tu menú semanal o mensual y recíbelo cada semana listo para comer.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${bigShoulders.variable} ${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        <SiteShell>{children}</SiteShell>
        {FB_PIXEL_ID && (
          <>
            <Script
              id="fb-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window,document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init','${FB_PIXEL_ID}');
                  fbq('track','PageView');
                `,
              }}
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height={1}
                width={1}
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </body>
    </html>
  )
}
