import React, { type PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

/**
 * لفافه‌ی HTMLِ ریشه برای خروجیِ وب/PWA (فقط وب — روی نیتیو نادیده گرفته می‌شود).
 * اینجا manifest، متاهای PWA و ثبتِ سرویس‌ورکر تزریق می‌شوند تا خروجی «قابلِ نصب» شود.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />

        {/* رنگِ نوارِ مرورگر و پس‌زمینه‌ی نصب */}
        <meta name="theme-color" content="#0F0A0C" />

        {/* PWA — اندروید/دسکتاپ */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="نودوست" />

        {/* PWA — iOS (سافاری beforeinstallprompt ندارد؛ این‌ها لازم‌اند) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="نودوست" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />

        {/* پس‌زمینه‌ی تیره پیش از سوارشدنِ React تا فلشِ سفید رخ ندهد */}
        <style dangerouslySetInnerHTML={{ __html: BACKGROUND_CSS }} />
        <ScrollViewStyleReset />

        {/* ثبتِ سرویس‌ورکر — شرطِ «قابلِ نصب بودن» را کامل می‌کند */}
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTER }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const BACKGROUND_CSS = `
html, body { background-color: #0F0A0C; }
@media (prefers-color-scheme: light) { html, body { background-color: #0F0A0C; } }
`;

const SW_REGISTER = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
`;
